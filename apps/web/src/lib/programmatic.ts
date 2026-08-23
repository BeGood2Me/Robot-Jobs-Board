import type { Prisma } from '@robot-jobs-board/db';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import {
  countListingJobs,
  filterListingJobs,
  type ListingFilter,
} from '@robot-jobs-board/snapshot';
import { prisma, withDb } from './db';
import { jobCardSelect, type JobCardData } from './jobs';
import { loadPublicSnapshot } from './snapshot/load';
import { listingFilterToPrisma } from './snapshot/listing-filter';
import { INDEX_JOB_THRESHOLD, PUBLIC_REVALIDATE_SECONDS, slugify } from './site';

export type ProgrammaticKind = 'domain' | 'skill' | 'location' | 'combo';

export type ProgrammaticPage = {
  kind: ProgrammaticKind;
  title: string;
  description: string;
  h1: string;
  intro: string;
  filter: ListingFilter;
  canonicalPath: string;
};

export function parseDomainSlug(param: string): string | null {
  const match = param.match(/^([a-z0-9-]+)-jobs$/);
  return match?.[1] ?? null;
}

export function parseSkillSlug(param: string): string | null {
  const match = param.match(/^([a-z0-9-]+)-jobs$/);
  return match?.[1] ?? null;
}

const loadPlaceIndex = unstable_cache(
  async () => {
    const [cities, countries, regions] = await Promise.all([
      prisma.job.findMany({
        where: { isActive: true, isHidden: false, city: { not: null } },
        distinct: ['city'],
        select: { city: true },
      }),
      prisma.job.findMany({
        where: { isActive: true, isHidden: false, country: { not: null } },
        distinct: ['country'],
        select: { country: true },
      }),
      prisma.job.findMany({
        where: { isActive: true, isHidden: false, region: { not: null } },
        distinct: ['region'],
        select: { region: true },
      }),
    ]);
    return { cities, countries, regions };
  },
  ['place-index'],
  { revalidate: PUBLIC_REVALIDATE_SECONDS },
);

export const resolvePlace = cache(async (place: string): Promise<{
  label: string;
  filter: ListingFilter;
} | null> => {
  if (place === 'remote') {
    return { label: 'Remote', filter: { kind: 'remote' } };
  }

  const snapshot = loadPublicSnapshot();
  if (snapshot) {
    const city = snapshot.places.cities.find((value) => slugify(value) === place);
    if (city) return { label: city, filter: { kind: 'city', value: city } };
    const region = snapshot.places.regions.find((value) => slugify(value) === place);
    if (region) return { label: region, filter: { kind: 'region', value: region } };
    const country = snapshot.places.countries.find((value) => slugify(value) === place);
    if (country) return { label: country, filter: { kind: 'country', value: country } };
  } else {
    const places = await withDb(loadPlaceIndex, { cities: [], countries: [], regions: [] });
    const city = places.cities.find((row) => slugify(row.city ?? '') === place);
    if (city?.city) return { label: city.city, filter: { kind: 'city', value: city.city } };
    const region = places.regions.find((row) => slugify(row.region ?? '') === place);
    if (region?.region) return { label: region.region, filter: { kind: 'region', value: region.region } };
    const country = places.countries.find((row) => slugify(row.country ?? '') === place);
    if (country?.country) return { label: country.country, filter: { kind: 'country', value: country.country } };
  }

  const pretty = place
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  return {
    label: pretty,
    filter: {
      kind: 'or',
      filters: [
        { kind: 'city', value: pretty },
        { kind: 'country', value: pretty },
      ],
    },
  };
});

export function domainCopy(name: string, description: string): {
  h1: string;
  title: string;
  description: string;
  intro: string;
} {
  return {
    h1: `${name} robotics jobs`,
    title: `${name} robotics jobs`,
    description: `Open ${name} jobs for robotics engineers, including software, hardware, and deployment.`,
    intro: `${description} Teams hiring in this domain typically look for a mix of software (C++, Python, ROS 2) and hardware bring up. Use this page to scan current ${name} openings, then filter by seniority or city. Robot Jobs Board refreshes listings from public ATS boards so you can apply on the original posting.`,
  };
}

export function skillCopy(label: string): { h1: string; title: string; description: string; intro: string } {
  return {
    h1: `${label} robotics jobs`,
    title: `${label} robotics jobs`,
    description: `Robotics jobs that mention ${label} in the title or description.`,
    intro: `${label} shows up across autonomy, controls, perception, and simulation teams. This page lists live robotics jobs tagged with ${label} so you can compare companies without hopping between ATS boards. Pair it with a robot domain filter if you already know you want AMRs, humanoids, or drones.`,
  };
}

const loadListingCached = unstable_cache(
  async (cacheKey: string, filterJson: string) => {
    const filter = JSON.parse(filterJson) as ListingFilter;
    const where = listingFilterToPrisma(filter);
    const jobs = await prisma.job.findMany({
      where: { isActive: true, isHidden: false, ...where },
      select: jobCardSelect,
      orderBy: { postedAt: 'desc' },
      take: 50,
    });
    const count = await prisma.job.count({
      where: { isActive: true, isHidden: false, ...where },
    });
    return { jobs, total: jobs.length, indexable: count >= INDEX_JOB_THRESHOLD };
  },
  ['seo-listing'],
  { revalidate: PUBLIC_REVALIDATE_SECONDS },
);

export async function loadListing(filter: ListingFilter, cacheKey: string) {
  const snapshot = loadPublicSnapshot();
  if (snapshot) {
    const jobs = filterListingJobs(snapshot.jobs, filter);
    const count = countListingJobs(snapshot.jobs, filter);
    return { jobs: jobs as JobCardData[], total: jobs.length, indexable: count >= INDEX_JOB_THRESHOLD };
  }
  return withDb(
    () => loadListingCached(cacheKey, JSON.stringify(filter)),
    { jobs: [] as JobCardData[], total: 0, indexable: false },
  );
}

const listingIndexableCached = unstable_cache(
  async (cacheKey: string, filterJson: string) => {
    const filter = JSON.parse(filterJson) as ListingFilter;
    const where = listingFilterToPrisma(filter);
    const count = await prisma.job.count({
      where: { isActive: true, isHidden: false, ...where },
    });
    return count >= INDEX_JOB_THRESHOLD;
  },
  ['seo-listing-indexable'],
  { revalidate: PUBLIC_REVALIDATE_SECONDS },
);

export async function listingIsIndexable(filter: ListingFilter, cacheKey: string) {
  const snapshot = loadPublicSnapshot();
  if (snapshot) {
    return countListingJobs(snapshot.jobs, filter) >= INDEX_JOB_THRESHOLD;
  }
  return withDb(() => listingIndexableCached(cacheKey, JSON.stringify(filter)), false);
}

export const getDomainBySlug = cache(async (slug: string) => {
  const snapshot = loadPublicSnapshot();
  if (snapshot) {
    return snapshot.domains.find((domain) => domain.slug === slug) ?? null;
  }
  return withDb(
    () =>
      prisma.robotDomain.findUnique({
        where: { slug },
        select: { id: true, slug: true, name: true, description: true },
      }),
    null,
  );
});

export const getTagBySlug = cache(async (slug: string) => {
  const snapshot = loadPublicSnapshot();
  if (snapshot) {
    return snapshot.tags.find((tag) => tag.slug === slug) ?? null;
  }
  return withDb(
    () =>
      prisma.techTag.findUnique({
        where: { slug },
        select: { id: true, slug: true, label: true },
      }),
    null,
  );
});

/** @deprecated Use ListingFilter in new code. */
export type LegacyProgrammaticWhere = Prisma.JobWhereInput;
