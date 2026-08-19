const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLLECTION_PATH = /^\/(jobs|job|open-roles|openings|careers|career|vacancies|positions|opportunities)$/i;
const APPLY_SUFFIX = /\/(apply|application)\/?$/i;

export type ApplyUrlJob = {
  url: string;
  sourceSystem: string;
  externalId: string;
  company?: { sourceIdentifier?: string | null } | null;
};

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function pathHasJobId(url: URL, jobId: string): boolean {
  return url.pathname.split('/').includes(jobId);
}

function isGreenhouseHost(hostname: string): boolean {
  return hostname === 'boards.greenhouse.io' || hostname === 'job-boards.greenhouse.io';
}

function greenhouseTokenFromUrl(url: URL): string | null {
  if (!isGreenhouseHost(url.hostname)) return null;
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts[0] === 'embed') return url.searchParams.get('for');
  return parts[0] ?? null;
}

export function greenhouseJobListingUrl(boardToken: string, jobId: string): string {
  return `https://job-boards.greenhouse.io/${encodeURIComponent(boardToken)}/jobs/${encodeURIComponent(jobId)}`;
}

function stripApplyFormPath(url: string): string {
  const parsed = parseUrl(url);
  if (!parsed) return url;
  parsed.pathname = parsed.pathname.replace(APPLY_SUFFIX, '');
  if (parsed.pathname === '') parsed.pathname = '/';
  return parsed.toString().replace(/\/$/, '') || url;
}

function isGreenhouseApplicationForm(url: URL): boolean {
  return isGreenhouseHost(url.hostname) && url.pathname.includes('/embed/job_app');
}

function isGreenhouseJobListing(url: URL, jobId: string): boolean {
  if (!isGreenhouseHost(url.hostname) || isGreenhouseApplicationForm(url)) return false;
  return /\/jobs\/\d+\/?$/.test(url.pathname) && pathHasJobId(url, jobId);
}

function listingFromCollectionUrl(url: URL, jobId: string): string | null {
  if (isGreenhouseHost(url.hostname)) return null;
  if (url.hostname.endsWith('firststage.co')) return null;
  const path = url.pathname.replace(/\/+$/, '') || '';
  if (pathHasJobId(url, jobId) || !COLLECTION_PATH.test(path)) return null;
  return `${url.origin}${path}/${encodeURIComponent(jobId)}`;
}

function greenhouseDirectUrl(job: ApplyUrlJob): string {
  if (!/^\d+$/.test(job.externalId)) return stripApplyFormPath(job.url);
  const parsed = parseUrl(job.url);
  const token = job.company?.sourceIdentifier?.trim() || (parsed ? greenhouseTokenFromUrl(parsed) : null);

  if (parsed && isGreenhouseJobListing(parsed, job.externalId)) return job.url;

  const fromCollection = parsed ? listingFromCollectionUrl(parsed, job.externalId) : null;
  if (fromCollection) return fromCollection;

  if (parsed && pathHasJobId(parsed, job.externalId) && !isGreenhouseApplicationForm(parsed)) {
    return stripApplyFormPath(job.url);
  }

  if (token) return greenhouseJobListingUrl(token, job.externalId);
  return stripApplyFormPath(job.url);
}

function ashbyDirectUrl(job: ApplyUrlJob): string {
  const listing = stripApplyFormPath(job.url);
  const parsed = parseUrl(listing);
  const board = job.company?.sourceIdentifier?.trim();
  if (parsed?.hostname === 'jobs.ashbyhq.com') {
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length >= 2 && (parts[1] === job.externalId || UUID.test(parts[1]))) return listing;
    if (board && job.externalId) {
      return `https://jobs.ashbyhq.com/${encodeURIComponent(board)}/${encodeURIComponent(job.externalId)}`;
    }
  }
  if (listing.includes(job.externalId)) return listing;
  if (board && job.externalId) {
    return `https://jobs.ashbyhq.com/${encodeURIComponent(board)}/${encodeURIComponent(job.externalId)}`;
  }
  return listing;
}

function leverDirectUrl(job: ApplyUrlJob): string {
  const listing = stripApplyFormPath(job.url);
  const parsed = parseUrl(listing);
  const site = job.company?.sourceIdentifier?.trim();
  if (parsed?.hostname === 'jobs.lever.co') {
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length >= 2 && (parts[1] === job.externalId || UUID.test(parts[1]))) return listing;
    if (site && job.externalId) {
      return `https://jobs.lever.co/${encodeURIComponent(site)}/${encodeURIComponent(job.externalId)}`;
    }
  }
  return listing;
}

function workableDirectUrl(job: ApplyUrlJob): string {
  const listing = stripApplyFormPath(job.url);
  if (listing.includes(`/j/${job.externalId}`)) return listing;
  if (job.externalId) return `https://apply.workable.com/j/${encodeURIComponent(job.externalId)}`;
  return listing;
}

/**
 * ATS URL for the job posting (description + requirements), not a multi-role
 * careers board and not the application form.
 */
export function directApplyUrl(job: ApplyUrlJob): string {
  const url = job.url?.trim() ?? '';
  if (!url) return url;

  switch (job.sourceSystem) {
    case 'greenhouse':
      return greenhouseDirectUrl({ ...job, url });
    case 'ashby':
      return ashbyDirectUrl({ ...job, url });
    case 'lever':
      return leverDirectUrl({ ...job, url });
    case 'workable':
      return workableDirectUrl({ ...job, url });
    default:
      return stripApplyFormPath(url);
  }
}
