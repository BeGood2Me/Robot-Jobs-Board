import type { WorkdayJobDetail, WorkdayJobListItem, WorkdayJobsResponse } from './api-types';
import { decodeJobHtml, htmlToPlain, mapEmployment, parseLocation } from '../normalize';
import type { NormalizedJob } from '../types';

export type WorkdayBoard = {
  host: string;
  tenant: string;
  site: string;
};

function boardUrl(board: WorkdayBoard, path: string): string {
  return `https://${board.host}/wday/cxs/${encodeURIComponent(board.tenant)}/${encodeURIComponent(board.site)}${path}`;
}

export function workdayJobUrl(board: WorkdayBoard, posting: WorkdayJobListItem, detail?: WorkdayJobDetail | null): string {
  if (detail?.jobPostingInfo?.externalUrl) return detail.jobPostingInfo.externalUrl;
  return `https://${board.host}/en-US/${board.site}${posting.externalPath}`;
}

function locationFrom(posting: WorkdayJobListItem, detail?: WorkdayJobDetail | null): string {
  const info = detail?.jobPostingInfo;
  const country = info?.jobRequisitionLocation?.country?.descriptor ?? info?.country;
  const parts = [info?.location || posting.locationsText, country].filter(Boolean);
  return parts.join(', ');
}

export function mapWorkdayJob(
  board: WorkdayBoard,
  posting: WorkdayJobListItem,
  detail?: WorkdayJobDetail | null,
): NormalizedJob {
  const info = detail?.jobPostingInfo;
  const html = decodeJobHtml(info?.jobDescription ?? '');
  const parsed = parseLocation(locationFrom(posting, detail));
  const countryCode = info?.jobRequisitionLocation?.country?.alpha2Code;
  if (!parsed.country && countryCode) {
    parsed.country = countryCode.toUpperCase() === 'US' ? 'United States' : parsed.country;
    if (countryCode.toUpperCase() === 'GB') parsed.country = 'United Kingdom';
  }
  const postedRaw = info?.startDate ?? info?.postedOn;
  const postedAt = postedRaw && !/^posted/i.test(postedRaw) ? new Date(postedRaw) : null;

  return {
    externalId: info?.jobReqId ?? posting.bulletFields?.[0] ?? posting.externalPath,
    sourceSystem: 'workday',
    title: (info?.title ?? posting.title)?.trim() || 'Untitled role',
    descriptionHtml: html,
    descriptionPlain: htmlToPlain(html),
    url: workdayJobUrl(board, posting, detail),
    locationRaw: parsed.locationRaw,
    country: parsed.country,
    region: parsed.region,
    city: parsed.city,
    isRemote: parsed.isRemote,
    workplaceType: parsed.workplaceType,
    employmentType: mapEmployment(info?.timeType),
    department: null,
    compensationText: null,
    postedAt: postedAt && !Number.isNaN(postedAt.getTime()) ? postedAt : null,
  };
}

async function fetchWorkdayPage(board: WorkdayBoard, offset: number, limit: number): Promise<WorkdayJobsResponse> {
  const response = await fetch(boardUrl(board, '/jobs'), {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ appliedFacets: {}, limit, offset, searchText: '' }),
  });
  if (!response.ok) {
    throw new Error(`Workday list failed for ${board.site}: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as WorkdayJobsResponse;
}

async function fetchWorkdayDetail(board: WorkdayBoard, externalPath: string): Promise<WorkdayJobDetail | null> {
  const response = await fetch(boardUrl(board, externalPath), {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) return null;
  return (await response.json()) as WorkdayJobDetail;
}

export async function fetchWorkdayJobs(board: WorkdayBoard): Promise<NormalizedJob[]> {
  const limit = 20;
  let offset = 0;
  const postings: WorkdayJobListItem[] = [];

  for (;;) {
    const page = await fetchWorkdayPage(board, offset, limit);
    const batch = page.jobPostings ?? [];
    postings.push(...batch);
    offset += batch.length;
    if (batch.length === 0 || offset >= (page.total ?? offset)) break;
  }

  const mapped: NormalizedJob[] = [];
  for (const posting of postings) {
    const detail = await fetchWorkdayDetail(board, posting.externalPath);
    mapped.push(mapWorkdayJob(board, posting, detail));
  }
  return mapped;
}
