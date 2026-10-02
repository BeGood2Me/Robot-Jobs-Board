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

/** Search-intent copy for robot-type hubs (`/robots/{slug}-jobs`). */
const DOMAIN_SEO: Record<
  string,
  {
    h1: string;
    title: (count: number) => string;
    description: (count: number) => string;
    intro: (fallbackDescription: string) => string;
  }
> = {
  amr: {
    h1: 'AMR jobs',
    title: (count) => (count > 0 ? `AMR jobs (${count} open)` : 'AMR jobs'),
    description: (count) =>
      count > 0
        ? `${count} autonomous mobile robot (AMR) jobs — warehouse, factory, and logistics robotics. Updated daily on Robot Jobs Board.`
        : 'Autonomous mobile robot (AMR) jobs for warehouse, factory, and logistics robotics. Updated daily on Robot Jobs Board.',
    intro: (fallbackDescription) =>
      `${fallbackDescription} AMR hiring usually mixes fleet software, navigation, perception, and on-site deployment in warehouses and factories. This page lists live AMR jobs from public company ATS boards so you can compare titles and locations, then apply on the original posting. Pair it with industrial or field hubs if you also want fixed arms or outdoor robots.`,
  },
  humanoid: {
    h1: 'Humanoid robot jobs',
    title: (count) => (count > 0 ? `Humanoid robot jobs (${count} open)` : 'Humanoid robot jobs'),
    description: (count) =>
      count > 0
        ? `${count} humanoid robot jobs — learning, controls, hardware, and ops. Updated daily from public ATS boards on Robot Jobs Board.`
        : 'Humanoid robot jobs across learning, controls, hardware, and ops. Updated daily from public ATS boards on Robot Jobs Board.',
    intro: (fallbackDescription) =>
      `${fallbackDescription} Humanoid teams hire for robot learning, whole-body control, actuators, teleoperation, and data collection — often in Bay Area, Boston, and European labs. Browse live humanoid jobs here without hopping between Greenhouse and Lever. Cross-check AMR or industrial hubs if you want warehouse or factory manipulators instead.`,
  },
  drone: {
    h1: 'Drone and UAV jobs',
    title: (count) => (count > 0 ? `Drone jobs (${count} open)` : 'Drone and UAV jobs'),
    description: (count) =>
      count > 0
        ? `${count} drone and UAV jobs — autonomy, avionics, mapping, delivery, and defense. Updated daily on Robot Jobs Board.`
        : 'Drone and UAV jobs across autonomy, avionics, mapping, delivery, and defense. Updated daily on Robot Jobs Board.',
    intro: (fallbackDescription) =>
      `${fallbackDescription} Drone hiring spans onboard autonomy, GNC, perception, ground stations, and flight ops for inspection, delivery, mapping, and defense. This hub aggregates live drone jobs from public employer boards so you can scan companies in one place. See field robotics for ground robots that work outdoors alongside UAVs.`,
  },
  industrial: {
    h1: 'Industrial robotics jobs',
    title: (count) =>
      count > 0 ? `Industrial robotics jobs (${count} open)` : 'Industrial robotics jobs',
    description: (count) =>
      count > 0
        ? `${count} industrial robotics jobs — cobots, welding, assembly, and pick-and-place. Updated daily on Robot Jobs Board.`
        : 'Industrial robotics jobs for cobots, welding, assembly, and pick-and-place. Updated daily on Robot Jobs Board.',
    intro: (fallbackDescription) =>
      `${fallbackDescription} Industrial roles often sit on factory floors: cell design, PLC integration, vision-guided picking, and collaborative arms. Use this page for live industrial robotics jobs pulled from public ATS feeds, then apply on the company career page. AMR jobs cover mobile warehouse robots; humanoid hubs cover general-purpose bipeds.`,
  },
  field: {
    h1: 'Field robotics jobs',
    title: (count) => (count > 0 ? `Field robotics jobs (${count} open)` : 'Field robotics jobs'),
    description: (count) =>
      count > 0
        ? `${count} field robotics jobs — outdoor, inspection, agriculture, and quadruped platforms. Updated daily on Robot Jobs Board.`
        : 'Field robotics jobs for outdoor, inspection, agriculture, and quadruped platforms. Updated daily on Robot Jobs Board.',
    intro: (fallbackDescription) =>
      `${fallbackDescription} Field robotics hiring covers outdoor navigation, rugged platforms, agriculture, and inspection — often with more on-site work than pure software roles. Scan live field robotics jobs here from public company boards. Pair with drone jobs for aerial inspection programs.`,
  },
  medical: {
    h1: 'Medical robotics jobs',
    title: (count) =>
      count > 0 ? `Medical robotics jobs (${count} open)` : 'Medical robotics jobs',
    description: (count) =>
      count > 0
        ? `${count} medical robotics jobs — surgical, rehab, and hospital platforms. Updated daily on Robot Jobs Board.`
        : 'Medical robotics jobs across surgical, rehab, and hospital platforms. Updated daily on Robot Jobs Board.',
    intro: (fallbackDescription) =>
      `${fallbackDescription} Medical robotics teams hire for surgical systems, rehab devices, and hospital automation with heavy safety and regulatory work. This page lists live medical robotics jobs when employers post them on public ATS boards. Check industrial or humanoid hubs for adjacent manipulation jobs.`,
  },
};

export function domainCopy(
  slug: string,
  name: string,
  description: string,
  jobCount = 0,
): {
  h1: string;
  title: string;
  description: string;
  intro: string;
} {
  const preset = DOMAIN_SEO[slug];
  if (preset) {
    return {
      h1: preset.h1,
      title: preset.title(jobCount),
      description: preset.description(jobCount).slice(0, 160),
      intro: preset.intro(description),
    };
  }
  return {
    h1: `${name} robotics jobs`,
    title: jobCount > 0 ? `${name} robotics jobs (${jobCount} open)` : `${name} robotics jobs`,
    description: `Open ${name} robotics jobs for engineers — software, hardware, and deployment. Updated from public company ATS boards.`.slice(
      0,
      160,
    ),
    intro: `${description} Teams hiring in this domain typically look for a mix of software (C++, Python, ROS 2) and hardware bring-up. Use this page to scan current ${name} jobs, then filter by seniority or city. Robot Jobs Board refreshes listings from public ATS boards so you can apply on the original posting.`,
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
  {
    titleLabel: (count: number) => string;
    h1: string;
    description: (count: number) => string;
    intro: string;
  }
> = {
  remote: {
    titleLabel: (count) =>
      count > 0 ? `Remote robotics jobs (${count} open)` : 'Remote robotics jobs',
    h1: 'Remote robotics jobs',
    description: (count) =>
      count > 0
        ? `${count} remote robotics jobs — autonomy, simulation, perception, and fleet ops. Updated daily from public company ATS boards on Robot Jobs Board.`
        : 'Remote robotics jobs across autonomy, simulation, perception, and fleet ops. Updated daily from public company ATS boards.',
    intro:
      'Remote robotics jobs are usually software-heavy: autonomy stacks, simulation, perception, tooling, and fleet ops that do not need daily lab access. Hardware bring-up and field deployment stay on site more often. This page lists live remote openings pulled from public employer boards so you can compare companies without hopping between Greenhouse, Lever, and Ashby. Pair it with the US or UK hubs if you also want on-site lab jobs.',
  },
  'united-kingdom': {
    titleLabel: (count) => (count > 0 ? `UK robotics jobs (${count} open)` : 'UK robotics jobs'),
    h1: 'UK robotics jobs',
    description: (count) =>
      count > 0
        ? `${count} UK robotics jobs in London, Oxford, Cambridge, and beyond — AMR, humanoid, drone, and autonomy. Updated daily on Robot Jobs Board.`
        : 'UK robotics jobs in London, Oxford, Cambridge, and beyond — AMR, humanoid, drone, and autonomy. Updated daily on Robot Jobs Board.',
    intro:
      'The UK robotics market spans warehouse automation, autonomous vehicles, drones, and humanoid research, with clusters in London, Oxford, Cambridge, Bristol, and Edinburgh. This page collects live UK robotics jobs from public company career pages so you can compare teams, stacks, and locations in one place. Typical requirements include C++, Python, and ROS 2, with a mix of on-site and hybrid jobs. For fully remote software jobs, see the remote robotics jobs hub.',
  },
  'united-states': {
    titleLabel: (count) =>
      count > 0 ? `Robotics jobs in the United States (${count} open)` : 'Robotics jobs in the United States',
    h1: 'Robotics jobs in the United States',
    description: (count) =>
      count > 0
        ? `${count} US robotics jobs across Bay Area, Boston, Seattle, Austin, and more. Humanoids, AMRs, drones — updated daily on Robot Jobs Board.`
        : 'US robotics jobs across Bay Area, Boston, Seattle, Austin, and more. Humanoids, AMRs, drones — updated daily on Robot Jobs Board.',
    intro:
      'US robotics hiring concentrates in the Bay Area, Boston, Seattle, Austin, Pittsburgh, and defense-heavy hubs. This page lists live United States robotics jobs from public ATS feeds — humanoids, AMRs, drones, industrial automation, and AV stacks — so you can scan titles and locations without checking each company board separately. Jump to remote robotics jobs for software-only openings, or open a company page when you already know the employer.',
  },
  canada: {
    titleLabel: (count) =>
      count > 0 ? `Canada robotics jobs (${count} open)` : 'Canada robotics jobs',
    h1: 'Canada robotics jobs',
    description: (count) =>
      count > 0
        ? `${count} Canada robotics jobs in Toronto, Montreal, Vancouver, and Waterloo. Updated daily from company ATS boards.`
        : 'Canada robotics jobs in Toronto, Montreal, Vancouver, and Waterloo. Updated daily from company ATS boards.',
    intro:
      'Canadian robotics hiring sits mainly in Toronto, Montreal, Vancouver, and Waterloo, spanning AV software, warehouse robots, and research labs. This page aggregates live Canada robotics jobs from public employer boards so you can compare openings without hopping between ATS sites. Cross-check the US hub if you are also open to Bay Area or Boston jobs.',
  },
  germany: {
    titleLabel: (count) =>
      count > 0 ? `Germany robotics jobs (${count} open)` : 'Germany robotics jobs',
    h1: 'Germany robotics jobs',
    description: (count) =>
      count > 0
        ? `${count} Germany robotics jobs in Munich, Stuttgart, Berlin, and beyond — industrial, humanoid, and autonomy. Updated daily on Robot Jobs Board.`
        : 'Germany robotics jobs in Munich, Stuttgart, Berlin, and beyond — industrial, humanoid, and autonomy. Updated daily on Robot Jobs Board.',
    intro:
      'Germany is a core European robotics market: industrial automation, automotive suppliers, and growing humanoid and autonomy labs around Munich, Stuttgart, Berlin, and Aachen. This page lists live Germany robotics jobs from public company ATS boards so you can compare employers in one place. Pair it with the UK hub for other European openings.',
  },
  california: {
    titleLabel: (count) =>
      count > 0 ? `California robotics jobs (${count} open)` : 'California robotics jobs',
    h1: 'California robotics jobs',
    description: (count) =>
      count > 0
        ? `${count} California robotics jobs — Bay Area, LA, San Diego. Humanoids, AMRs, drones, AV. Updated daily on Robot Jobs Board.`
        : 'California robotics jobs across Bay Area, LA, and San Diego — humanoids, AMRs, drones, AV. Updated daily on Robot Jobs Board.',
    intro:
      'California hosts the densest US robotics cluster: Bay Area humanoid and AV labs, Southern California autonomy and defense, and warehouse automation across the state. Browse live California robotics jobs aggregated from public employer boards, then apply on the original ATS posting. Narrow further with San Francisco or remote hubs if you already know the work style you want.',
  },
  'san-francisco': {
    titleLabel: (count) =>
      count > 0 ? `San Francisco robotics jobs (${count} open)` : 'San Francisco robotics jobs',
    h1: 'San Francisco robotics jobs',
    description: (count) =>
      count > 0
        ? `${count} San Francisco robotics jobs — humanoids, AV, drones, and robot learning. Updated daily on Robot Jobs Board.`
        : 'San Francisco robotics jobs across humanoids, AV, drones, and robot learning. Updated daily on Robot Jobs Board.',
    intro:
      'San Francisco and the wider Bay Area hire heavily for robot learning, autonomy software, and humanoid hardware. This page collects live San Francisco robotics jobs from public career pages so you can compare companies without checking each board separately. Use the California or remote hubs if you want statewide or fully remote software jobs.',
  },
  boston: {
    titleLabel: (count) =>
      count > 0 ? `Boston robotics jobs (${count} open)` : 'Boston robotics jobs',
    h1: 'Boston robotics jobs',
    description: (count) =>
      count > 0
        ? `${count} Boston robotics jobs — autonomy, warehouses, medical, and research labs. Updated daily on Robot Jobs Board.`
        : 'Boston robotics jobs across autonomy, warehouses, medical, and research labs. Updated daily on Robot Jobs Board.',
    intro:
      'Boston and Greater Boston are long-standing robotics hubs spanning academia spinouts, warehouse automation, and medical platforms. Scan live Boston robotics jobs pulled from public ATS feeds, then apply on the employer site. Cross-check US or remote hubs if you are flexible on location.',
  },
  austin: {
    titleLabel: (count) =>
      count > 0 ? `Austin robotics jobs (${count} open)` : 'Austin robotics jobs',
    h1: 'Austin robotics jobs',
    description: (count) =>
      count > 0
        ? `${count} Austin robotics jobs — autonomy, hardware, and growing robot labs in Texas. Updated daily on Robot Jobs Board.`
        : 'Austin robotics jobs across autonomy, hardware, and growing robot labs in Texas. Updated daily on Robot Jobs Board.',
    intro:
      'Austin has become a secondary US robotics cluster for autonomy software, hardware bring-up, and defense-adjacent teams. This page lists live Austin robotics jobs from public company boards so you can compare openings in one feed. See the US hub for nationwide roles or remote for software-only jobs.',
  },
  norway: {
    titleLabel: (count) =>
      count > 0 ? `Norway robotics jobs (${count} open)` : 'Norway robotics jobs',
    h1: 'Norway robotics jobs',
    description: (count) =>
      count > 0
        ? `${count} Norway robotics jobs — autonomy, industrial, and maritime-adjacent teams. Updated daily on Robot Jobs Board.`
        : 'Norway robotics jobs across autonomy, industrial, and maritime-adjacent teams. Updated daily on Robot Jobs Board.',
    intro:
      'Norway robotics hiring is smaller but active around industrial automation, autonomy, and maritime-adjacent platforms. This page aggregates live Norway robotics jobs from public employer ATS boards. Check Germany or the UK hubs for denser European markets.',
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
      title: preset.titleLabel(jobCount),
      h1: preset.h1,
      description: preset.description(jobCount).slice(0, 160),
      intro: preset.intro,
    };
  }
  const jobs =
    jobCount === 1 ? '1 live robotics job' : jobCount > 0 ? `${jobCount} live robotics jobs` : 'Live robotics jobs';
  return {
    title: jobCount > 0 ? `${fallbackLabel} robotics jobs (${jobCount} open)` : `${fallbackLabel} robotics jobs`,
    h1: `${fallbackLabel} robotics jobs`,
    description: `${jobs} in ${fallbackLabel}, including AMR, humanoid, drone, and industrial openings. Updated from public company boards.`.slice(
      0,
      160,
    ),
    intro: `${fallbackLabel} is a recurring location in robotics hiring, from warehouse AMR deployments to humanoid labs and drone programs. This page collects live jobs tied to that city, region, or country so you can compare teams without bouncing between boards. Typical stacks include C++, Python, and ROS 2, with on-site hardware work more common than fully remote software.`,
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
