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

const WORKDAY_DAY_MS = 86_400_000;

/** startDate (YYYY-MM-DD), ISO timestamps, or Workday list/detail strings like "Posted 4 Days Ago". */
export function parseWorkdayPostedOn(raw: string | null | undefined, ref = new Date()): Date | null {
  if (!raw?.trim()) return null;
  const text = raw.trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const iso = text.length === 10 ? `${text}T12:00:00.000Z` : text;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const lower = text.toLowerCase();
  if (lower === 'posted today') return new Date(ref);
  if (lower === 'posted yesterday') return new Date(ref.getTime() - WORKDAY_DAY_MS);

  const plusMatch = lower.match(/^posted\s+(\d+)\+\s*days?\s+ago$/);
  if (plusMatch) {
    const days = Number(plusMatch[1]);
    if (Number.isFinite(days)) return new Date(ref.getTime() - days * WORKDAY_DAY_MS);
  }

  const daysMatch = lower.match(/^posted\s+(\d+)\s*days?\s+ago$/);
  if (daysMatch) {
    const days = Number(daysMatch[1]);
    if (Number.isFinite(days)) return new Date(ref.getTime() - days * WORKDAY_DAY_MS);
  }

  const d = new Date(text);
  return Number.isNaN(d.getTime()) ? null : d;
}

function resolveWorkdayPostedAt(
  posting: WorkdayJobListItem,
  info?: WorkdayJobDetail['jobPostingInfo'] | null | undefined,
  ref = new Date(),
): Date | null {
  for (const raw of [info?.startDate, info?.postedOn, posting.postedOn]) {
    const parsed = parseWorkdayPostedOn(raw, ref);
    if (parsed) return parsed;
  }
  return null;
}

/** List row only (no detail) — used when CI retains jobs after a 429. */
export function postedAtFromWorkdayListPosting(
  posting: WorkdayJobListItem,
  ref = new Date(),
): Date | null {
  return resolveWorkdayPostedAt(posting, null, ref);
}

const WORKDAY_RETRY_STATUS = new Set([429, 503]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWorkdayWithRetry(url: string, init: RequestInit, attempts = 5): Promise<Response> {
  let last: Response | null = null;
  for (let i = 0; i < attempts; i++) {
    const response = await fetch(url, init);
    if (!WORKDAY_RETRY_STATUS.has(response.status)) return response;
    last = response;
    if (i < attempts - 1) {
      await sleep(800 * 2 ** i + Math.floor(Math.random() * 400));
    }
  }
  return last ?? fetch(url, init);
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
  const postedAt = resolveWorkdayPostedAt(posting, info);

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
    postedAt,
  };
}

async function fetchWorkdayPage(board: WorkdayBoard, offset: number, limit: number): Promise<WorkdayJobsResponse> {
  const response = await fetchWorkdayWithRetry(boardUrl(board, '/jobs'), {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ appliedFacets: {}, limit, offset, searchText: '' }),
  });
  if (!response.ok) {
    throw new Error(`Workday list failed for ${board.site}: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as WorkdayJobsResponse;
}

export async function fetchWorkdayDetail(board: WorkdayBoard, externalPath: string): Promise<WorkdayJobDetail | null> {
  const response = await fetchWorkdayWithRetry(boardUrl(board, externalPath), {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) return null;
  return (await response.json()) as WorkdayJobDetail;
}

/** Workday list API only (cheap). Enough to backfill postedOn when full ingest hits 429. */
export async function fetchWorkdayJobList(board: WorkdayBoard): Promise<WorkdayJobListItem[]> {
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

  return postings;
}

export async function fetchWorkdayJobs(board: WorkdayBoard): Promise<NormalizedJob[]> {
  const postings = await fetchWorkdayJobList(board);

  const mapped: NormalizedJob[] = [];
  for (const posting of postings) {
    const detail = await fetchWorkdayDetail(board, posting.externalPath);
    mapped.push(mapWorkdayJob(board, posting, detail));
    await sleep(75);
  }
  return mapped;
}
