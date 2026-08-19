import type { WorkableJobDetail, WorkableLocation, WorkableWidgetJob, WorkableWidgetResponse } from './api-types';
import { decodeJobHtml, htmlToPlain, mapEmployment, parseLocation } from '../normalize';
import type { NormalizedJob } from '../types';

function locationLabel(location: WorkableLocation | undefined, fallback?: WorkableWidgetJob): string {
  if (location) {
    return [location.city, location.region ?? location.state, location.country].filter(Boolean).join(', ');
  }
  if (!fallback) return '';
  return [fallback.city, fallback.state, fallback.country].filter(Boolean).join(', ');
}

function asHtml(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  return String(value);
}

export function mapWorkableJob(job: WorkableWidgetJob, detail?: WorkableJobDetail | null): NormalizedJob {
  const location = detail?.location
    ? locationLabel({
        city: detail.location.city,
        region: detail.location.region,
        country: detail.location.country,
        countryCode: detail.location.countryCode,
      })
    : locationLabel(job.locations?.[0], job);
  const parsed = parseLocation(location);
  if (!parsed.country && (detail?.location?.country || job.country)) {
    parsed.country = detail?.location?.country ?? job.country ?? parsed.country;
  }
  const html = decodeJobHtml(
    [asHtml(detail?.description), asHtml(detail?.requirements), asHtml(detail?.benefits)].filter(Boolean).join('\n'),
  );
  const department = Array.isArray(detail?.department)
    ? detail.department.filter(Boolean).join(', ')
    : detail?.department || job.department || null;
  const posted = detail?.published ?? job.published_on ?? job.created_at ?? null;

  return {
    externalId: job.shortcode,
    sourceSystem: 'workable',
    title: (detail?.title ?? job.title)?.trim() || 'Untitled role',
    descriptionHtml: html,
    descriptionPlain: htmlToPlain(html),
    url: job.url ?? job.application_url ?? `https://apply.workable.com/j/${job.shortcode}`,
    locationRaw: parsed.locationRaw,
    country: parsed.country,
    region: parsed.region,
    city: parsed.city,
    isRemote: Boolean(detail?.remote || job.telecommuting) || parsed.isRemote,
    workplaceType: detail?.remote || job.telecommuting ? 'REMOTE' : parsed.workplaceType,
    employmentType: mapEmployment(job.employment_type ?? detail?.type),
    department,
    compensationText: null,
    postedAt: posted ? new Date(posted) : null,
  };
}

async function fetchWorkableDetail(account: string, shortcode: string): Promise<WorkableJobDetail | null> {
  const url = `https://apply.workable.com/api/v2/accounts/${encodeURIComponent(account)}/jobs/${encodeURIComponent(shortcode)}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) return null;
  return (await response.json()) as WorkableJobDetail;
}

function uniqueByShortcode(jobs: WorkableWidgetJob[]): WorkableWidgetJob[] {
  const seen = new Set<string>();
  const unique: WorkableWidgetJob[] = [];
  for (const job of jobs) {
    if (!job.shortcode || seen.has(job.shortcode)) continue;
    seen.add(job.shortcode);
    unique.push(job);
  }
  return unique;
}

export async function fetchWorkableJobs(account: string): Promise<NormalizedJob[]> {
  const url = `https://apply.workable.com/api/v1/widget/accounts/${encodeURIComponent(account)}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Workable fetch failed for ${account}: ${response.status} ${response.statusText}`);
  }
  const data = (await response.json()) as WorkableWidgetResponse;
  const jobs = uniqueByShortcode(data.jobs ?? []);
  const mapped: NormalizedJob[] = [];

  for (const job of jobs) {
    const detail = await fetchWorkableDetail(account, job.shortcode);
    mapped.push(mapWorkableJob(job, detail));
  }
  return mapped;
}
