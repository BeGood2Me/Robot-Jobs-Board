import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiError, apiGet, getSiteUrl } from './api.js';
import { errorResult, jsonResult, summarizeJob } from './format.js';
import { loadBoardSnapshot, loadJobWithDescription } from './snapshot.js';

const listSchema = z.union([z.string(), z.array(z.string())]).optional();

function asList(value: string | string[] | undefined): string[] | undefined {
  if (value == null) return undefined;
  const items = (Array.isArray(value) ? value : value.split(',')).map((item) => item.trim()).filter(Boolean);
  return items.length ? items : undefined;
}

function boolQuery(value: boolean | undefined): string | undefined {
  return value ? '1' : undefined;
}

type SearchResponse = {
  jobs: Array<Parameters<typeof summarizeJob>[0] & { slug: string; url: string }>;
  total: number;
  page: number;
  pageSize: number;
};

type JobDetailResponse = {
  status: 'active';
  job: Parameters<typeof summarizeJob>[0] & { slug: string; url: string; descriptionPlain?: string };
  pageUrl: string;
  related: Array<{
    id: string;
    title: string;
    company: string;
    location: string | null;
    isRemote: boolean;
    postedAt: string | null;
    pageUrl: string;
    applyUrl: string;
  }>;
};

type CompaniesResponse = {
  generatedAt: string;
  companies: Array<{
    id: string;
    name: string;
    slug: string;
    website: string | null;
    openJobCount: number;
    pageUrl: string;
  }>;
};

type CompanyResponse = {
  company: {
    id: string;
    name: string;
    slug: string;
    website: string | null;
    description: string;
    seoIntro: string | null;
    pageUrl: string;
  };
  total: number;
  page: number;
  pageSize: number;
  jobs: Array<{
    id: string;
    title: string;
    location: string | null;
    country: string | null;
    isRemote: boolean;
    workplaceType: string;
    employmentType: string;
    postedAt: string | null;
    pageUrl: string;
    applyUrl: string;
  }>;
};

type FacetsResponse = {
  generatedAt: string | null;
  jobCount: number | null;
  companyCount: number | null;
  domains: Array<{ slug: string; name: string; count: number | null; description: string | null }>;
  tags: Array<{ slug: string; label: string; count: number }>;
  seniorities: Array<{ slug: string; label: string }>;
  countries: Array<{ country: string; count: number }>;
  workplaces: string[];
  employments: string[];
};

export function createServer() {
  const server = new McpServer({
    name: 'robot-jobs-board',
    version: '0.1.0',
  });

  server.registerTool(
    'search_jobs',
    {
      title: 'Search robotics jobs',
      description:
        'Search Robot Jobs Board for open robotics jobs. Prefer list_facets first when you need valid domain, tag, seniority, or country values.',
      inputSchema: {
        q: z.string().optional().describe('Free-text query (title, company, skills)'),
        domain: listSchema.describe('Robot domain slugs, e.g. perception, manipulation'),
        tag: listSchema.describe('Tech tag slugs'),
        seniority: listSchema.describe('Seniority slugs, e.g. mid, senior, staff'),
        country: listSchema.describe('Country names, e.g. United States, United Kingdom'),
        city: z.string().optional(),
        region: z.string().optional(),
        workplace: listSchema.describe('ONSITE, HYBRID, and/or REMOTE'),
        employment: listSchema.describe('FULL_TIME, PART_TIME, CONTRACT, INTERN, TEMPORARY'),
        remote: z.boolean().optional().describe('Only remote jobs when true'),
        entry_level: z.boolean().optional().describe('Prefer early-career / new-grad style jobs'),
        sort: z.enum(['newest', 'relevance']).optional(),
        page: z.number().int().min(1).optional(),
      },
    },
    async (args) => {
      try {
        const site = getSiteUrl();
        const data = await apiGet<SearchResponse>('/api/jobs', {
          q: args.q,
          domain: asList(args.domain),
          tag: asList(args.tag),
          seniority: asList(args.seniority),
          country: asList(args.country),
          city: args.city,
          region: args.region,
          workplace: asList(args.workplace),
          employment: asList(args.employment),
          remote: boolQuery(args.remote),
          entry: boolQuery(args.entry_level),
          sort: args.sort,
          page: args.page ? String(args.page) : undefined,
        });

        return jsonResult({
          site,
          total: data.total,
          page: data.page,
          pageSize: data.pageSize,
          jobs: data.jobs.map((job) =>
            summarizeJob(job, {
              pageUrl: `${site}/jobs/${job.id}/${job.slug}`,
              includeDescription: false,
            }),
          ),
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'get_job',
    {
      title: 'Get job details',
      description: 'Fetch one robotics job by id, including description excerpt, apply URL, and related jobs.',
      inputSchema: {
        id: z.string().min(1).describe('Job id from search_jobs'),
      },
    },
    async ({ id }) => {
      try {
        try {
          const data = await apiGet<JobDetailResponse>(`/api/jobs/${encodeURIComponent(id)}`);
          return jsonResult({
            job: summarizeJob(data.job, {
              pageUrl: data.pageUrl,
              includeDescription: true,
              maxDescription: 4000,
            }),
            related: data.related,
          });
        } catch (error) {
          if (error instanceof ApiError && error.status === 410) {
            return jsonResult(error.body ?? { status: 'gone', id });
          }
          if (!(error instanceof ApiError) || (error.status !== 404 && error.status !== 405)) {
            throw error;
          }
        }

        const site = getSiteUrl();
        const job = await loadJobWithDescription(id);
        if (!job) return errorResult(new Error(`Job not found: ${id}`));
        const board = await loadBoardSnapshot();
        const related = board.jobs
          .filter((item) => item.id !== job.id && item.companyId === job.companyId)
          .slice(0, 6)
          .map((item) => ({
            id: item.id,
            title: item.title,
            company: item.company.name,
            location: item.locationRaw,
            isRemote: item.isRemote,
            postedAt: item.postedAt,
            pageUrl: `${site}/jobs/${item.id}/${item.slug}`,
            applyUrl: item.url,
          }));
        return jsonResult({
          job: summarizeJob(job, {
            pageUrl: `${site}/jobs/${job.id}/${job.slug}`,
            includeDescription: true,
            maxDescription: 4000,
          }),
          related,
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'list_companies',
    {
      title: 'List robotics companies',
      description: 'List companies on Robot Jobs Board ordered by open job count.',
      inputSchema: {
        q: z.string().optional().describe('Optional company name filter'),
        limit: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ q, limit }) => {
      try {
        let generatedAt: string;
        let companies: CompaniesResponse['companies'];
        try {
          const data = await apiGet<CompaniesResponse>('/api/companies');
          generatedAt = data.generatedAt;
          companies = data.companies;
        } catch (error) {
          if (!(error instanceof ApiError) || (error.status !== 404 && error.status !== 405)) {
            throw error;
          }
          const site = getSiteUrl();
          const board = await loadBoardSnapshot();
          generatedAt = board.generatedAt;
          companies = [...board.companies]
            .sort((a, b) => b.openJobCount - a.openJobCount || a.name.localeCompare(b.name))
            .map((company) => ({
              id: company.id,
              name: company.name,
              slug: company.slug,
              website: company.website,
              openJobCount: company.openJobCount,
              pageUrl: `${site}/companies/${company.slug}`,
            }));
        }

        const needle = q?.trim().toLowerCase();
        if (needle) {
          companies = companies.filter(
            (company) =>
              company.name.toLowerCase().includes(needle) || company.slug.toLowerCase().includes(needle),
          );
        }
        const take = limit ?? 25;
        return jsonResult({
          generatedAt,
          total: companies.length,
          companies: companies.slice(0, take),
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'get_company',
    {
      title: 'Get company and open jobs',
      description: 'Fetch a company profile and its current open jobs by slug.',
      inputSchema: {
        slug: z.string().min(1).describe('Company slug, e.g. figure, zoox'),
        page: z.number().int().min(1).optional(),
      },
    },
    async ({ slug, page }) => {
      try {
        try {
          const data = await apiGet<CompanyResponse>(`/api/companies/${encodeURIComponent(slug)}`, {
            page: page ? String(page) : undefined,
          });
          return jsonResult(data);
        } catch (error) {
          if (!(error instanceof ApiError) || ![404, 405].includes(error.status)) {
            throw error;
          }
        }

        const site = getSiteUrl();
        const board = await loadBoardSnapshot();
        const company = board.companies.find((item) => item.slug === slug);
        if (!company) return errorResult(new Error(`Company not found: ${slug}`));
        const pageSize = 10;
        const requestedPage = Math.max(1, page ?? 1);
        const allJobs = board.jobs
          .filter((job) => job.companyId === company.id)
          .sort((a, b) => Date.parse(b.postedAt ?? '') - Date.parse(a.postedAt ?? ''));
        const total = allJobs.length;
        const pages = Math.max(1, Math.ceil(total / pageSize));
        const currentPage = Math.min(requestedPage, pages);
        const jobs = allJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((job) => ({
          id: job.id,
          title: job.title,
          location: job.locationRaw,
          country: job.country,
          isRemote: job.isRemote,
          workplaceType: job.workplaceType,
          employmentType: job.employmentType,
          postedAt: job.postedAt,
          pageUrl: `${site}/jobs/${job.id}/${job.slug}`,
          applyUrl: job.url,
        }));
        return jsonResult({
          company: {
            id: company.id,
            name: company.name,
            slug: company.slug,
            website: company.website,
            description: company.description,
            seoIntro: company.seoIntro,
            pageUrl: `${site}/companies/${company.slug}`,
          },
          total,
          page: currentPage,
          pageSize,
          jobs,
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'list_facets',
    {
      title: 'List search facets',
      description:
        'Return valid filter values for Robot Jobs Board: domains, tags, seniorities, countries, workplaces, and employments.',
      inputSchema: {},
    },
    async () => {
      try {
        try {
          const data = await apiGet<FacetsResponse>('/api/facets');
          return jsonResult(data);
        } catch (error) {
          if (!(error instanceof ApiError) || ![404, 405].includes(error.status)) {
            throw error;
          }
        }

        const board = await loadBoardSnapshot();
        return jsonResult({
          generatedAt: board.generatedAt,
          jobCount: board.jobs.length,
          companyCount: board.companies.length,
          domains: board.domains
            .filter((domain) => domain.openJobCount > 0)
            .map(({ slug, name, openJobCount, description }) => ({
              slug,
              name,
              count: openJobCount,
              description,
            })),
          tags: board.tags
            .filter((tag) => tag.openJobCount > 0)
            .map(({ slug, label, openJobCount }) => ({ slug, label, count: openJobCount })),
          seniorities: board.seniorities.map(({ slug, label }) => ({ slug, label })),
          countries: board.countryFacets,
          workplaces: ['ONSITE', 'HYBRID', 'REMOTE'],
          employments: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'TEMPORARY'],
        } satisfies FacetsResponse);
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerResource(
    'board-manifest',
    `${getSiteUrl()}/snapshot/manifest.json`,
    {
      title: 'Board snapshot manifest',
      description: 'Freshness metadata for the public jobs snapshot (generatedAt, jobCount).',
      mimeType: 'application/json',
    },
    async (uri) => {
      const data = await apiGet<unknown>('/snapshot/manifest.json');
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    },
  );

  return server;
}
