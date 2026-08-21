import type { Prisma } from '@robot-jobs-board/db';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { prisma, withDb } from './db';
import { jobCardSelect, type JobCardData } from './jobs';
import { INDEX_JOB_THRESHOLD, PUBLIC_REVALIDATE_SECONDS, slugify } from './site';

export type ProgrammaticKind = 'domain' | 'skill' | 'location' | 'combo';

export type ProgrammaticPage = {
  kind: ProgrammaticKind;
  title: string;
  description: string;
  h1: string;
  intro: string;
  where: Prisma.JobWhereInput;
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
  where: Prisma.JobWhereInput;
} | null> => {
  if (place === 'remote') {
    return { label: 'Remote', where: { isRemote: true } };
  }
  const companies = await withDb(loadPlaceIndex, { cities: [], countries: [], regions: [] });

  const city = companies.cities.find((row) => slugify(row.city ?? '') === place);
  if (city?.city) return { label: city.city, where: { city: city.city } };
  const region = companies.regions.find((row) => slugify(row.region ?? '') === place);
  if (region?.region) return { label: region.region, where: { region: region.region } };
  const country = companies.countries.find((row) => slugify(row.country ?? '') === place);
  if (country?.country) return { label: country.country, where: { country: country.country } };

  const pretty = place
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  return {
    label: pretty,
    where: {
      OR: [
        { city: { equals: pretty, mode: 'insensitive' } },
        { country: { equals: pretty, mode: 'insensitive' } },
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
  async (cacheKey: string, whereJson: string) => {
    const where = JSON.parse(whereJson) as Prisma.JobWhereInput;
    const jobs = await prisma.job.findMany({
      where: { isActive: true, isHidden: false, ...where },
      select: jobCardSelect,
      orderBy: { postedAt: 'desc' },
      take: 50,
    });
    return { jobs, total: jobs.length, indexable: jobs.length >= INDEX_JOB_THRESHOLD };
  },
  ['seo-listing'],
  { revalidate: PUBLIC_REVALIDATE_SECONDS },
);

export async function loadListing(where: Prisma.JobWhereInput, cacheKey: string) {
  return withDb(
    () => loadListingCached(cacheKey, JSON.stringify(where)),
    { jobs: [] as JobCardData[], total: 0, indexable: false },
  );
}

const listingIndexableCached = unstable_cache(
  async (cacheKey: string, whereJson: string) => {
    const where = JSON.parse(whereJson) as Prisma.JobWhereInput;
    const count = await prisma.job.count({
      where: { isActive: true, isHidden: false, ...where },
    });
    return count >= INDEX_JOB_THRESHOLD;
  },
  ['seo-listing-indexable'],
  { revalidate: PUBLIC_REVALIDATE_SECONDS },
);

/** Metadata-only: count instead of fetching 50 job cards. */
export async function listingIsIndexable(where: Prisma.JobWhereInput, cacheKey: string) {
  return withDb(() => listingIndexableCached(cacheKey, JSON.stringify(where)), false);
}

export const getDomainBySlug = cache(async (slug: string) =>
  withDb(
    () =>
      prisma.robotDomain.findUnique({
        where: { slug },
        select: { id: true, slug: true, name: true, description: true },
      }),
    null,
  ),
);

export const getTagBySlug = cache(async (slug: string) =>
  withDb(
    () =>
      prisma.techTag.findUnique({
        where: { slug },
        select: { id: true, slug: true, label: true },
      }),
    null,
  ),
);
