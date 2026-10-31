import { cache } from 'react';
import { getCache } from '@vercel/functions';
import { prisma } from '@robot-jobs-board/db';
import type { SnapshotJob } from '@robot-jobs-board/snapshot';

/**
 * Tiny Neon read for active Featured jobs/boosts. Allowed even when SNAPSHOT_ONLY=1
 * so paid posts go live without waiting for the daily snapshot rebuild.
 *
 * Public pages must not query Neon on every request: an empty result is stored in
 * Vercel Runtime Cache (shared across Fluid isolates). Stripe webhook / success
 * expires that entry so a new Featured listing appears immediately.
 */
export function isFeaturedOverlayEnabled(): boolean {
  if (process.env.DISABLE_FEATURED_OVERLAY === '1') return false;
  return Boolean(process.env.DATABASE_URL?.trim());
}

export type FeaturedBoostStamp = {
  jobId: string;
  jobSlug: string;
  featuredUntil: string;
  featuredAt: string;
};

export type FeaturedOverlayPayload = {
  jobs: SnapshotJob[];
  boosts: FeaturedBoostStamp[];
};

const EMPTY_OVERLAY: FeaturedOverlayPayload = { jobs: [], boosts: [] };

/** Shared by Next Data Cache tags and Runtime Cache invalidation. */
export const FEATURED_OVERLAY_CACHE_TAG = 'featured-overlay-v1';
const FEATURED_OVERLAY_CACHE_KEY = 'payload';
const FEATURED_OVERLAY_CACHE_TTL_SECONDS = 86400;
/** Avoid a Neon round-trip on every SSG/ISR page in the same isolate. Runtime Cache is the cross-isolate layer. */
const FEATURED_OVERLAY_MEMORY_TTL_MS = 60_000;

type MemoryOverlay = { payload: FeaturedOverlayPayload; until: number };

let memoryOverlay: MemoryOverlay | null = null;
let inflightOverlay: Promise<FeaturedOverlayPayload> | null = null;
let overlayGeneration = 0;

function readMemoryOverlay(now = Date.now()): FeaturedOverlayPayload | undefined {
  if (!memoryOverlay || memoryOverlay.until <= now) return undefined;
  return memoryOverlay.payload;
}

function writeMemoryOverlay(payload: FeaturedOverlayPayload, now = Date.now()): void {
  memoryOverlay = { payload, until: now + FEATURED_OVERLAY_MEMORY_TTL_MS };
}

function clearMemoryOverlay(): void {
  memoryOverlay = null;
}

const featuredSelect = {
  id: true,
  slug: true,
  title: true,
  descriptionHtml: true,
  descriptionPlain: true,
  url: true,
  locationRaw: true,
  country: true,
  region: true,
  city: true,
  isRemote: true,
  workplaceType: true,
  employmentType: true,
  department: true,
  compensationText: true,
  postedAt: true,
  expiresAt: true,
  createdAt: true,
  isHidden: true,
  isActive: true,
  sourceSystem: true,
  externalId: true,
  companyId: true,
  featuredUntil: true,
  featuredAt: true,
  company: {
    select: { name: true, slug: true, website: true, logoUrl: true, sourceIdentifier: true },
  },
  robotDomains: {
    select: { domainId: true, domain: { select: { id: true, slug: true, name: true } } },
  },
  techTags: { select: { techTag: { select: { id: true, slug: true, label: true } } } },
  seniorities: { select: { seniority: { select: { id: true, slug: true, label: true } } } },
} as const;

function toSnapshotJob(
  job: Awaited<ReturnType<typeof prisma.job.findMany<{ select: typeof featuredSelect }>>>[number],
): SnapshotJob {
  return {
    id: job.id,
    slug: job.slug,
    title: job.title,
    descriptionHtml: job.descriptionHtml,
    descriptionPlain: job.descriptionPlain,
    url: job.url,
    locationRaw: job.locationRaw,
    country: job.country,
    region: job.region,
    city: job.city,
    isRemote: job.isRemote,
    workplaceType: job.workplaceType,
    employmentType: job.employmentType,
    department: job.department,
    compensationText: job.compensationText,
    postedAt: job.postedAt?.toISOString() ?? null,
    expiresAt: job.expiresAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
    isHidden: job.isHidden,
    isActive: job.isActive,
    sourceSystem: job.sourceSystem,
    externalId: job.externalId,
    companyId: job.companyId,
    company: {
      name: job.company.name,
      slug: job.company.slug,
      website: job.company.website,
      logoUrl: job.company.logoUrl,
      sourceIdentifier: job.company.sourceIdentifier,
    },
    robotDomains: job.robotDomains,
    techTags: job.techTags,
    seniorities: job.seniorities,
    featuredUntil: job.featuredUntil?.toISOString() ?? null,
    featuredAt: job.featuredAt?.toISOString() ?? null,
  };
}

function featuredRuntimeCache() {
  return getCache({ namespace: 'robot-jobs-board-featured' });
}

function isOverlayPayload(value: unknown): value is FeaturedOverlayPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as FeaturedOverlayPayload;
  return Array.isArray(payload.jobs) && Array.isArray(payload.boosts);
}

async function readFeaturedOverlayCache(): Promise<FeaturedOverlayPayload | undefined> {
  try {
    const value = await featuredRuntimeCache().get(FEATURED_OVERLAY_CACHE_KEY);
    return isOverlayPayload(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

async function writeFeaturedOverlayCache(payload: FeaturedOverlayPayload): Promise<void> {
  try {
    await featuredRuntimeCache().set(FEATURED_OVERLAY_CACHE_KEY, payload, {
      ttl: FEATURED_OVERLAY_CACHE_TTL_SECONDS,
      tags: [FEATURED_OVERLAY_CACHE_TAG],
      name: 'featured-overlay',
    });
  } catch (error) {
    console.warn(
      JSON.stringify({
        event: 'featured.overlay.cache_write_failed',
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}

/** Drop the empty/full overlay cache so the next public read hits Neon (after pay). */
export async function expireFeaturedOverlayCache(): Promise<void> {
  overlayGeneration += 1;
  clearMemoryOverlay();
  inflightOverlay = null;
  try {
    const cache = featuredRuntimeCache();
    await cache.expireTag(FEATURED_OVERLAY_CACHE_TAG);
    await cache.delete(FEATURED_OVERLAY_CACHE_KEY);
  } catch {
    // Ignore — Next revalidateTag still runs for Data Cache.
  }
}

async function queryActiveFeaturedOverlay(): Promise<FeaturedOverlayPayload> {
  const now = new Date();
  const [jobRows, boostRows] = await Promise.all([
    prisma.job.findMany({
      where: {
        isActive: true,
        isHidden: false,
        featuredUntil: { gt: now },
      },
      select: featuredSelect,
      orderBy: [{ featuredAt: 'asc' }, { id: 'asc' }],
      take: 50,
    }),
    prisma.featuredBoost.findMany({
      where: { featuredUntil: { gt: now } },
      select: { jobId: true, jobSlug: true, featuredUntil: true, featuredAt: true },
      orderBy: [{ featuredAt: 'asc' }, { jobId: 'asc' }],
      take: 50,
    }),
  ]);
  return {
    jobs: jobRows.map((row) => toSnapshotJob(row)),
    boosts: boostRows.map((row) => ({
      jobId: row.jobId,
      jobSlug: row.jobSlug,
      featuredUntil: row.featuredUntil.toISOString(),
      featuredAt: row.featuredAt.toISOString(),
    })),
  };
}

async function queryAndCacheFeaturedOverlay(): Promise<FeaturedOverlayPayload> {
  const generation = overlayGeneration;
  try {
    const payload = await queryActiveFeaturedOverlay();
    console.log(
      JSON.stringify({
        event: 'featured.overlay.neon',
        jobs: payload.jobs.length,
        boosts: payload.boosts.length,
      }),
    );
    if (generation !== overlayGeneration) return payload;
    await writeFeaturedOverlayCache(payload);
    writeMemoryOverlay(payload);
    return payload;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Featured overlay unavailable', error);
    }
    // Do not cache failures (cold start / blip) as "no Featured".
    return EMPTY_OVERLAY;
  }
}

async function loadFeaturedOverlayUncached(): Promise<FeaturedOverlayPayload> {
  if (!isFeaturedOverlayEnabled()) return EMPTY_OVERLAY;

  const fromMemory = readMemoryOverlay();
  if (fromMemory) return fromMemory;

  const cached = await readFeaturedOverlayCache();
  if (cached) {
    writeMemoryOverlay(cached);
    return cached;
  }

  if (!inflightOverlay) {
    inflightOverlay = queryAndCacheFeaturedOverlay().finally(() => {
      inflightOverlay = null;
    });
  }
  return inflightOverlay;
}

/** Per-request memo + Runtime Cache. Empty results skip Neon until TTL or pay. */
export const loadFeaturedOverlay = cache(loadFeaturedOverlayUncached);

export async function loadFeaturedJobs(): Promise<SnapshotJob[]> {
  return (await loadFeaturedOverlay()).jobs;
}

export async function loadFeaturedBoosts(): Promise<FeaturedBoostStamp[]> {
  return (await loadFeaturedOverlay()).boosts;
}

/** Stamp Featured windows from boosts onto matching snapshot jobs. */
export function applyFeaturedBoosts(jobs: SnapshotJob[], boosts: FeaturedBoostStamp[]): SnapshotJob[] {
  if (!boosts.length) return jobs;
  const byId = new Map(boosts.map((b) => [b.jobId, b]));
  return jobs.map((job) => {
    const boost = byId.get(job.id);
    if (!boost) return job;
    return {
      ...job,
      featuredUntil: boost.featuredUntil,
      featuredAt: boost.featuredAt,
    };
  });
}

/** Stable rotation so unlimited Featured share the top without always the same winner. */
export function rotateFeatured<T extends { id: string; featuredAt?: string | null }>(jobs: T[]): T[] {
  if (jobs.length <= 1) return jobs;
  const day = Math.floor(Date.now() / 86_400_000);
  const sorted = [...jobs].sort((a, b) => {
    const aKey = `${a.featuredAt ?? ''}:${a.id}`;
    const bKey = `${b.featuredAt ?? ''}:${b.id}`;
    return aKey.localeCompare(bKey);
  });
  const offset = day % sorted.length;
  return [...sorted.slice(offset), ...sorted.slice(0, offset)];
}

/** Merge Neon Featured jobs into a snapshot list (featured first, deduped). */
export function mergeFeaturedIntoJobs(base: SnapshotJob[], featured: SnapshotJob[]): SnapshotJob[] {
  if (!featured.length) return base;
  const featuredIds = new Set(featured.map((j) => j.id));
  const rest = base.filter((j) => !featuredIds.has(j.id));
  const featuredFromBase = base.filter((j) => featuredIds.has(j.id));
  // Prefer Neon row for direct posts, but keep boosted snapshot fields when Neon lacks the job.
  const mergedFeatured = featured.map((neonJob) => {
    const fromBase = featuredFromBase.find((j) => j.id === neonJob.id);
    return fromBase
      ? { ...fromBase, featuredUntil: neonJob.featuredUntil, featuredAt: neonJob.featuredAt }
      : neonJob;
  });
  return [...rotateFeatured(mergedFeatured), ...rest];
}

export { isJobFeatured } from './is-featured';

/** Resolve from the cached overlay list — never an extra uncached Neon lookup (crawler 404s). */
export async function loadFeaturedJobById(id: string): Promise<SnapshotJob | null> {
  const jobs = await loadFeaturedJobs();
  return jobs.find((job) => job.id === id) ?? null;
}

export async function getBoostForJob(jobId: string): Promise<FeaturedBoostStamp | null> {
  const boosts = await loadFeaturedBoosts();
  return boosts.find((b) => b.jobId === jobId) ?? null;
}
