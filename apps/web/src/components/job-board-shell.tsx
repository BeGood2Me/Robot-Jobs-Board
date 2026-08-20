'use client';

import { FunnelSimple, X } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { JobFilters, JobSort } from '@/components/job-filters';
import type { JobFilters as JobFilterValues } from '@/lib/job-filter-utils';
import { countActiveFilters } from '@/lib/job-filter-utils';

type FilterProps = {
  filters: JobFilterValues;
  domains: Array<{ slug: string; label: string }>;
  tags: Array<{ slug: string; label: string; count: number }>;
  seniorities: Array<{ slug: string; label: string }>;
  countries: Array<{ country: string; count: number }>;
};

export function JobBoardShell({
  filters,
  filterProps,
  total,
  children,
}: {
  filters: JobFilterValues;
  filterProps: FilterProps;
  total: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const activeCount = countActiveFilters(filters);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <div className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* Listings first in the DOM so phones never scroll past a filter panel */}
      <div className="min-w-0 space-y-4 lg:col-start-2 lg:row-start-1">
        <div className="sticky top-16 z-30 -mx-6 border-b border-line bg-background/95 px-6 py-3 backdrop-blur-xl lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
          <div className="flex flex-wrap items-center justify-between gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-card px-3 text-sm font-semibold"
            >
              <FunnelSimple size={18} aria-hidden />
              Filters
              {activeCount ? (
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-fg">
                  {activeCount}
                </span>
              ) : null}
            </button>
            <div className="flex items-center gap-3">
              <p className="font-mono text-sm text-muted">
                {total} job{total === 1 ? '' : 's'}
              </p>
              <JobSort filters={filters} />
            </div>
          </div>

          <div className="hidden flex-wrap items-center justify-between gap-3 lg:flex">
            <p className="font-mono text-sm text-muted">
              {total} job{total === 1 ? '' : 's'}
            </p>
            <JobSort filters={filters} />
          </div>
        </div>

        {children}
      </div>

      {/* Desktop sidebar only — never shown in the mobile document flow */}
      <aside className="max-lg:hidden lg:col-start-1 lg:row-start-1 lg:sticky lg:top-20 lg:self-start">
        <JobFilters {...filterProps} />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-black/70"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-filters-title"
            className="absolute inset-x-0 bottom-0 flex max-h-[min(88vh,720px)] flex-col rounded-t-2xl border-t border-line bg-background shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-line px-6 py-4">
              <h2 id="mobile-filters-title" className="text-base font-semibold">
                Filters
              </h2>
              <button
                type="button"
                aria-label="Close filters"
                className="flex size-9 items-center justify-center rounded-full border border-line"
                onClick={() => setOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 overflow-y-auto overscroll-contain px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <JobFilters {...filterProps} applyMode="manual" onApplied={() => setOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
