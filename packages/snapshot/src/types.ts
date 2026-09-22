export type SnapshotCompany = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  logoUrl: string | null;
  description: string;
  seoIntro: string | null;
  openJobCount: number;
};

export type SnapshotDomain = {
  id: string;
  slug: string;
  name: string;
  description: string;
  openJobCount: number;
};

export type SnapshotTag = {
  id: string;
  slug: string;
  label: string;
  openJobCount: number;
};

export type SnapshotSeniority = {
  id: string;
  slug: string;
  label: string;
};

/** Full description payload stored per job under `snapshot/jobs/{id}.json.gz`. */
export type SnapshotJobBody = {
  descriptionHtml: string;
  descriptionPlain: string;
};

/**
 * Board index job. Descriptions are omitted from `board.json.gz` to keep listing/
 * facet/ISR paths cheap; load them via `snapshot/jobs/{id}.json.gz` on detail pages.
 */
export type SnapshotJob = {
  id: string;
  slug: string;
  title: string;
  descriptionHtml?: string;
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
  expiresAt: string | null;
  createdAt: string;
  isHidden: boolean;
  isActive: boolean;
  sourceSystem: string;
  externalId: string;
  companyId: string;
  company: {
    name: string;
    slug: string;
    website: string | null;
    logoUrl: string | null;
    sourceIdentifier: string | null;
  };
  robotDomains: Array<{ domainId: string; domain: { id: string; slug: string; name: string } }>;
  techTags: Array<{ techTag: { id: string; slug: string; label: string } }>;
  seniorities: Array<{ seniority: { id: string; slug: string; label: string } }>;
  /** UG / PG / PhD when the posting is an internship and the level is explicit. */
  internshipTrack?: 'ug' | 'pg' | 'phd' | null;
};

export type SnapshotGoneJob = {
  id: string;
  slug: string;
  title: string;
  company: { name: string; slug: string };
};

export type PublicBoardSnapshot = {
  version: 1;
  generatedAt: string;
  siteUrl: string;
  jobs: SnapshotJob[];
  goneJobs: SnapshotGoneJob[];
  companies: SnapshotCompany[];
  domains: SnapshotDomain[];
  tags: SnapshotTag[];
  seniorities: SnapshotSeniority[];
  countryFacets: Array<{ country: string; count: number }>;
  places: {
    cities: string[];
    countries: string[];
    regions: string[];
  };
};

export type ListingFilter =
  | { kind: 'remote' }
  | { kind: 'city'; value: string }
  | { kind: 'region'; value: string }
  | { kind: 'country'; value: string }
  | { kind: 'domain'; domainId: string }
  | { kind: 'tag'; tagId: string }
  | { kind: 'and'; filters: ListingFilter[] }
  | { kind: 'or'; filters: ListingFilter[] };

export type JobFilters = {
  q?: string;
  page?: number;
  sort?: 'newest' | 'relevance';
  domains?: string[];
  tags?: string[];
  seniorities?: string[];
  countries?: string[];
  region?: string;
  city?: string;
  workplaces?: string[];
  employments?: string[];
  /** Internship audience: ug | pg | phd */
  internshipTracks?: string[];
  entryLevel?: boolean;
  remote?: boolean;
};

export const SNAPSHOT_DIR = 'public/snapshot';
export const SNAPSHOT_BOARD_FILE = 'board.json.gz';
/** Full gzip map of jobId → body (MCP / ingest carry-forward). Too large for Next Data Cache. */
export const SNAPSHOT_BODIES_FILE = 'bodies.json.gz';
/**
 * Sharded body maps for the web app: each file stays under Vercel's 2MB Data Cache
 * limit so job pages can cache a small gzip instead of gunzipping the full bodies blob.
 */
export const BODIES_SHARD_COUNT = 64;
export const SNAPSHOT_BODIES_SHARDS_DIR = 'bodies/shards';
/** @deprecated Local-only legacy layout; Blob uploads no longer use per-job files. */
export const SNAPSHOT_JOBS_DIR = 'jobs';

/** Stable shard index for a job id (must match write + read paths). */
export function bodyShardIndex(jobId: string, shardCount = BODIES_SHARD_COUNT): number {
  let hash = 2166136261;
  for (let i = 0; i < jobId.length; i++) {
    hash ^= jobId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % shardCount;
}

export function bodyShardFileName(jobId: string, shardCount = BODIES_SHARD_COUNT): string {
  return `${bodyShardIndex(jobId, shardCount)}.json.gz`;
}

export function bodyShardPath(jobId: string, shardCount = BODIES_SHARD_COUNT): string {
  return `${SNAPSHOT_BODIES_SHARDS_DIR}/${bodyShardFileName(jobId, shardCount)}`;
}
