import { unstable_cache } from 'next/cache';
import { prisma } from '@robot-jobs-board/db';
import type { SnapshotJob } from '@robot-jobs-board/snapshot';

/**
 * Tiny Neon read for active Featured jobs/boosts. Allowed even when SNAPSHOT_ONLY=1
 * so paid posts go live without waiting for the daily snapshot rebuild.
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

async function fetchActiveFeaturedJobs(): Promise<SnapshotJob[]> {
  if (!isFeaturedOverlayEnabled()) return [];
  try {
    const now = new Date();
    const rows = await prisma.job.findMany({
      where: {
        isActive: true,
        isHidden: false,
        featuredUntil: { gt: now },
      },
      select: featuredSelect,
      orderBy: [{ featuredAt: 'asc' }, { id: 'asc' }],
      take: 50,
    });
    return rows.map((row) => toSnapshotJob(row));
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Featured overlay unavailable', error);
    }
    return [];
  }
}

async function fetchActiveFeaturedBoosts(): Promise<FeaturedBoostStamp[]> {
  if (!isFeaturedOverlayEnabled()) return [];
  try {
    const now = new Date();
    const rows = await prisma.featuredBoost.findMany({
      where: { featuredUntil: { gt: now } },
      select: { jobId: true, jobSlug: true, featuredUntil: true, featuredAt: true },
      orderBy: [{ featuredAt: 'asc' }, { jobId: 'asc' }],
      take: 50,
    });
    return rows.map((row) => ({
      jobId: row.jobId,
      jobSlug: row.jobSlug,
      featuredUntil: row.featuredUntil.toISOString(),
      featuredAt: row.featuredAt.toISOString(),
    }));
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Featured boosts unavailable', error);
    }
    return [];
  }
}

/** Long TTL — Stripe webhook / success path bust `featured-overlay-v1` on pay. */
export const loadFeaturedJobs = unstable_cache(fetchActiveFeaturedJobs, ['featured-overlay-v1'], {
  revalidate: 86400,
  tags: ['featured-overlay-v1'],
});

export const loadFeaturedBoosts = unstable_cache(fetchActiveFeaturedBoosts, ['featured-boosts-v1'], {
  revalidate: 86400,
  tags: ['featured-overlay-v1'],
});

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

export async function loadFeaturedJobById(id: string): Promise<SnapshotJob | null> {
  if (!isFeaturedOverlayEnabled()) return null;
  try {
    const now = new Date();
    const job = await prisma.job.findFirst({
      where: {
        id,
        isActive: true,
        isHidden: false,
        featuredUntil: { gt: now },
      },
      select: featuredSelect,
    });
    return job ? toSnapshotJob(job) : null;
  } catch {
    return null;
  }
}

export async function getBoostForJob(
  jobId: string,
): Promise<FeaturedBoostStamp | null> {
  const boosts = await loadFeaturedBoosts();
  return boosts.find((b) => b.jobId === jobId) ?? null;
}
