import { gunzipSync } from 'node:zlib';
import { getSiteUrl } from './api.js';

export type SnapshotJob = {
  id: string;
  slug: string;
  title: string;
  descriptionPlain?: string;
  url: string;
  locationRaw: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  isRemote: boolean;
  workplaceType: string;
  employmentType: string;
  department: string | null;
  compensationText: string | null;
  postedAt: string | null;
  companyId: string;
  company: {
    name: string;
    slug: string;
    website: string | null;
  };
  robotDomains: Array<{ domain: { slug: string; name: string } }>;
  techTags: Array<{ techTag: { slug: string; label: string } }>;
  seniorities: Array<{ seniority: { slug: string; label: string } }>;
};

export type SnapshotJobBody = {
  descriptionHtml: string;
  descriptionPlain: string;
};

export type PublicBoardSnapshot = {
  generatedAt: string;
  siteUrl: string;
  jobs: SnapshotJob[];
  companies: Array<{
    id: string;
    name: string;
    slug: string;
    website: string | null;
    description: string;
    seoIntro: string | null;
    openJobCount: number;
  }>;
  domains: Array<{ slug: string; name: string; description: string; openJobCount: number }>;
  tags: Array<{ slug: string; label: string; openJobCount: number }>;
  seniorities: Array<{ slug: string; label: string }>;
  countryFacets: Array<{ country: string; count: number }>;
};

type CacheEntry = { loadedAt: number; snapshot: PublicBoardSnapshot };

const CACHE_TTL_MS = 15 * 60 * 1000;
let cache: CacheEntry | null = null;
const bodyCache = new Map<string, SnapshotJobBody>();

function parseGzipJson<T>(buffer: Buffer): T {
  return JSON.parse(gunzipSync(buffer).toString('utf8')) as T;
}

export async function loadBoardSnapshot(force = false): Promise<PublicBoardSnapshot> {
  if (!force && cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) {
    return cache.snapshot;
  }

  const response = await fetch(`${getSiteUrl()}/snapshot/board.json.gz`, {
    headers: { 'User-Agent': 'robot-jobs-board-mcp/0.1', Accept: 'application/gzip,application/json' },
  });
  if (!response.ok) {
    throw new Error(`Failed to load board snapshot (${response.status})`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const snapshot = parseGzipJson<PublicBoardSnapshot>(buffer);
  cache = { loadedAt: Date.now(), snapshot };
  return snapshot;
}

export async function loadJobBody(id: string): Promise<SnapshotJobBody | null> {
  const hit = bodyCache.get(id);
  if (hit) return hit;

  const response = await fetch(`${getSiteUrl()}/snapshot/jobs/${encodeURIComponent(id)}.json.gz`, {
    headers: { 'User-Agent': 'robot-jobs-board-mcp/0.1', Accept: 'application/gzip,application/json' },
  });
  if (!response.ok) return null;

  const body = parseGzipJson<SnapshotJobBody>(Buffer.from(await response.arrayBuffer()));
  bodyCache.set(id, body);
  return body;
}

/** Merge index job with description body when available. */
export async function loadJobWithDescription(id: string): Promise<SnapshotJob | null> {
  const board = await loadBoardSnapshot();
  const job = board.jobs.find((item) => item.id === id);
  if (!job) return null;
  if (job.descriptionPlain) return job;
  const body = await loadJobBody(id);
  if (!body) return job;
  return { ...job, descriptionPlain: body.descriptionPlain };
}
