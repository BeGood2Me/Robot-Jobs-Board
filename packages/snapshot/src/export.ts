import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { prisma } from '@robot-jobs-board/db';
import type { PublicBoardSnapshot, SnapshotJob } from './types';
import { writePublicSnapshotFiles } from './write-snapshot';

const jobDetailSelect = {
  id: true,
  slug: true,
  title: true,
  descriptionHtml: true,
  descriptionPlain: true,
  url: true,
  locationRaw: true,
  country: true,
  region: true,
  city: true,
  isRemote: true,
  workplaceType: true,
  employmentType: true,
  department: true,
  compensationText: true,
  postedAt: true,
  expiresAt: true,
  createdAt: true,
  isHidden: true,
  isActive: true,
  sourceSystem: true,
  externalId: true,
  companyId: true,
  company: {
    select: { name: true, slug: true, website: true, logoUrl: true, sourceIdentifier: true },
  },
  robotDomains: {
    select: { domainId: true, domain: { select: { id: true, slug: true, name: true } } },
  },
  techTags: { select: { techTag: { select: { id: true, slug: true, label: true } } } },
  seniorities: { select: { seniority: { select: { id: true, slug: true, label: true } } } },
} as const;

const publicJobWhere = { isActive: true, isHidden: false };

function serializeJob(
  job: Awaited<
    ReturnType<
      typeof prisma.job.findMany<{ select: typeof jobDetailSelect; where: typeof publicJobWhere }>
    >
  >[number],
): SnapshotJob {
  return {
    ...job,
    postedAt: job.postedAt?.toISOString() ?? null,
    expiresAt: job.expiresAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
  };
}

export async function exportPublicSnapshot(options: {
  outDir: string;
  siteUrl: string;
}): Promise<{ jobCount: number; generatedAt: string }> {
  const site = options.siteUrl.replace(/\/$/, '');
  mkdirSync(options.outDir, { recursive: true });

  const [jobsRaw, goneJobsRaw, companiesRaw, domainsRaw, tagsRaw, seniorities, countryGroups, cityRows, countryRows, regionRows] =
    await Promise.all([
      prisma.job.findMany({
        where: publicJobWhere,
        select: jobDetailSelect,
        orderBy: [{ postedAt: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.job.findMany({
        where: { OR: [{ isActive: false }, { isHidden: true }] },
        select: {
          id: true,
          slug: true,
          title: true,
          company: { select: { name: true, slug: true } },
        },
      }),
      prisma.company.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          website: true,
          logoUrl: true,
          description: true,
          seoIntro: true,
          _count: { select: { jobs: { where: publicJobWhere } } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.robotDomain.findMany({
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          _count: { select: { jobs: { where: { job: publicJobWhere } } } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.techTag.findMany({
        select: {
          id: true,
          slug: true,
          label: true,
          _count: { select: { jobs: { where: { job: publicJobWhere } } } },
        },
        orderBy: { label: 'asc' },
      }),
      prisma.seniorityLevel.findMany({
        orderBy: { label: 'asc' },
        select: { id: true, slug: true, label: true },
      }),
      prisma.job.groupBy({
        by: ['country'],
        where: { ...publicJobWhere, country: { not: null } },
        _count: { _all: true },
      }),
      prisma.job.findMany({
        where: { ...publicJobWhere, city: { not: null } },
        distinct: ['city'],
        select: { city: true },
      }),
      prisma.job.findMany({
        where: { ...publicJobWhere, country: { not: null } },
        distinct: ['country'],
        select: { country: true },
      }),
      prisma.job.findMany({
        where: { ...publicJobWhere, region: { not: null } },
        distinct: ['region'],
        select: { region: true },
      }),
    ]);

  const jobs = jobsRaw.map(serializeJob);
  const preferred = [
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
    'Ireland',
    'Germany',
    'France',
    'Switzerland',
  ];
  const countryFacets = countryGroups
    .filter((row) => row.country)
    .map((row) => ({ country: row.country as string, count: row._count._all }))
    .sort((a, b) => {
      const ai = preferred.indexOf(a.country);
      const bi = preferred.indexOf(b.country);
      if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      return b.count - a.count;
    });

  const snapshot: PublicBoardSnapshot = {
    version: 1,
    generatedAt: new Date().toISOString(),
    siteUrl: site,
    jobs,
    goneJobs: goneJobsRaw,
    companies: companiesRaw.map((company) => ({
      id: company.id,
      name: company.name,
      slug: company.slug,
      website: company.website,
      logoUrl: company.logoUrl,
      description: company.description,
      seoIntro: company.seoIntro,
      openJobCount: company._count.jobs,
    })),
    domains: domainsRaw.map((domain) => ({
      id: domain.id,
      slug: domain.slug,
      name: domain.name,
      description: domain.description,
      openJobCount: domain._count.jobs,
    })),
    tags: tagsRaw.map((tag) => ({
      id: tag.id,
      slug: tag.slug,
      label: tag.label,
      openJobCount: tag._count.jobs,
    })),
    seniorities,
    countryFacets,
    places: {
      cities: cityRows.map((row) => row.city!).filter(Boolean),
      countries: countryRows.map((row) => row.country!).filter(Boolean),
      regions: regionRows.map((row) => row.region!).filter(Boolean),
    },
  };

  writePublicSnapshotFiles(snapshot, options.outDir);
  return { jobCount: jobs.length, generatedAt: snapshot.generatedAt };
}

function findMonorepoRoot(start: string): string {
  let dir = resolve(start);
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml')) && existsSync(join(dir, 'apps', 'web'))) {
      return dir;
    }
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  return resolve(start);
}

export function defaultSnapshotOutDir(cwd = process.cwd()) {
  const root = findMonorepoRoot(cwd);
  return join(root, 'apps', 'web', 'public', 'snapshot');
}

export async function exportPublicSnapshotToDefaultDir(siteUrl: string) {
  const outDir = defaultSnapshotOutDir();
  mkdirSync(dirname(outDir), { recursive: true });
  return exportPublicSnapshot({ outDir, siteUrl });
}
