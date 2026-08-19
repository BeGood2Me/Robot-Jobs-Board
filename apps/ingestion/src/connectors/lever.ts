import type { LeverPosting } from './api-types';
import { decodeJobHtml, htmlToPlain, mapEmployment, parseLocation } from '../normalize';
import type { NormalizedJob } from '../types';

export function mapLeverJob(posting: LeverPosting): NormalizedJob {
  const html = decodeJobHtml([posting.description, posting.additional].filter(Boolean).join('\n'));
  const plain =
    [posting.descriptionPlain, posting.additionalPlain].filter(Boolean).join('\n') || htmlToPlain(html);
  const locationRaw = posting.categories?.location ?? '';
  const parsed = parseLocation(locationRaw);
  const workplaceHint = (posting.workplaceType ?? posting.categories?.workplaceType ?? '').toLowerCase();
  let workplaceType = parsed.workplaceType;
  if (workplaceHint.includes('remote')) workplaceType = parsed.isRemote ? 'REMOTE' : 'HYBRID';
  if (workplaceHint.includes('hybrid')) workplaceType = 'HYBRID';
  if (workplaceHint.includes('onsite') || workplaceHint.includes('on-site')) workplaceType = 'ONSITE';

  const created =
    typeof posting.createdAt === 'number'
      ? new Date(posting.createdAt)
      : posting.createdAt
        ? new Date(posting.createdAt)
        : null;

  return {
    externalId: posting.id,
    sourceSystem: 'lever',
    title: posting.text?.trim() || 'Untitled role',
    descriptionHtml: html,
    descriptionPlain: plain,
    url: posting.hostedUrl ?? posting.applyUrl ?? '',
    locationRaw: parsed.locationRaw,
    country: parsed.country,
    region: parsed.region,
    city: parsed.city,
    isRemote: parsed.isRemote || workplaceType === 'REMOTE',
    workplaceType,
    employmentType: mapEmployment(posting.categories?.commitment),
    department: posting.categories?.department ?? posting.categories?.team ?? null,
    compensationText: null,
    postedAt: created,
  };
}

export async function fetchLeverJobs(site: string): Promise<NormalizedJob[]> {
  const jobs: NormalizedJob[] = [];
  const limit = 100;
  let skip = 0;

  for (;;) {
    const url = `https://api.lever.co/v0/postings/${encodeURIComponent(site)}?skip=${skip}&limit=${limit}&mode=json`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`Lever fetch failed for ${site}: ${response.status} ${response.statusText}`);
    }
    const page = (await response.json()) as LeverPosting[];
    if (!Array.isArray(page) || page.length === 0) break;
    jobs.push(...page.map(mapLeverJob));
    if (page.length < limit) break;
    skip += limit;
  }

  return jobs;
}
