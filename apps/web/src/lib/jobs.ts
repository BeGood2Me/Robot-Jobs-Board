import type { EmploymentType, Prisma, WorkplaceType } from '@robot-jobs-board/db';
import {
  relatedJobsFromSnapshot,
  searchJobsFromSnapshot,
} from '@robot-jobs-board/snapshot';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { prisma, withDb } from './db';
import { type JobFilters } from './job-filter-utils';
import { loadPublicSnapshot } from './snapshot/load';
import { PAGE_SIZE, PUBLIC_REVALIDATE_SECONDS } from './site';

export type { JobFilters } from './job-filter-utils';
export { countActiveFilters, filtersFromSearchParams, jobBoardHref } from './job-filter-utils';

export const jobCardSelect = {
  id: true,
  slug: true,
  title: true,
  city: true,
  country: true,
  locationRaw: true,
  isRemote: true,
  workplaceType: true,
  employmentType: true,
  postedAt: true,
  company: { select: { name: true, slug: true } },
} satisfies Prisma.JobSelect;

export type JobCardData = Prisma.JobGetPayload<{ select: typeof jobCardSelect }>;

/** Explicit columns for detail pages — avoids transferring unused Job/Company TEXT. */
export const jobDetailSelect = {
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
} satisfies Prisma.JobSelect;

/** @deprecated Prefer jobDetailSelect / jobCardSelect. */
export const jobDetailInclude = {
  company: { select: { name: true, slug: true, website: true, logoUrl: true, sourceIdentifier: true } },
  robotDomains: { include: { domain: { select: { id: true, slug: true, name: true } } } },
  techTags: { include: { techTag: { select: { id: true, slug: true, label: true } } } },
  seniorities: { include: { seniority: { select: { id: true, slug: true, label: true } } } },
} satisfies Prisma.JobInclude;

export const jobCardInclude = jobDetailInclude;

export type JobWithRelations = Prisma.JobGetPayload<{ select: typeof jobDetailSelect }>;

export const publicJobWhere = {
  isActive: true,
  isHidden: false,
} satisfies Prisma.JobWhereInput;

const WORKPLACES: WorkplaceType[] = ['ONSITE', 'REMOTE', 'HYBRID'];
const EMPLOYMENTS: EmploymentType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'TEMPORARY'];

const EARLY_CAREER_TITLE_TERMS = [
  'junior',
  'new grad',
  'new-grad',
  'newgrad',
  'new graduate',
  'entry level',
  'entry-level',
  'early career',
  'early-career',
  'apprentice',
  'co-op',
  'associate engineer',
  'associate software',
  'associate robotics',
  'graduate engineer',
  'recent graduate',
  'campus hire',
  'university hire',
  'university graduate',
];

const EXPERIENCED_TITLE_TERMS = [
  'senior',
  'sr.',
  'sr ',
  'staff',
  'principal',
  'director',
  'manager',
  'head of',
  'vice president',
  'chief',
  'distinguished',
  'fellow',
  'lead',
];

function titleContains(term: string): Prisma.JobWhereInput {
  return { title: { contains: term, mode: 'insensitive' } };
}

function internTitleWhere(): Prisma.JobWhereInput {
  return {
    OR: [
      titleContains('internship'),
      titleContains('intern '),
      titleContains('intern,'),
      titleContains('intern-'),
      titleContains('intern/'),
      titleContains('intern)'),
      titleContains('co-op'),
      titleContains('co op'),
      titleContains('apprentice'),
      { title: { startsWith: 'intern ', mode: 'insensitive' } },
      { title: { startsWith: 'intern,', mode: 'insensitive' } },
      { title: { endsWith: ' intern', mode: 'insensitive' } },
      { title: { equals: 'intern', mode: 'insensitive' } },
    ],
  };
}

function internWhere(): Prisma.JobWhereInput {
  return { OR: [{ employmentType: 'INTERN' }, internTitleWhere()] };
}

function experiencedTitleWhere(): Prisma.JobWhereInput {
  return { OR: EXPERIENCED_TITLE_TERMS.map(titleContains) };
}

function entryLevelWhere(): Prisma.JobWhereInput {
  return {
    OR: [
      internWhere(),
      {
        AND: [{ OR: EARLY_CAREER_TITLE_TERMS.map(titleContains) }, { NOT: experiencedTitleWhere() }],
      },
    ],
  };
}

const COUNTRY_LOCATION_ALIASES: Record<string, string[]> = {
  'United States': ['United States', 'USA', 'U.S.A.'],
  'United Kingdom': ['United Kingdom', 'Great Britain'],
  Canada: ['Canada'],
  Australia: ['Australia'],
};

function countryWhere(country: string): Prisma.JobWhereInput {
  const aliases = COUNTRY_LOCATION_ALIASES[country] ?? [country];
  return {
    OR: [
      { country: { equals: country, mode: 'insensitive' as const } },
      {
        AND: [
          { country: null },
          { OR: aliases.map((alias) => ({ locationRaw: { contains: alias, mode: 'insensitive' as const } })) },
        ],
      },
    ],
  };
}

/** Expand short career keywords so "grad" finds "New Grad" / "graduate" titles. */
export function expandSearchTerms(q: string): string[] {
  const base = q.trim();
  if (!base) return [];
  const terms = new Set<string>([base]);
  const lower = base.toLowerCase();
  if (lower === 'grad' || lower === 'grads') {
    terms.add('graduate');
    terms.add('new grad');
    terms.add('new-grad');
  } else if (lower === 'junior' || lower === 'jr' || lower === 'jr.') {
    terms.add('junior');
    terms.add('entry level');
    terms.add('entry-level');
  } else if (lower === 'intern') {
    terms.add('internship');
    terms.add('intern');
  }
  return [...terms];
}

function textSearchWhere(q: string): Prisma.JobWhereInput {
  const terms = expandSearchTerms(q);
  // Skip descriptionPlain — ILIKE on large text is too slow for interactive search.
  return {
    OR: terms.flatMap((term) => [
      { title: { contains: term, mode: 'insensitive' as const } },
      { locationRaw: { contains: term, mode: 'insensitive' as const } },
      { city: { contains: term, mode: 'insensitive' as const } },
      { department: { contains: term, mode: 'insensitive' as const } },
      { company: { name: { contains: term, mode: 'insensitive' as const } } },
    ]),
  };
}

function titleSearchWhere(q: string): Prisma.JobWhereInput {
  const terms = expandSearchTerms(q);
  return {
    OR: terms.map((term) => ({ title: { contains: term, mode: 'insensitive' as const } })),
  };
}

function companySearchWhere(q: string): Prisma.JobWhereInput {
  const terms = expandSearchTerms(q);
  return {
    OR: terms.map((term) => ({ company: { name: { contains: term, mode: 'insensitive' as const } } })),
  };
}

export function jobWhere(filters: JobFilters, activeOnly = true): Prisma.JobWhereInput {
  const and: Prisma.JobWhereInput[] = [];
  if (activeOnly) and.push(publicJobWhere);
  if (filters.q) and.push(textSearchWhere(filters.q));
  if (filters.domains?.length) {
    and.push({
      robotDomains: { some: { domain: { slug: { in: filters.domains } } } },
    });
  }
  if (filters.tags?.length) {
    and.push({
      techTags: { some: { techTag: { slug: { in: filters.tags } } } },
    });
  }
  const otherSeniorities = (filters.seniorities ?? []).filter((slug) => slug !== 'junior' && slug !== 'entry');
  const seniorityMatch: Prisma.JobWhereInput[] = [];
  if (filters.entryLevel) seniorityMatch.push(entryLevelWhere());
  if (otherSeniorities.length) {
    seniorityMatch.push({ seniorities: { some: { seniority: { slug: { in: otherSeniorities } } } } });
  }
  if (seniorityMatch.length === 1) and.push(seniorityMatch[0]);
  else if (seniorityMatch.length > 1) and.push({ OR: seniorityMatch });
  if (filters.countries?.length) {
    and.push({ OR: filters.countries.map(countryWhere) });
  }
  if (filters.region) and.push({ region: { equals: filters.region, mode: 'insensitive' } });
  if (filters.city) and.push({ city: { contains: filters.city, mode: 'insensitive' } });
  const workplaces = (filters.workplaces ?? []).filter((value): value is WorkplaceType =>
    WORKPLACES.includes(value as WorkplaceType),
  );
  if (workplaces.length) {
    const wantsRemote = workplaces.includes('REMOTE');
    const otherWorkplaces = workplaces.filter((value) => value !== 'REMOTE');
    const workplaceMatch: Prisma.JobWhereInput[] = [];
    if (otherWorkplaces.length) workplaceMatch.push({ workplaceType: { in: otherWorkplaces } });
    if (wantsRemote) workplaceMatch.push({ workplaceType: 'REMOTE' }, { isRemote: true });
    and.push(workplaceMatch.length === 1 ? workplaceMatch[0] : { OR: workplaceMatch });
  }
  const employments = (filters.employments ?? []).filter((value): value is EmploymentType =>
    EMPLOYMENTS.includes(value as EmploymentType),
  );
  if (employments.length) {
    const wantsIntern = employments.includes('INTERN');
    const otherEmployments = employments.filter((value) => value !== 'INTERN');
    const employmentMatch: Prisma.JobWhereInput[] = [];
    if (wantsIntern) employmentMatch.push(internWhere());
    if (otherEmployments.length) employmentMatch.push({ employmentType: { in: otherEmployments } });
    and.push(employmentMatch.length === 1 ? employmentMatch[0] : { OR: employmentMatch });
  }
  if (filters.remote) and.push({ isRemote: true });
  return and.length ? { AND: and } : {};
}

export async function searchJobs(filters: JobFilters) {
  const snapshot = loadPublicSnapshot();
  if (snapshot) {
    const result = searchJobsFromSnapshot(snapshot.jobs, filters, PAGE_SIZE);
    return {
      ...result,
      jobs: result.jobs.map((job) => reviveJobDates(job)) as JobCardData[],
    };
  }

  const requestedPage = Math.max(1, filters.page ?? 1);
  const cacheKey = JSON.stringify({
    q: filters.q ?? '',
    page: requestedPage,
    sort: filters.sort ?? 'newest',
    domains: filters.domains ?? [],
    tags: filters.tags ?? [],
    seniorities: filters.seniorities ?? [],
    countries: filters.countries ?? [],
    workplaces: filters.workplaces ?? [],
    employments: filters.employments ?? [],
    entryLevel: Boolean(filters.entryLevel),
    region: filters.region ?? '',
    city: filters.city ?? '',
    remote: Boolean(filters.remote),
  });

  return withDb(
    unstable_cache(
      async () => {
        const where = jobWhere(filters);
        const newestOrder = [{ postedAt: 'desc' as const }, { createdAt: 'desc' as const }];
        const skip = (requestedPage - 1) * PAGE_SIZE;
        const relevance = Boolean(filters.q && filters.sort !== 'newest');
        const [total, jobs] = await Promise.all([
          prisma.job.count({ where }),
          relevance
            ? findByPriority(
                where,
                [
                  titleSearchWhere(filters.q!),
                  {
                    AND: [{ NOT: titleSearchWhere(filters.q!) }, companySearchWhere(filters.q!)],
                  },
                  {
                    AND: [{ NOT: titleSearchWhere(filters.q!) }, { NOT: companySearchWhere(filters.q!) }],
                  },
                ],
                skip,
                PAGE_SIZE,
                newestOrder,
              )
            : prisma.job.findMany({
                where,
                select: jobCardSelect,
                orderBy: newestOrder,
                skip,
                take: PAGE_SIZE,
              }),
        ]);
        const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        const page = Math.min(requestedPage, pages);
        return { jobs, total, page, pageSize: PAGE_SIZE };
      },
      ['search-jobs', cacheKey],
      { revalidate: PUBLIC_REVALIDATE_SECONDS },
    ),
    { jobs: [] as JobCardData[], total: 0, page: requestedPage, pageSize: PAGE_SIZE },
  );
}

async function findByPriority(
  where: Prisma.JobWhereInput,
  buckets: Prisma.JobWhereInput[],
  skip: number,
  take: number,
  orderBy: Prisma.JobOrderByWithRelationInput[],
): Promise<JobCardData[]> {
  // Sequential buckets with early exit — avoids 3× page-size egress when titles fill the page.
  const jobs: JobCardData[] = [];
  let remainingSkip = skip;
  let remainingTake = take;
  for (const bucket of buckets) {
    if (remainingTake <= 0) break;
    const page = await prisma.job.findMany({
      where: { AND: [where, bucket] },
      select: jobCardSelect,
      orderBy,
      take: remainingSkip + remainingTake,
    });
    if (page.length <= remainingSkip) {
      remainingSkip -= page.length;
      continue;
    }
    const slice = page.slice(remainingSkip, remainingSkip + remainingTake);
    jobs.push(...slice);
    remainingTake -= slice.length;
    remainingSkip = 0;
  }
  return jobs;
}

const loadJobByIdCached = unstable_cache(
  async (id: string) =>
    prisma.job.findUnique({
      where: { id },
      select: jobDetailSelect,
    }),
  ['job-by-id'],
  { revalidate: PUBLIC_REVALIDATE_SECONDS },
);

function reviveJobDates<T extends {
  postedAt?: Date | string | null;
  expiresAt?: Date | string | null;
  createdAt?: Date | string;
} | null>(job: T): T {
  if (!job) return job;
  const postedAt = job.postedAt == null ? job.postedAt : new Date(job.postedAt);
  const expiresAt = job.expiresAt == null ? job.expiresAt : new Date(job.expiresAt);
  const createdAt = job.createdAt == null ? job.createdAt : new Date(job.createdAt);
  return { ...job, postedAt, expiresAt, createdAt };
}

export type GoneJob = {
  id: string;
  slug: string;
  title: string;
  company: { name: string; slug: string };
};

/** Dedupes metadata + page in one request; caches across crawlers. */
export const getJobById = cache(async (id: string) => {
  const snapshot = loadPublicSnapshot();
  if (snapshot) {
    const job = snapshot.jobs.find((item) => item.id === id) ?? null;
    return reviveJobDates(job) as JobWithRelations | null;
  }
  const job = await withDb(() => loadJobByIdCached(id), null);
  if (!job || !job.isActive || job.isHidden) return null;
  return reviveJobDates(job) as JobWithRelations | null;
});

/** Closed or hidden jobs — redirect to the employer page instead of 404. */
export const getGoneJobById = cache(async (id: string): Promise<GoneJob | null> => {
  const snapshot = loadPublicSnapshot();
  if (snapshot?.goneJobs?.length) {
    const gone = snapshot.goneJobs.find((item) => item.id === id);
    if (gone) return gone;
  }

  const job = await withDb(() => loadJobByIdCached(id), null);
  if (!job || (job.isActive && !job.isHidden)) return null;
  return {
    id: job.id,
    slug: job.slug,
    title: job.title,
    company: { name: job.company.name, slug: job.company.slug },
  };
});

const loadRelatedJobsCached = unstable_cache(
  async (jobId: string, companyId: string, city: string | null, domainIdsKey: string, take: number) => {
    const domainIds = domainIdsKey ? domainIdsKey.split(',') : [];
    return prisma.job.findMany({
      where: {
        isActive: true,
        isHidden: false,
        id: { not: jobId },
        OR: [
          { companyId },
          city ? { city } : undefined,
          domainIds.length ? { robotDomains: { some: { domainId: { in: domainIds } } } } : undefined,
        ].filter(Boolean) as Prisma.JobWhereInput[],
      },
      select: jobCardSelect,
      orderBy: { postedAt: 'desc' },
      take,
    });
  },
  ['related-jobs'],
  { revalidate: PUBLIC_REVALIDATE_SECONDS },
);

export async function relatedJobs(
  job: Pick<JobWithRelations, 'id' | 'companyId' | 'city'> & {
    robotDomains: Array<{ domainId: string }>;
  },
  take = 6,
) {
  const snapshot = loadPublicSnapshot();
  if (snapshot) {
    return relatedJobsFromSnapshot(snapshot.jobs, job, take).map(
      (item) => reviveJobDates(item),
    ) as JobCardData[];
  }

  const domainIdsKey = job.robotDomains
    .map((d) => d.domainId)
    .sort()
    .join(',');
  const jobs = await withDb(
    () => loadRelatedJobsCached(job.id, job.companyId, job.city, domainIdsKey, take),
    [] as JobCardData[],
  );
  return jobs.map((item) => reviveJobDates(item)) as JobCardData[];
}

export async function getTaxonomy() {
  const snapshot = loadPublicSnapshot();
  if (snapshot) {
    return {
      domains: snapshot.domains.map(({ id, slug, name }) => ({ id, slug, name })),
      tags: snapshot.tags.map(({ id, slug, label }) => ({ id, slug, label })),
      seniorities: snapshot.seniorities,
    };
  }

  return withDb(
    unstable_cache(
      async () => {
        const [domains, tags, seniorities] = await Promise.all([
          prisma.robotDomain.findMany({
            orderBy: { name: 'asc' },
            select: { id: true, slug: true, name: true },
          }),
          prisma.techTag.findMany({
            orderBy: { label: 'asc' },
            select: { id: true, slug: true, label: true },
          }),
          prisma.seniorityLevel.findMany({
            orderBy: { label: 'asc' },
            select: { id: true, slug: true, label: true },
          }),
        ]);
        return { domains, tags, seniorities };
      },
      ['job-board-taxonomy'],
      { revalidate: PUBLIC_REVALIDATE_SECONDS },
    ),
    { domains: [], tags: [], seniorities: [] },
  );
}

export async function getTagFacets() {
  const snapshot = loadPublicSnapshot();
  if (snapshot) {
    return snapshot.tags
      .filter((tag) => tag.openJobCount > 0)
      .map(({ slug, label, openJobCount }) => ({ slug, label, count: openJobCount }));
  }

  return withDb(
    unstable_cache(
      async () => {
        const [tags, counts] = await Promise.all([
          prisma.techTag.findMany({
            orderBy: { label: 'asc' },
            select: { id: true, slug: true, label: true },
          }),
          prisma.jobTechTag.groupBy({
            by: ['techTagId'],
            where: { job: publicJobWhere },
            _count: { _all: true },
          }),
        ]);
        const countById = new Map(counts.map((row) => [row.techTagId, row._count._all]));
        return tags
          .map((tag) => ({ slug: tag.slug, label: tag.label, count: countById.get(tag.id) ?? 0 }))
          .filter((tag) => tag.count > 0);
      },
      ['job-board-tag-facets'],
      { revalidate: PUBLIC_REVALIDATE_SECONDS },
    ),
    [] as Array<{ slug: string; label: string; count: number }>,
  );
}

export async function getCountryFacets() {
  const snapshot = loadPublicSnapshot();
  if (snapshot) return snapshot.countryFacets;

  return withDb(
    unstable_cache(
      async () => {
        const rows = await prisma.job.groupBy({
          by: ['country'],
          where: { ...publicJobWhere, country: { not: null } },
          _count: { _all: true },
        });
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
        return rows
          .filter((row) => row.country)
          .map((row) => ({ country: row.country as string, count: row._count._all }))
          .sort((a, b) => {
            const ai = preferred.indexOf(a.country);
            const bi = preferred.indexOf(b.country);
            if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
            return b.count - a.count;
          });
      },
      ['job-board-country-facets'],
      { revalidate: PUBLIC_REVALIDATE_SECONDS },
    ),
    [] as Array<{ country: string; count: number }>,
  );
}

export async function countActiveJobs(where: Prisma.JobWhereInput) {
  return withDb(() => prisma.job.count({ where: { ...publicJobWhere, ...where } }), 0);
}

export const companyPublicSelect = {
  id: true,
  name: true,
  slug: true,
  website: true,
  logoUrl: true,
  description: true,
  seoIntro: true,
} satisfies Prisma.CompanySelect;

export type CompanyPublic = Prisma.CompanyGetPayload<{ select: typeof companyPublicSelect }>;

const loadCompanyBySlugCached = unstable_cache(
  async (slug: string) =>
    prisma.company.findUnique({
      where: { slug },
      select: companyPublicSelect,
    }),
  ['company-by-slug'],
  { revalidate: PUBLIC_REVALIDATE_SECONDS },
);

export const getCompanyBySlug = cache(async (slug: string) => {
  const snapshot = loadPublicSnapshot();
  if (snapshot) {
    const company = snapshot.companies.find((item) => item.slug === slug);
    if (!company) return null;
    const { openJobCount: _openJobCount, ...rest } = company;
    return rest;
  }
  return withDb(() => loadCompanyBySlugCached(slug), null);
});

const loadCompanyJobsPageCached = unstable_cache(
  async (companyId: string, page: number) => {
    const where = { ...publicJobWhere, companyId };
    const [total, jobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        select: jobCardSelect,
        orderBy: [{ postedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ]);
    return { total, jobs };
  },
  ['company-jobs-page'],
  { revalidate: PUBLIC_REVALIDATE_SECONDS },
);

export async function getCompanyJobsPage(companyId: string, requestedPage: number) {
  const page = Math.max(1, requestedPage);
  const snapshot = loadPublicSnapshot();
  if (snapshot) {
    const jobs = snapshot.jobs
      .filter((job) => job.companyId === companyId)
      .sort((a, b) => {
        const aTime = Date.parse(a.postedAt ?? a.createdAt);
        const bTime = Date.parse(b.postedAt ?? b.createdAt);
        return bTime - aTime;
      });
    const total = jobs.length;
    const skip = (page - 1) * PAGE_SIZE;
    return {
      total,
      jobs: jobs.slice(skip, skip + PAGE_SIZE).map((job) => reviveJobDates(job)) as JobCardData[],
    };
  }

  return withDb(
    () => loadCompanyJobsPageCached(companyId, page),
    { total: 0, jobs: [] as JobCardData[] },
  );
}
