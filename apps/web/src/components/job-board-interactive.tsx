'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { JobBoardShell } from '@/components/job-board-shell';
import { JobCard } from '@/components/job-card';
import { JobPagination } from '@/components/job-pagination';
import {
  filtersFromSearchParams,
  jobBoardHref,
  type JobFilters as JobFilterValues,
} from '@/lib/job-filter-utils';
import type { JobCardData } from '@/lib/jobs';
import { PAGE_SIZE } from '@/lib/site';

type FilterOptions = {
  domains: Array<{ slug: string; label: string }>;
  tags: Array<{ slug: string; label: string; count: number }>;
  seniorities: Array<{ slug: string; label: string }>;
  countries: Array<{ country: string; count: number }>;
};

type BoardResult = {
  jobs: JobCardData[];
  total: number;
  page: number;
};

function paramsFromSearchParams(searchParams: URLSearchParams): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {};
  for (const key of new Set(searchParams.keys())) {
    const values = searchParams.getAll(key);
    params[key] = values.length > 1 ? values : values[0]!;
  }
  return params;
}

function EmptyJobs({ filters }: { filters: JobFilterValues }) {
  const hasFilters = Boolean(
    filters.q ||
      filters.countries?.length ||
      filters.domains?.length ||
      filters.tags?.length ||
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

export function JobBoardInteractive({
  initialQuery,
  initialFilters,
  initialResult,
  filterOptions,
}: {
  initialQuery: string;
  initialFilters: JobFilterValues;
  initialResult: BoardResult;
  filterOptions: FilterOptions;
}) {
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const filters = useMemo(
    () => filtersFromSearchParams(paramsFromSearchParams(searchParams)),
    [searchParams],
  );
  const [result, setResult] = useState<BoardResult>(initialResult);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (query === initialQuery) {
      startTransition(() => setResult(initialResult));
      return;
    }

    // Soft-nav on `/` does not remount the static RSC tree — fetch filtered results client-side.
    const controller = new AbortController();
    startTransition(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/jobs${query ? `?${query}` : ''}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          });
          if (!res.ok) return;
          const data = (await res.json()) as BoardResult;
          setResult({
            jobs: data.jobs ?? [],
            total: data.total ?? 0,
            page: data.page ?? 1,
          });
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') return;
        }
      })();
    });

    return () => controller.abort();
  }, [query, initialQuery, initialResult]);

  const pages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  return (
    <JobBoardShell
      filters={filters}
      total={result.total}
      filterProps={{ filters, ...filterOptions }}
    >
      <div
        aria-busy={pending}
        className={pending ? 'opacity-60 transition-opacity' : 'transition-opacity'}
      >
        {result.jobs.length ? (
          result.jobs.map((job) => <JobCard key={job.id} job={job} />)
        ) : (
          <EmptyJobs filters={filters} />
        )}
        <JobPagination page={result.page} pages={pages} hrefFor={(target) => jobBoardHref(filters, target)} />
      </div>
    </JobBoardShell>
  );
}
