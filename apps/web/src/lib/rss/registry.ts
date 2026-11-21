import { countListingJobs, type ListingFilter, type PublicBoardSnapshot } from '@robot-jobs-board/snapshot';
import { domainCopy, locationPageCopy } from '@/lib/programmatic';
import { loadPublicSnapshot } from '@/lib/snapshot/load';
import { domainStaticParams, placeStaticParams } from '@/lib/snapshot/static-params';
import { INDEX_JOB_THRESHOLD } from '@/lib/site';
import { parseLocationPlaceParam, parseRobotDomainParam, resolvePlaceFilterFromSnapshot } from './snapshot-place';

export type FeedDescriptor = {
  feedPath: string;
  pagePath: string;
  title: string;
  description: string;
  filter?: ListingFilter;
  companySlug?: string;
  group: 'board' | 'robots' | 'locations' | 'companies';
  jobCount: number;
};

const BOARD_FEED: Omit<FeedDescriptor, 'jobCount'> = {
  feedPath: '/robotics-jobs.rss',
  pagePath: '/',
  title: 'Robot Jobs Board — latest robotics jobs',
  description:
    'Latest robotics engineering jobs from public company ATS boards — AMR, humanoids, drones, and autonomy.',
  group: 'board',
};

export function rssFeedUrlForPagePath(pagePath: string): string | null {
  if (pagePath === '/') return BOARD_FEED.feedPath;
  if (pagePath.startsWith('/robots/') && pagePath.endsWith('-jobs')) {
    return `${pagePath}.rss`;
  }
  if (pagePath.startsWith('/locations/') && pagePath.endsWith('-robotics-jobs')) {
    return `${pagePath}.rss`;
  }
  if (pagePath.startsWith('/companies/')) {
    const slug = pagePath.slice('/companies/'.length).replace(/\/$/, '');
    if (slug && !slug.includes('/')) return `/companies/${slug}.rss`;
  }
  return null;
}

function domainFeedFromSnapshot(
  snapshot: PublicBoardSnapshot,
  paramSlug: string,
): FeedDescriptor | null {
  const domainSlug = parseRobotDomainParam(paramSlug);
  if (!domainSlug) return null;
  const domain = snapshot.domains.find((row) => row.slug === domainSlug);
  if (!domain) return null;
  const filter: ListingFilter = { kind: 'domain', domainId: domain.id };
  const jobCount = countListingJobs(snapshot.jobs, filter);
  if (jobCount < INDEX_JOB_THRESHOLD) return null;
  const copy = domainCopy(domain.slug, domain.name, domain.description, jobCount);
  const pagePath = `/robots/${paramSlug}`;
  return {
    feedPath: `${pagePath}.rss`,
    pagePath,
    title: `${copy.h1} — Robot Jobs Board`,
    description: copy.description,
    filter,
    group: 'robots',
    jobCount,
  };
}

function locationFeedFromSnapshot(
  snapshot: PublicBoardSnapshot,
  placeParam: string,
): FeedDescriptor | null {
  const core = parseLocationPlaceParam(placeParam);
  if (!core) return null;
  const resolved = resolvePlaceFilterFromSnapshot(snapshot, core);
  if (!resolved) return null;
  const jobCount = countListingJobs(snapshot.jobs, resolved.filter);
  if (jobCount < INDEX_JOB_THRESHOLD) return null;
  const copy = locationPageCopy(core, resolved.label, jobCount);
  const pagePath = `/locations/${placeParam}`;
  return {
    feedPath: `${pagePath}.rss`,
    pagePath,
    title: `${copy.h1} — Robot Jobs Board`,
    description: copy.description,
    filter: resolved.filter,
    group: 'locations',
    jobCount,
  };
}

function companyFeedFromSnapshot(snapshot: PublicBoardSnapshot, slug: string): FeedDescriptor | null {
  const company = snapshot.companies.find((row) => row.slug === slug);
  if (!company || company.openJobCount < INDEX_JOB_THRESHOLD) return null;
  const jobCount = snapshot.jobs.filter(
    (job) => job.isActive && !job.isHidden && job.company.slug === slug,
  ).length;
  if (jobCount < INDEX_JOB_THRESHOLD) return null;
  const pagePath = `/companies/${slug}`;
  return {
    feedPath: `${pagePath}.rss`,
    pagePath,
    title: `${company.name} robotics jobs — Robot Jobs Board`,
    description: `${jobCount} open robotics roles at ${company.name}. Updated from public ATS boards.`,
    companySlug: slug,
    group: 'companies',
    jobCount,
  };
}

export function listFeedsFromSnapshot(snapshot: PublicBoardSnapshot): FeedDescriptor[] {
  const feeds: FeedDescriptor[] = [];

  const boardCount = snapshot.jobs.filter((job) => job.isActive && !job.isHidden).length;
  feeds.push({ ...BOARD_FEED, jobCount: boardCount });

  for (const { slug } of domainStaticParams()) {
    const feed = domainFeedFromSnapshot(snapshot, slug);
    if (feed) feeds.push(feed);
  }

  const seenPlaces = new Set<string>();
  for (const { place } of placeStaticParams()) {
    if (!place || seenPlaces.has(place)) continue;
    seenPlaces.add(place);
    const feed = locationFeedFromSnapshot(snapshot, place);
    if (feed) feeds.push(feed);
  }

  const companies = [...snapshot.companies]
    .filter((c) => c.openJobCount >= INDEX_JOB_THRESHOLD)
    .sort((a, b) => b.openJobCount - a.openJobCount);
  for (const company of companies) {
    const feed = companyFeedFromSnapshot(snapshot, company.slug);
    if (feed) feeds.push(feed);
  }

  return feeds;
}

export async function listPublicFeeds(): Promise<FeedDescriptor[] | null> {
  const snapshot = await loadPublicSnapshot();
  if (!snapshot) return null;
  return listFeedsFromSnapshot(snapshot);
}

/** Internal route segments after `/rss/` (from rewrites). */
export async function resolveFeedByInternalParts(
  parts: string[],
): Promise<FeedDescriptor | 'no_snapshot' | 'not_found'> {
  const snapshot = await loadPublicSnapshot();
  if (!snapshot) return 'no_snapshot';

  if (parts.length === 1 && parts[0] === 'all') {
    const boardCount = snapshot.jobs.filter((job) => job.isActive && !job.isHidden).length;
    return { ...BOARD_FEED, jobCount: boardCount };
  }

  if (parts[0] === 'robots' && parts.length === 2) {
    return domainFeedFromSnapshot(snapshot, parts[1]) ?? 'not_found';
  }

  if (parts[0] === 'locations' && parts.length === 2) {
    return locationFeedFromSnapshot(snapshot, parts[1]) ?? 'not_found';
  }

  if (parts[0] === 'companies' && parts.length === 2) {
    return companyFeedFromSnapshot(snapshot, parts[1]) ?? 'not_found';
  }

  return 'not_found';
}