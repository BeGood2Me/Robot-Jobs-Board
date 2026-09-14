import { decodeJobHtml, htmlToPlain, mapEmployment, parseLocation } from '../normalize';
import type { NormalizedJob } from '../types';

type JobShopPostalAddress = {
  addressLocality?: string;
  addressRegion?: string;
  addressCountry?: string;
};

type JobShopPlace = {
  '@type'?: string;
  address?: JobShopPostalAddress;
  name?: string;
};

type JobShopJobPosting = {
  '@type'?: string;
  title?: string;
  description?: string;
  datePosted?: string;
  employmentType?: string | string[];
  url?: string;
  identifier?: { value?: string } | string;
  jobLocation?: JobShopPlace | JobShopPlace[];
};

export type JobShopBoardConfig = {
  /** Public careers host, e.g. https://jobs.neura-robotics.com */
  site: string;
};

function asPlaces(value: JobShopJobPosting['jobLocation']): JobShopPlace[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

const ISO_COUNTRY_NAMES: Record<string, string> = {
  us: 'United States',
  usa: 'United States',
  gb: 'United Kingdom',
  uk: 'United Kingdom',
  de: 'Germany',
  ch: 'Switzerland',
  fr: 'France',
  at: 'Austria',
  nl: 'Netherlands',
  be: 'Belgium',
  es: 'Spain',
  it: 'Italy',
  se: 'Sweden',
  dk: 'Denmark',
  fi: 'Finland',
  no: 'Norway',
  ie: 'Ireland',
  pl: 'Poland',
  cz: 'Czech Republic',
  pt: 'Portugal',
  ca: 'Canada',
  au: 'Australia',
};

function countryLabel(value?: string): string | undefined {
  if (!value?.trim()) return undefined;
  const key = value.trim().toLowerCase();
  return ISO_COUNTRY_NAMES[key] ?? value.trim();
}

function locationRawFromPlaces(places: JobShopPlace[]): string {
  const parts: string[] = [];
  for (const place of places) {
    const locality = place.address?.addressLocality?.trim();
    const region = place.address?.addressRegion?.trim();
    const country = countryLabel(place.address?.addressCountry);
    const chunk = [locality, region, country].filter(Boolean).join(', ');
    if (chunk) parts.push(chunk);
    else if (place.name?.trim()) parts.push(place.name.trim());
  }
  return [...new Set(parts)].join(' | ');
}

function externalIdFromUrl(url: string, posting: JobShopJobPosting): string {
  if (typeof posting.identifier === 'string' && posting.identifier.trim()) return posting.identifier.trim();
  if (posting.identifier && typeof posting.identifier === 'object' && posting.identifier.value) {
    return String(posting.identifier.value);
  }
  const match = url.match(/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i);
  if (match?.[1]) return match[1];
  return url;
}

function cleanTitle(title: string): string {
  return title.replace(/\s*\(human\)\s*$/i, '').trim() || 'Untitled role';
}

export function mapJobShopJobPosting(posting: JobShopJobPosting, pageUrl: string): NormalizedJob {
  const html = decodeJobHtml(posting.description ?? '');
  const plain = htmlToPlain(html);
  const places = asPlaces(posting.jobLocation);
  const locationRaw = locationRawFromPlaces(places);
  const parsed = parseLocation(locationRaw);
  const employmentRaw = Array.isArray(posting.employmentType)
    ? posting.employmentType.join(' ')
    : (posting.employmentType ?? '');

  return {
    externalId: externalIdFromUrl(pageUrl, posting),
    sourceSystem: 'jobshop',
    title: cleanTitle(posting.title?.trim() || 'Untitled role'),
    descriptionHtml: html,
    descriptionPlain: plain,
    url: posting.url?.trim() || pageUrl,
    locationRaw: parsed.locationRaw || locationRaw || '',
    country: parsed.country,
    region: parsed.region,
    city: parsed.city,
    isRemote: parsed.isRemote,
    workplaceType: parsed.workplaceType,
    employmentType: mapEmployment(employmentRaw),
    department: null,
    compensationText: null,
    postedAt: posting.datePosted ? new Date(posting.datePosted) : null,
  };
}

function extractJobPostings(html: string): JobShopJobPosting[] {
  const blocks = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) ?? [];
  const postings: JobShopJobPosting[] = [];
  for (const block of blocks) {
    const jsonText = block.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '');
    try {
      const data = JSON.parse(jsonText) as JobShopJobPosting | { '@graph'?: JobShopJobPosting[] };
      if (Array.isArray((data as { '@graph'?: JobShopJobPosting[] })['@graph'])) {
        for (const node of (data as { '@graph': JobShopJobPosting[] })['@graph']) {
          if (node?.['@type'] === 'JobPosting') postings.push(node);
        }
      } else if ((data as JobShopJobPosting)['@type'] === 'JobPosting') {
        postings.push(data as JobShopJobPosting);
      }
    } catch {
      // ignore malformed JSON-LD blocks
    }
  }
  return postings;
}

async function listOfferUrls(site: string): Promise<string[]> {
  const base = site.replace(/\/$/, '');
  const response = await fetch(`${base}/sitemap.xml`, {
    headers: { Accept: 'application/xml,text/xml', 'User-Agent': 'robot-jobs-board/0.1' },
  });
  if (!response.ok) {
    throw new Error(`JobShop sitemap fetch failed for ${base}: ${response.status} ${response.statusText}`);
  }
  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>(https?:\/\/[^<]+\/offer\/[^<]+)<\/loc>/gi)].map((match) => match[1]);
  return [...new Set(urls)];
}

async function mapPool<T, R>(items: T[], concurrency: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let index = 0;
  async function run() {
    while (index < items.length) {
      const current = index++;
      results[current] = await worker(items[current]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => run()));
  return results;
}

export async function fetchJobShopJobs(config: JobShopBoardConfig): Promise<NormalizedJob[]> {
  const site = config.site.replace(/\/$/, '');
  const offerUrls = await listOfferUrls(site);
  const pages = await mapPool(offerUrls, 8, async (url) => {
    const response = await fetch(url, {
      headers: { Accept: 'text/html', 'User-Agent': 'robot-jobs-board/0.1' },
    });
    if (!response.ok) return [] as NormalizedJob[];
    const html = await response.text();
    return extractJobPostings(html).map((posting) => mapJobShopJobPosting(posting, url));
  });

  const byId = new Map<string, NormalizedJob>();
  for (const job of pages.flat()) {
    if (!job.url || !job.title) continue;
    byId.set(job.externalId, job);
  }
  return [...byId.values()];
}
