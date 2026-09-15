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

  const snapshot = await loadPublicSnapshot();
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

/** Search-intent titles for high-volume location slugs (matches footer link wording). */
const LOCATION_SEO: Record<
  string,
  { titleLabel: string; h1: string; description: (count: number) => string; intro: string }
> = {
  remote: {
    titleLabel: 'Remote robotics jobs',
    h1: 'Remote robotics jobs',
    description: (count) =>
      count > 0
        ? `${count} remote and work-from-home robotics jobs across software, autonomy, and operations. Updated daily from company ATS boards.`
        : 'Remote and work-from-home robotics jobs across software, autonomy, and operations. Updated daily from company ATS boards.',
    intro:
      'Remote robotics roles are usually software-heavy: autonomy stacks, simulation, perception, tooling, and fleet ops that do not need daily lab access. Hardware bring-up and field deployment stay on site more often. This page lists live remote openings pulled from public employer boards so you can compare companies without hopping between Greenhouse, Lever, and Ashby.',
  },
  'united-kingdom': {
    titleLabel: 'UK robotics jobs',
    h1: 'UK robotics jobs',
    description: (count) =>
      count > 0
        ? `${count} robotics jobs in the United Kingdom — London, Oxford, Cambridge, and beyond. AMR, humanoid, drone, and autonomy roles updated daily.`
        : 'Robotics jobs in the United Kingdom — London, Oxford, Cambridge, and beyond. AMR, humanoid, drone, and autonomy roles updated daily.',
    intro:
      'The UK robotics market spans warehouse automation, autonomous vehicles, drones, and humanoid research, with clusters in London, Oxford, Cambridge, and other tech hubs. This page collects live UK robotics jobs from public company career pages so you can compare teams, stacks, and locations in one place. Typical requirements include C++, Python, and ROS 2, with a mix of on site and hybrid roles.',
  },
  'united-states': {
    titleLabel: 'US robotics jobs',
    h1: 'US robotics jobs',
    description: (count) =>
      count > 0
        ? `${count} robotics jobs in the United States across Bay Area, Boston, Seattle, and more. Updated daily from employer ATS boards.`
        : 'Robotics jobs in the United States across Bay Area, Boston, Seattle, and more. Updated daily from employer ATS boards.',
    intro:
      'US robotics hiring is concentrated in the Bay Area, Boston, Seattle, Austin, and defense-heavy hubs. This page lists live United States robotics jobs from public ATS feeds — humanoids, AMRs, drones, and industrial automation — so you can scan titles and locations without checking each company board separately.',
  },
  canada: {
    titleLabel: 'Canada robotics jobs',
    h1: 'Canada robotics jobs',
    description: (count) =>
      count > 0
        ? `${count} robotics jobs in Canada, including Toronto, Vancouver, and Montreal. Updated daily from company career pages.`
        : 'Robotics jobs in Canada, including Toronto, Vancouver, and Montreal. Updated daily from company career pages.',
    intro:
      'Canadian robotics hiring sits mainly in Toronto, Montreal, Vancouver, and Waterloo, spanning AV software, warehouse robots, and research labs. This page aggregates live Canada robotics jobs from public employer boards so you can compare openings without hopping between ATS sites.',
  },
};

export function locationPageCopy(
  placeSlug: string,
  fallbackLabel: string,
  jobCount: number,
): { title: string; h1: string; description: string; intro: string } {
  const preset = LOCATION_SEO[placeSlug];
  if (preset) {
    return {
      title: preset.titleLabel,
      h1: preset.h1,
      description: preset.description(jobCount).slice(0, 160),
      intro: preset.intro,
    };
  }
  const roles = jobCount === 1 ? '1 live robotics job' : jobCount > 0 ? `${jobCount} live robotics jobs` : 'Live robotics jobs';
  return {
    title: `${fallbackLabel} robotics jobs`,
    h1: `${fallbackLabel} robotics jobs`,
    description: `${roles} in ${fallbackLabel}, including AMR, humanoid, drone, and industrial roles. Updated from public company boards.`.slice(
      0,
      160,
    ),
    intro: `${fallbackLabel} is a recurring location in robotics hiring, from warehouse AMR deployments to humanoid labs and drone programs. This page collects live jobs tied to that city, region, or country so you can compare teams without bouncing between boards. Typical stacks include C++, Python, and ROS 2, with on site hardware work more common than fully remote software.`,
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
    return { jobs, total: count, indexable: count >= INDEX_JOB_THRESHOLD };
  },
  ['seo-listing'],
  { revalidate: PUBLIC_REVALIDATE_SECONDS },
);

export async function loadListing(filter: ListingFilter, cacheKey: string) {
  const snapshot = await loadPublicSnapshot();
  if (snapshot) {
    const jobs = filterListingJobs(snapshot.jobs, filter);
    const count = countListingJobs(snapshot.jobs, filter);
    return { jobs: jobs as JobCardData[], total: count, indexable: count >= INDEX_JOB_THRESHOLD };
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
  const snapshot = await loadPublicSnapshot();
  if (snapshot) {
    return countListingJobs(snapshot.jobs, filter) >= INDEX_JOB_THRESHOLD;
  }
  return withDb(() => listingIndexableCached(cacheKey, JSON.stringify(filter)), false);
}

export const getDomainBySlug = cache(async (slug: string) => {
  const snapshot = await loadPublicSnapshot();
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
  const snapshot = await loadPublicSnapshot();
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
