import type { JobFilters, ListingFilter, SnapshotJob } from './types';

const WORKPLACES = new Set(['ONSITE', 'REMOTE', 'HYBRID']);
const EMPLOYMENTS = new Set(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'TEMPORARY']);

const EARLY_CAREER_TITLE_TERMS = [
  'junior',
  'new grad',
  'new-grad',
  'newgrad',
  'new graduate',
  'entry level',
  'entry-level',
  'early career',
  'early-career',
  'apprentice',
  'co-op',
  'associate engineer',
  'associate software',
  'associate robotics',
  'graduate engineer',
  'recent graduate',
  'campus hire',
  'university hire',
  'university graduate',
];

const EXPERIENCED_TITLE_TERMS = [
  'senior',
  'sr.',
  'sr ',
  'staff',
  'principal',
  'director',
  'manager',
  'head of',
  'vice president',
  'chief',
  'distinguished',
  'fellow',
  'lead',
];

const COUNTRY_LOCATION_ALIASES: Record<string, string[]> = {
  'United States': ['United States', 'USA', 'U.S.A.'],
  'United Kingdom': ['United Kingdom', 'Great Britain'],
  Canada: ['Canada'],
  Australia: ['Australia'],
};

function includesInsensitive(haystack: string | null | undefined, needle: string): boolean {
  return (haystack ?? '').toLowerCase().includes(needle.toLowerCase());
}

function titleContains(job: SnapshotJob, term: string): boolean {
  return includesInsensitive(job.title, term);
}

function internTitle(job: SnapshotJob): boolean {
  const title = job.title.toLowerCase();
  return (
    title.includes('internship') ||
    title.includes('intern ') ||
    title.includes('intern,') ||
    title.includes('intern-') ||
    title.includes('intern/') ||
    title.includes('intern)') ||
    title.includes('co-op') ||
    title.includes('co op') ||
    title.includes('apprentice') ||
    title.startsWith('intern ') ||
    title.startsWith('intern,') ||
    title.endsWith(' intern') ||
    title === 'intern'
  );
}

function internJob(job: SnapshotJob): boolean {
  return job.employmentType === 'INTERN' || internTitle(job);
}

function experiencedTitle(job: SnapshotJob): boolean {
  return EXPERIENCED_TITLE_TERMS.some((term) => titleContains(job, term));
}

function entryLevelJob(job: SnapshotJob): boolean {
  if (internJob(job)) return true;
  if (!EARLY_CAREER_TITLE_TERMS.some((term) => titleContains(job, term))) return false;
  return !experiencedTitle(job);
}

function countryMatches(job: SnapshotJob, country: string): boolean {
  if (job.country && job.country.toLowerCase() === country.toLowerCase()) return true;
  if (job.country) return false;
  const aliases = COUNTRY_LOCATION_ALIASES[country] ?? [country];
  return aliases.some((alias) => includesInsensitive(job.locationRaw, alias));
}

export function expandSearchTerms(q: string): string[] {
  const base = q.trim();
  if (!base) return [];
  const terms = new Set<string>([base]);
  const lower = base.toLowerCase();
  if (lower === 'grad' || lower === 'grads') {
    terms.add('graduate');
    terms.add('new grad');
    terms.add('new-grad');
  } else if (lower === 'junior' || lower === 'jr' || lower === 'jr.') {
    terms.add('junior');
    terms.add('entry level');
    terms.add('entry-level');
  } else if (lower === 'intern') {
    terms.add('internship');
    terms.add('intern');
  }
  return [...terms];
}

function textSearchMatch(job: SnapshotJob, q: string): boolean {
  const terms = expandSearchTerms(q);
  return terms.some(
    (term) =>
      includesInsensitive(job.title, term) ||
      includesInsensitive(job.locationRaw, term) ||
      includesInsensitive(job.city, term) ||
      includesInsensitive(job.department, term) ||
      includesInsensitive(job.company.name, term),
  );
}

function titleSearchMatch(job: SnapshotJob, q: string): boolean {
  return expandSearchTerms(q).some((term) => includesInsensitive(job.title, term));
}

function companySearchMatch(job: SnapshotJob, q: string): boolean {
  return expandSearchTerms(q).some((term) => includesInsensitive(job.company.name, term));
}

export function matchesListingFilter(job: SnapshotJob, filter: ListingFilter): boolean {
  switch (filter.kind) {
    case 'remote':
      return job.isRemote;
    case 'city':
      return (job.city ?? '').toLowerCase() === filter.value.toLowerCase();
    case 'region':
      return (job.region ?? '').toLowerCase() === filter.value.toLowerCase();
    case 'country':
      return countryMatches(job, filter.value);
    case 'domain':
      return job.robotDomains.some(({ domainId }) => domainId === filter.domainId);
    case 'tag':
      return job.techTags.some(({ techTag }) => techTag.id === filter.tagId);
    case 'and':
      return filter.filters.every((item) => matchesListingFilter(job, item));
    case 'or':
      return filter.filters.some((item) => matchesListingFilter(job, item));
    default:
      return false;
  }
}

export function matchesJobFilters(job: SnapshotJob, filters: JobFilters): boolean {
  if (filters.q && !textSearchMatch(job, filters.q)) return false;

  if (filters.domains?.length) {
    const slugs = new Set(filters.domains);
    if (!job.robotDomains.some(({ domain }) => slugs.has(domain.slug))) return false;
  }

  if (filters.tags?.length) {
    const slugs = new Set(filters.tags);
    if (!job.techTags.some(({ techTag }) => slugs.has(techTag.slug))) return false;
  }

  const otherSeniorities = (filters.seniorities ?? []).filter((slug) => slug !== 'junior' && slug !== 'entry');
  const seniorityMatch =
    Boolean(filters.entryLevel && entryLevelJob(job)) ||
    (otherSeniorities.length > 0 &&
      job.seniorities.some(({ seniority }) => otherSeniorities.includes(seniority.slug)));
  if ((filters.entryLevel || otherSeniorities.length > 0) && !seniorityMatch) return false;

  if (filters.countries?.length && !filters.countries.some((country) => countryMatches(job, country))) {
    return false;
  }

  if (filters.region && (job.region ?? '').toLowerCase() !== filters.region.toLowerCase()) return false;
  if (filters.city && !includesInsensitive(job.city, filters.city)) return false;

  const workplaces = (filters.workplaces ?? []).filter((value) => WORKPLACES.has(value));
  if (workplaces.length) {
    const wantsRemote = workplaces.includes('REMOTE');
    const otherWorkplaces = workplaces.filter((value) => value !== 'REMOTE');
    const workplaceMatch =
      otherWorkplaces.includes(job.workplaceType) ||
      (wantsRemote && (job.workplaceType === 'REMOTE' || job.isRemote));
    if (!workplaceMatch) return false;
  }

  const employments = (filters.employments ?? []).filter((value) => EMPLOYMENTS.has(value));
  if (employments.length) {
    const wantsIntern = employments.includes('INTERN');
    const otherEmployments = employments.filter((value) => value !== 'INTERN');
    const employmentMatch =
      (wantsIntern && internJob(job)) || otherEmployments.includes(job.employmentType);
    if (!employmentMatch) return false;
  }

  if (filters.remote && !job.isRemote) return false;
  return true;
}

function postedAtMs(job: SnapshotJob): number {
  const value = job.postedAt ?? job.createdAt;
  return value ? Date.parse(value) : 0;
}

export function sortJobsNewest(jobs: SnapshotJob[]): SnapshotJob[] {
  return [...jobs].sort((a, b) => postedAtMs(b) - postedAtMs(a));
}

export function searchJobsFromSnapshot(
  jobs: SnapshotJob[],
  filters: JobFilters,
  pageSize: number,
): { jobs: SnapshotJob[]; total: number; page: number; pageSize: number } {
  const requestedPage = Math.max(1, filters.page ?? 1);
  const filtered = jobs.filter((job) => matchesJobFilters(job, filters));
  const relevance = Boolean(filters.q && filters.sort !== 'newest');

  let ranked: SnapshotJob[];
  if (!relevance || !filters.q) {
    ranked = sortJobsNewest(filtered);
  } else {
    const q = filters.q;
    const titleMatches = filtered.filter((job) => titleSearchMatch(job, q));
    const titleIds = new Set(titleMatches.map((job) => job.id));
    const companyMatches = filtered.filter((job) => !titleIds.has(job.id) && companySearchMatch(job, q));
    const companyIds = new Set(companyMatches.map((job) => job.id));
    const rest = filtered.filter((job) => !titleIds.has(job.id) && !companyIds.has(job.id));
    ranked = [...sortJobsNewest(titleMatches), ...sortJobsNewest(companyMatches), ...sortJobsNewest(rest)];
  }

  const total = ranked.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, pages);
  const skip = (page - 1) * pageSize;
  return { jobs: ranked.slice(skip, skip + pageSize), total, page, pageSize };
}

export function relatedJobsFromSnapshot(
  jobs: SnapshotJob[],
  job: Pick<SnapshotJob, 'id' | 'companyId' | 'city'> & { robotDomains: Array<{ domainId: string }> },
  take: number,
): SnapshotJob[] {
  const domainIds = new Set(job.robotDomains.map((item) => item.domainId));
  return sortJobsNewest(
    jobs.filter(
      (item) =>
        item.id !== job.id &&
        (item.companyId === job.companyId ||
          (job.city && item.city === job.city) ||
          item.robotDomains.some(({ domainId }) => domainIds.has(domainId))),
    ),
  ).slice(0, take);
}

export function filterListingJobs(jobs: SnapshotJob[], filter: ListingFilter, take = 50): SnapshotJob[] {
  return sortJobsNewest(jobs.filter((job) => matchesListingFilter(job, filter))).slice(0, take);
}

export function countListingJobs(jobs: SnapshotJob[], filter: ListingFilter): number {
  return jobs.filter((job) => matchesListingFilter(job, filter)).length;
}
