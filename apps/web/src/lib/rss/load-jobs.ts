import {
  matchesListingFilter,
  sortJobsNewest,
  type ListingFilter,
  type SnapshotJob,
} from '@robot-jobs-board/snapshot';
import { loadPublicSnapshot } from '@/lib/snapshot/load';

export type RssJobSource = {
  jobs: SnapshotJob[];
  generatedAt: string;
  siteUrl: string;
};

/**
 * RSS job lists are always snapshot-backed. No Neon / Prisma on this path.
 */
export async function loadRssJobs(options: {
  filter?: ListingFilter;
  companySlug?: string;
  limit?: number;
}): Promise<RssJobSource | null> {
  const snapshot = await loadPublicSnapshot();
  if (!snapshot?.jobs?.length) return null;

  let jobs = snapshot.jobs.filter((job) => job.isActive && !job.isHidden);
  if (options.filter) jobs = jobs.filter((job) => matchesListingFilter(job, options.filter!));
  if (options.companySlug) jobs = jobs.filter((job) => job.company.slug === options.companySlug);

  const limit = options.limit ?? 100;
  jobs = sortJobsNewest(jobs).slice(0, limit);

  const siteUrl = (snapshot.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
    /\/$/,
    '',
  );

  return { jobs, generatedAt: snapshot.generatedAt, siteUrl };
}