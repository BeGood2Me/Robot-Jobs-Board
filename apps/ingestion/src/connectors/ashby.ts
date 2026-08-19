import type { AshbyJob, AshbyJobBoardResponse } from './api-types';
import { decodeJobHtml, htmlToPlain, mapEmployment, parseLocation } from '../normalize';
import type { NormalizedJob } from '../types';

export function mapAshbyJob(job: AshbyJob): NormalizedJob {
  const html = decodeJobHtml(job.descriptionHtml ?? job.descriptionPlain ?? job.descriptionText ?? '');
  const plain = job.descriptionPlain ?? job.descriptionText ?? htmlToPlain(html);
  const fromAddress = [
    job.address?.postalAddress?.addressLocality,
    job.address?.postalAddress?.addressRegion,
    job.address?.postalAddress?.addressCountry,
  ]
    .filter(Boolean)
    .join(', ');
  const locationRaw = job.locationName || (typeof job.location === 'string' ? job.location : '') || fromAddress;
  const parsed = parseLocation(locationRaw || fromAddress);
  const remote = Boolean(job.locationIsRemote ?? job.isRemote) || parsed.isRemote;
  const compensation =
    job.compensation?.compensationTierSummary ??
    job.compensation?.summary ??
    job.compensationTierSummary ??
    null;

  const externalId = String(job.id);
  const posting = job.jobUrl ?? '';
  const apply = job.applyUrl ?? '';
  const url = posting.includes(externalId) ? posting : apply.includes(externalId) ? apply : posting || apply;

  return {
    externalId,
    sourceSystem: 'ashby',
    title: job.title?.trim() || 'Untitled role',
    descriptionHtml: html,
    descriptionPlain: plain,
    url,
    locationRaw: parsed.locationRaw,
    country: parsed.country,
    region: parsed.region,
    city: parsed.city,
    isRemote: remote,
    workplaceType: remote
      ? parsed.workplaceType === 'ONSITE'
        ? 'REMOTE'
        : parsed.workplaceType
      : parsed.workplaceType,
    employmentType: mapEmployment(job.employmentType),
    department: job.departmentName ?? job.department ?? job.teamName ?? job.team ?? null,
    compensationText: compensation,
    postedAt: job.publishedAt ? new Date(job.publishedAt) : job.updatedAt ? new Date(job.updatedAt) : null,
  };
}

export async function fetchAshbyJobs(jobBoardName: string): Promise<NormalizedJob[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(jobBoardName)}?includeCompensation=true`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Ashby fetch failed for ${jobBoardName}: ${response.status} ${response.statusText}`);
  }
  const data = (await response.json()) as AshbyJobBoardResponse;
  const jobs = data.jobs ?? data.jobPostings ?? [];
  return jobs.map(mapAshbyJob);
}
