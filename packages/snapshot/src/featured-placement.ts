import type { SnapshotJob } from './types';

/** RemoteOK-style cap — max concurrent paid pins on the homepage board. */
export const HOMEPAGE_FEATURED_CAP = 5;

function featuredRank(a: SnapshotJob, b: SnapshotJob): number {
  const aKey = `${a.featuredAt ?? ''}:${a.id}`;
  const bKey = `${b.featuredAt ?? ''}:${b.id}`;
  return aKey.localeCompare(bKey);
}

/** Limit paid Featured pins so page 1 stays usable. Partner rows are capped separately in sort. */
export function capHomepagePaidFeatured(jobs: SnapshotJob[]): SnapshotJob[] {
  if (jobs.length <= HOMEPAGE_FEATURED_CAP) return jobs;
  const sorted = [...jobs].sort(featuredRank);
  return sorted.slice(0, HOMEPAGE_FEATURED_CAP);
}