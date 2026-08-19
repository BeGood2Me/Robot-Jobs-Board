import Link from 'next/link';
import { JobCard } from '@/components/job-card';
import { JobFilters, JobSort } from '@/components/job-filters';
import { JobPagination } from '@/components/job-pagination';
import {
  filtersFromSearchParams,
  getCountryFacets,
  getTaxonomy,
  jobBoardHref,
  searchJobs,
  type JobFilters as JobFilterValues,
} from '@/lib/jobs';
import { homePageJsonLd } from '@/lib/jsonld';
import { PAGE_SIZE } from '@/lib/site';

export async function JobBoard({
  params,
}: {
  params: Record<string, string | string[] | undefined>;
}) {
  const filters = filtersFromSearchParams(params);
  const [{ jobs, total, page }, taxonomy, countries] = await Promise.all([
    searchJobs(filters),
    getTaxonomy(),
    getCountryFacets(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl px-6 pt-16 pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homePageJsonLd()) }} />
      <div>
        <h1 className="max-w-[680px] bg-gradient-to-r from-black to-[#666666] bg-clip-text text-4xl font-semibold text-balance text-transparent md:text-5xl dark:from-white dark:to-[#9B9B9B]">
          Robotics jobs
        </h1>
        <p className="mt-3 max-w-[680px] text-pretty text-muted">
          Open robotics engineering, hardware, and operations jobs at{' '}
          <Link href="/companies" className="underline">
            companies hiring
          </Link>{' '}
          in the United States, United Kingdom, Canada, Australia, and Europe. Filter by location, robot type, remote,
          and entry level, or read the{' '}
          <Link href="/guides" className="underline">
            robotics career guides
          </Link>
          .
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <JobFilters
            filters={filters}
            domains={taxonomy.domains.map((d) => ({ slug: d.slug, label: d.name }))}
            seniorities={taxonomy.seniorities.map((s) => ({ slug: s.slug, label: s.label }))}
            countries={countries}
          />
        </aside>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-sm text-muted">
              {total} job{total === 1 ? '' : 's'}
            </p>
            <JobSort filters={filters} />
          </div>
          {jobs.length ? jobs.map((job) => <JobCard key={job.id} job={job} />) : <EmptyJobs filters={filters} />}
          <JobPagination page={page} pages={pages} hrefFor={(target) => jobBoardHref(filters, target)} />
        </div>
      </div>
    </div>
  );
}

function EmptyJobs({ filters }: { filters: JobFilterValues }) {
  const hasFilters = Boolean(
    filters.q ||
      filters.countries?.length ||
      filters.domains?.length ||
      filters.seniorities?.length ||
      filters.workplaces?.length ||
      filters.employments?.length ||
      filters.entryLevel,
  );
  return (
    <div className="rounded-2xl border border-line bg-card p-8">
      <p className="font-semibold">{hasFilters ? 'No jobs match those filters.' : 'No jobs in the database yet.'}</p>
      <p className="mt-3 text-sm text-muted">
        {hasFilters ? (
          <Link href="/" className="underline">
            Clear filters
          </Link>
        ) : (
          'Check back after the next board sync, or read the guides while you wait.'
        )}
      </p>
    </div>
  );
}
