import type { AggregatorJob, AggregatorResponse } from './api-types';
import { decodeJobHtml, htmlToPlain, mapEmployment, parseLocation } from '../normalize';
import type { NormalizedJob, SourceSystemName } from '../types';

function asSource(raw: string | undefined): SourceSystemName {
  const value = (raw ?? 'joblistingsapi').toLowerCase();
  if (value === 'greenhouse' || value === 'lever' || value === 'ashby' || value === 'workday' || value === 'workable') {
    return value;
  }
  return 'joblistingsapi';
}

export function mapAggregatorJob(job: AggregatorJob): NormalizedJob {
  const html = decodeJobHtml(job.description_html ?? job.description_plain ?? '');
  const parsed = parseLocation(job.location);
  return {
    externalId: job.id,
    sourceSystem: asSource(job.source),
    title: job.title?.trim() || 'Untitled role',
    descriptionHtml: html,
    descriptionPlain: job.description_plain ?? htmlToPlain(html),
    url: job.url ?? '',
    locationRaw: parsed.locationRaw,
    country: parsed.country,
    region: parsed.region,
    city: parsed.city,
    isRemote: Boolean(job.remote) || parsed.isRemote,
    workplaceType: job.remote ? 'REMOTE' : parsed.workplaceType,
    employmentType: mapEmployment(job.employment_type),
    department: job.department ?? null,
    compensationText: null,
    postedAt: job.published_at ? new Date(job.published_at) : job.updated_at ? new Date(job.updated_at) : null,
    companyName: job.company_name,
  };
}

export type AggregatorOptions = {
  apiKey: string;
  baseUrl: string;
  sourceFilter?: string;
  updatedSince?: string;
};

/**
 * Optional normalized feed. No-ops when JOB_LISTINGS_API_KEY is empty.
 * Expected JSON shape: { jobs: AggregatorJob[], next_cursor?: string }
 */
export async function fetchAggregatorJobs(options: AggregatorOptions): Promise<NormalizedJob[]> {
  if (!options.apiKey) return [];

  const jobs: NormalizedJob[] = [];
  let cursor: string | null = null;

  for (let page = 0; page < 50; page += 1) {
    const url = new URL(options.baseUrl.replace(/\/$/, '') + '/jobs');
    if (options.sourceFilter) url.searchParams.set('source', options.sourceFilter);
    if (options.updatedSince) url.searchParams.set('updated_since', options.updatedSince);
    if (cursor) url.searchParams.set('cursor', cursor);

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${options.apiKey}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Aggregator fetch failed: ${response.status} ${response.statusText}`);
    }
    const data = (await response.json()) as AggregatorResponse;
    const batch = data.jobs ?? data.data ?? data.results ?? [];
    jobs.push(...batch.map(mapAggregatorJob));
    cursor = data.next_cursor ?? null;
    if (!cursor || batch.length === 0) break;
  }

  return jobs;
}
