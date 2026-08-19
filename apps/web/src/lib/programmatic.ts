import type { Prisma } from '@robot-jobs-board/db';
import { INDEX_JOB_THRESHOLD, slugify } from './site';
import { prisma, withDb } from './db';
import { jobCardInclude, type JobWithRelations } from './jobs';

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

export async function resolvePlace(place: string): Promise<{
  label: string;
  where: Prisma.JobWhereInput;
} | null> {
  if (place === 'remote') {
    return { label: 'Remote', where: { isRemote: true } };
  }
  const companies = await withDb(
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
    { cities: [], countries: [], regions: [] },
  );

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
  return { label: pretty, where: { OR: [{ city: { equals: pretty, mode: 'insensitive' } }, { country: { equals: pretty, mode: 'insensitive' } }] } };
}

export function domainCopy(name: string, description: string): { h1: string; title: string; description: string; intro: string } {
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

export async function loadListing(where: Prisma.JobWhereInput) {
  return withDb(async () => {
    const jobs = await prisma.job.findMany({
      where: { isActive: true, isHidden: false, ...where },
      include: jobCardInclude,
      orderBy: { postedAt: 'desc' },
      take: 50,
    });
    return { jobs, total: jobs.length, indexable: jobs.length >= INDEX_JOB_THRESHOLD };
  }, { jobs: [] as JobWithRelations[], total: 0, indexable: false });
}
