import type { EmploymentType, Prisma, WorkplaceType } from '@robot-jobs-board/db';
import { prisma, withDb } from './db';
import { PAGE_SIZE } from './site';

export const jobCardInclude = {
  company: true,
  robotDomains: { include: { domain: true } },
  techTags: { include: { techTag: true } },
  seniorities: { include: { seniority: true } },
} satisfies Prisma.JobInclude;

export type JobWithRelations = Prisma.JobGetPayload<{ include: typeof jobCardInclude }>;

export type JobFilters = {
  q?: string;
  domains?: string[];
  tags?: string[];
  seniorities?: string[];
  countries?: string[];
  region?: string;
  city?: string;
  workplaces?: string[];
  employments?: string[];
  entryLevel?: boolean;
  remote?: boolean;
  sort?: 'newest' | 'relevance';
  page?: number;
};

function list(value?: string | string[]): string[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : value.split(',')).map((v) => v.trim()).filter(Boolean);
}

function first(value?: string | string[]): string | undefined {
  return list(value)[0];
}

export function filtersFromSearchParams(params: Record<string, string | string[] | undefined>): JobFilters {
  const seniorities = list(params.seniority ?? params.seniorities).filter(
    (slug) => slug !== 'junior' && slug !== 'entry',
  );
  return {
    q: first(params.q),
    domains: list(params.domain ?? params.domains),
    tags: list(params.tag ?? params.tags),
    seniorities,
    countries: list(params.country ?? params.countries),
    region: first(params.region),
    city: first(params.city),
    workplaces: list(params.workplace),
    employments: list(params.employment),
    entryLevel:
      list(params.entry).includes('1') ||
      list(params.entry).includes('true') ||
      list(params.seniority ?? params.seniorities).includes('junior') ||
      list(params.seniority ?? params.seniorities).includes('entry'),
    remote: first(params.remote) === '1' || first(params.remote) === 'true',
    sort: first(params.sort) === 'relevance' ? 'relevance' : 'newest',
    page: Number(first(params.page) ?? 1) || 1,
  };
}

export function countActiveFilters(filters: JobFilters): number {
  return (
    (filters.q ? 1 : 0) +
    (filters.countries?.length ?? 0) +
    (filters.domains?.length ?? 0) +
    (filters.tags?.length ?? 0) +
    (filters.seniorities?.length ?? 0) +
    (filters.workplaces?.length ?? 0) +
    (filters.employments?.length ?? 0) +
    (filters.entryLevel ? 1 : 0) +
    (filters.remote ? 1 : 0) +
    (filters.sort === 'relevance' ? 1 : 0)
  );
}

export function jobBoardHref(filters: JobFilters, page = filters.page ?? 1): string {
  const query = new URLSearchParams();
  if (filters.q) query.set('q', filters.q);
  for (const domain of filters.domains ?? []) query.append('domain', domain);
  for (const tag of filters.tags ?? []) query.append('tag', tag);
  for (const seniority of filters.seniorities ?? []) query.append('seniority', seniority);
  if (filters.entryLevel) query.set('entry', '1');
  for (const country of filters.countries ?? []) query.append('country', country);
  if (filters.region) query.set('region', filters.region);
  if (filters.city) query.set('city', filters.city);
  for (const workplace of filters.workplaces ?? []) query.append('workplace', workplace);
  for (const employment of filters.employments ?? []) query.append('employment', employment);
  if (filters.remote) query.set('remote', '1');
  if (filters.sort && filters.sort !== 'newest') query.set('sort', filters.sort);
  if (page > 1) query.set('page', String(page));
  const encoded = query.toString();
  return encoded ? `/?${encoded}` : '/';
}

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

export function jobWhere(filters: JobFilters, activeOnly = true): Prisma.JobWhereInput {
  const and: Prisma.JobWhereInput[] = [];
  if (activeOnly) and.push(publicJobWhere);
  if (filters.q) {
    and.push({
      OR: [
        { title: { contains: filters.q, mode: 'insensitive' } },
        { descriptionPlain: { contains: filters.q, mode: 'insensitive' } },
        { locationRaw: { contains: filters.q, mode: 'insensitive' } },
        { company: { name: { contains: filters.q, mode: 'insensitive' } } },
      ],
    });
  }
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
  const requestedPage = Math.max(1, filters.page ?? 1);
  const where = jobWhere(filters);
  const newestOrder = [{ postedAt: 'desc' as const }, { createdAt: 'desc' as const }];
  return withDb(
    async () => {
      const total = await prisma.job.count({ where });
      const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      const page = Math.min(requestedPage, pages);
      const skip = (page - 1) * PAGE_SIZE;
      const jobs =
        filters.sort === 'relevance' && filters.q
          ? await findByPriority(
              where,
              [
                { title: { contains: filters.q, mode: 'insensitive' } },
                {
                  AND: [
                    { NOT: { title: { contains: filters.q, mode: 'insensitive' } } },
                    { company: { name: { contains: filters.q, mode: 'insensitive' } } },
                  ],
                },
                {
                  AND: [
                    { NOT: { title: { contains: filters.q, mode: 'insensitive' } } },
                    { NOT: { company: { name: { contains: filters.q, mode: 'insensitive' } } } },
                  ],
                },
              ],
              skip,
              PAGE_SIZE,
              newestOrder,
            )
          : await prisma.job.findMany({
              where,
              include: jobCardInclude,
              orderBy: newestOrder,
              skip,
              take: PAGE_SIZE,
            });
      return { jobs, total, page, pageSize: PAGE_SIZE };
    },
    { jobs: [] as JobWithRelations[], total: 0, page: requestedPage, pageSize: PAGE_SIZE },
  );
}

async function findByPriority(
  where: Prisma.JobWhereInput,
  buckets: Prisma.JobWhereInput[],
  skip: number,
  take: number,
  orderBy: Prisma.JobOrderByWithRelationInput[],
): Promise<JobWithRelations[]> {
  const jobs: JobWithRelations[] = [];
  let remainingSkip = skip;
  let remainingTake = take;
  for (const bucket of buckets) {
    if (remainingTake <= 0) break;
    const bucketWhere: Prisma.JobWhereInput = { AND: [where, bucket] };
    const count = await prisma.job.count({ where: bucketWhere });
    if (remainingSkip >= count) {
      remainingSkip -= count;
      continue;
    }
    const page = await prisma.job.findMany({
      where: bucketWhere,
      include: jobCardInclude,
      orderBy,
      skip: remainingSkip,
      take: remainingTake,
    });
    jobs.push(...page);
    remainingTake -= page.length;
    remainingSkip = 0;
  }
  return jobs;
}

export async function getJobById(id: string) {
  return withDb(
    () =>
      prisma.job.findUnique({
        where: { id },
        include: jobCardInclude,
      }),
    null,
  );
}

export async function relatedJobs(job: JobWithRelations, take = 6) {
  const domainIds = job.robotDomains.map((d) => d.domainId);
  return withDb(
    () =>
      prisma.job.findMany({
        where: {
          isActive: true,
          isHidden: false,
          id: { not: job.id },
          OR: [
            { companyId: job.companyId },
            job.city ? { city: job.city } : undefined,
            domainIds.length ? { robotDomains: { some: { domainId: { in: domainIds } } } } : undefined,
          ].filter(Boolean) as Prisma.JobWhereInput[],
        },
        include: jobCardInclude,
        orderBy: { postedAt: 'desc' },
        take,
      }),
    [] as JobWithRelations[],
  );
}

export async function getTaxonomy() {
  return withDb(
    async () => {
      const [domains, tags, seniorities] = await Promise.all([
        prisma.robotDomain.findMany({ orderBy: { name: 'asc' } }),
        prisma.techTag.findMany({ orderBy: { label: 'asc' } }),
        prisma.seniorityLevel.findMany({ orderBy: { label: 'asc' } }),
      ]);
      return { domains, tags, seniorities };
    },
    { domains: [], tags: [], seniorities: [] },
  );
}

export async function getTagFacets() {
  return withDb(
    async () => {
      const [tags, counts] = await Promise.all([
        prisma.techTag.findMany({ orderBy: { label: 'asc' } }),
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
    [] as Array<{ slug: string; label: string; count: number }>,
  );
}

export async function getCountryFacets() {
  return withDb(
    async () => {
      const rows = await prisma.job.groupBy({
        by: ['country'],
        where: { ...publicJobWhere, country: { not: null } },
        _count: { _all: true },
      });
      const preferred = ['United States', 'United Kingdom', 'Canada', 'Australia', 'Ireland', 'Germany', 'France', 'Switzerland'];
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
    [] as Array<{ country: string; count: number }>,
  );
}

export async function countActiveJobs(where: Prisma.JobWhereInput) {
  return withDb(() => prisma.job.count({ where: { ...publicJobWhere, ...where } }), 0);
}
