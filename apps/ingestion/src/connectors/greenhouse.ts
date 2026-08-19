import type { GreenhouseJob, GreenhouseListResponse } from './api-types';
import { directApplyUrl } from '../apply-url';
import { decodeJobHtml, htmlToPlain, mapEmployment, parseLocation } from '../normalize';
import type { NormalizedJob } from '../types';

function locationFrom(job: GreenhouseJob): string {
  const office = job.offices?.map((o) => o.name).filter(Boolean).join(', ');
  return job.location?.name || office || '';
}

export function mapGreenhouseJob(job: GreenhouseJob, boardToken?: string): NormalizedJob {
  const html = job.content ?? '';
  const parsed = parseLocation(locationFrom(job));
  const department = job.departments?.map((d) => d.name).filter(Boolean).join(', ') || null;
  const externalId = String(job.id);

  return {
    externalId,
    sourceSystem: 'greenhouse',
    title: job.title?.trim() || 'Untitled role',
    descriptionHtml: decodeJobHtml(html),
    descriptionPlain: htmlToPlain(html),
    url: directApplyUrl({
      url: job.absolute_url ?? '',
      sourceSystem: 'greenhouse',
      externalId,
      company: boardToken ? { sourceIdentifier: boardToken } : null,
    }),
    locationRaw: parsed.locationRaw,
    country: parsed.country,
    region: parsed.region,
    city: parsed.city,
    isRemote: parsed.isRemote,
    workplaceType: parsed.workplaceType,
    employmentType: mapEmployment(job.title),
    department,
    compensationText: null,
    postedAt: job.first_published
      ? new Date(job.first_published)
      : job.updated_at
        ? new Date(job.updated_at)
        : null,
  };
}

async function fetchGreenhouseJobDetail(boardToken: string, jobId: string): Promise<GreenhouseJob> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs/${encodeURIComponent(jobId)}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Greenhouse detail failed for ${boardToken}/${jobId}: ${response.status}`);
  }
  return (await response.json()) as GreenhouseJob;
}

export async function fetchGreenhouseJobs(boardToken: string): Promise<NormalizedJob[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Greenhouse fetch failed for ${boardToken}: ${response.status} ${response.statusText}`);
  }
  const data = (await response.json()) as GreenhouseListResponse;
  const jobs = data.jobs ?? [];
  const mapped: NormalizedJob[] = [];

  for (const job of jobs) {
    let record = job;
    if (!record.content) {
      try {
        record = await fetchGreenhouseJobDetail(boardToken, String(job.id));
      } catch {
        record = job;
      }
    }
    mapped.push(mapGreenhouseJob(record, boardToken));
  }

  return mapped;
}
