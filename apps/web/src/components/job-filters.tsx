'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { JobFilters as JobFilterValues } from '@/lib/jobs';

type Option = { slug: string; label: string; name?: string };

const workplaces = [
  { slug: 'HYBRID', label: 'Hybrid' },
  { slug: 'ONSITE', label: 'On site' },
  { slug: 'REMOTE', label: 'Remote' },
];

const employments = [
  { slug: 'CONTRACT', label: 'Contract' },
  { slug: 'FULL_TIME', label: 'Full time' },
  { slug: 'INTERN', label: 'Intern' },
  { slug: 'PART_TIME', label: 'Part time' },
];

const PINNED_COUNTRIES = ['Australia', 'Canada', 'United Kingdom', 'United States'];
const LOCATION_LEADERS = ['United States', 'United Kingdom'];

const EXPERIENCE_ORDER = [
  { slug: '1', label: 'Entry level', name: 'entry' },
  { slug: 'mid', label: 'Mid level' },
  { slug: 'senior', label: 'Senior' },
  { slug: 'lead', label: 'Lead' },
  { slug: 'principal', label: 'Staff' },
] as const satisfies ReadonlyArray<Option>;

function byLabel(a: Option, b: Option) {
  return a.label.localeCompare(b.label, undefined, { sensitivity: 'base' });
}

function locationOptions(countries: Array<{ country: string; count: number }>): Option[] {
  const counts = new Map(countries.map((row) => [row.country, row.count]));
  for (const country of PINNED_COUNTRIES) {
    if (!counts.has(country)) counts.set(country, 0);
  }
  return [...counts.entries()]
    .sort(([a], [b]) => {
      const ai = LOCATION_LEADERS.indexOf(a);
      const bi = LOCATION_LEADERS.indexOf(b);
      if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      return a.localeCompare(b, undefined, { sensitivity: 'base' });
    })
    .map(([country, count]) => ({ slug: country, label: `${country} (${count})` }));
}

function hrefFromForm(form: HTMLFormElement) {
  const data = new FormData(form);
  const params = new URLSearchParams();
  for (const [key, value] of data.entries()) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    if (key === 'sort' && trimmed === 'newest') continue;
    params.append(key, trimmed);
  }
  const query = params.toString();
  return query ? `/?${query}` : '/';
}

function CheckList({
  legend,
  name,
  options,
  selected,
  scroll,
}: {
  legend: string;
  name: string;
  options: Option[];
  selected?: string[];
  scroll?: boolean;
}) {
  if (!options.length) return null;
  return (
    <fieldset className="mt-6 space-y-3">
      <legend className="text-sm font-semibold">{legend}</legend>
      <div className={scroll ? 'max-h-64 space-y-3 overflow-y-auto pr-1' : 'space-y-3'}>
        {options.map((option) => (
          <label key={option.slug} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              name={option.name ?? name}
              value={option.slug}
              defaultChecked={selected?.includes(option.slug)}
              className="size-4 shrink-0 accent-accent"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function JobFilters({
  filters,
  domains,
  tags,
  seniorities,
  countries,
  onApplied,
  className,
  applyMode = 'instant',
}: {
  filters: JobFilterValues;
  domains: Option[];
  tags: Array<{ slug: string; label: string; count: number }>;
  seniorities: Option[];
  countries: Array<{ country: string; count: number }>;
  onApplied?: () => void;
  className?: string;
  applyMode?: 'instant' | 'manual';
}) {
  const router = useRouter();
  const hasFilters = Boolean(
    filters.q ||
      filters.countries?.length ||
      filters.domains?.length ||
      filters.tags?.length ||
      filters.seniorities?.length ||
      filters.workplaces?.length ||
      filters.employments?.length ||
      filters.entryLevel ||
      filters.sort === 'relevance',
  );

  function apply(form: HTMLFormElement, close = false) {
    router.push(hrefFromForm(form), { scroll: false });
    if (close) onApplied?.();
  }

  return (
    <form
      key={JSON.stringify(filters)}
      method="get"
      action="/"
      onSubmit={(event) => {
        event.preventDefault();
        apply(event.currentTarget, true);
      }}
      onChange={(event) => {
        if (applyMode === 'manual') return;
        const target = event.target;
        if (target instanceof HTMLInputElement && target.type === 'text') return;
        apply(event.currentTarget);
      }}
      className={className ?? 'rounded-2xl border border-line bg-card p-6 max-lg:border-0 max-lg:bg-transparent max-lg:p-0'}
    >
      <label className="block text-sm font-semibold" htmlFor="job-search">
        Search
      </label>
      <input
        id="job-search"
        name="q"
        defaultValue={filters.q ?? ''}
        placeholder="Title, company, or city"
        className="mt-3 h-10 w-full rounded-lg border border-line bg-background px-3 text-sm"
      />
      <CheckList
        legend="Location"
        name="country"
        options={locationOptions(countries)}
        selected={filters.countries}
        scroll
      />
      <CheckList legend="Job type" name="employment" options={[...employments].sort(byLabel)} selected={filters.employments} />
      <CheckList
        legend="Experience"
        name="seniority"
        options={EXPERIENCE_ORDER.filter(
          (option) => option.slug === '1' || seniorities.some((item) => item.slug === option.slug),
        )}
        selected={[...(filters.entryLevel ? ['1'] : []), ...(filters.seniorities ?? [])]}
      />
      <CheckList legend="Workplace" name="workplace" options={[...workplaces].sort(byLabel)} selected={filters.workplaces} />
      <CheckList legend="Robot type" name="domain" options={[...domains].sort(byLabel)} selected={filters.domains} />
      <CheckList
        legend="Skills"
        name="tag"
        options={tags.map((tag) => ({ slug: tag.slug, label: `${tag.label} (${tag.count})` }))}
        selected={filters.tags}
        scroll
      />
      {filters.sort === 'relevance' ? <input type="hidden" name="sort" value="relevance" /> : null}
      <button
        type="submit"
        className="mt-6 h-10 w-full rounded-lg bg-accent px-3 text-base font-semibold text-accent-fg transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98]"
      >
        Apply filters
      </button>
      {hasFilters ? (
        <Link href="/" className="mt-3 block text-center text-sm text-muted underline hover:text-foreground">
          Clear filters
        </Link>
      ) : null}
    </form>
  );
}

function HiddenCurrentFilters({ filters }: { filters: JobFilterValues }) {
  return (
    <>
      {filters.q ? <input type="hidden" name="q" value={filters.q} /> : null}
      {(filters.countries ?? []).map((country) => (
        <input key={`country-${country}`} type="hidden" name="country" value={country} />
      ))}
      {(filters.workplaces ?? []).map((workplace) => (
        <input key={`workplace-${workplace}`} type="hidden" name="workplace" value={workplace} />
      ))}
      {filters.entryLevel ? <input type="hidden" name="entry" value="1" /> : null}
      {(filters.seniorities ?? []).map((seniority) => (
        <input key={`seniority-${seniority}`} type="hidden" name="seniority" value={seniority} />
      ))}
      {(filters.domains ?? []).map((domain) => (
        <input key={`domain-${domain}`} type="hidden" name="domain" value={domain} />
      ))}
      {(filters.tags ?? []).map((tag) => (
        <input key={`tag-${tag}`} type="hidden" name="tag" value={tag} />
      ))}
      {(filters.employments ?? []).map((employment) => (
        <input key={`employment-${employment}`} type="hidden" name="employment" value={employment} />
      ))}
    </>
  );
}

export function JobSort({ filters }: { filters: JobFilterValues }) {
  const router = useRouter();

  function apply(form: HTMLFormElement) {
    router.push(hrefFromForm(form), { scroll: false });
  }

  return (
    <form
      key={JSON.stringify(filters)}
      method="get"
      action="/"
      onChange={(event) => apply(event.currentTarget)}
      onSubmit={(event) => {
        event.preventDefault();
        apply(event.currentTarget);
      }}
      className="flex items-center justify-end gap-2"
    >
      <HiddenCurrentFilters filters={filters} />
      <label htmlFor="job-sort" className="text-sm font-semibold">
        Sort
      </label>
      <select
        id="job-sort"
        name="sort"
        defaultValue={filters.sort ?? 'newest'}
        className="h-10 rounded-lg border border-line bg-background px-3 text-sm"
      >
        <option value="newest">Newest</option>
        <option value="relevance">Relevance</option>
      </select>
    </form>
  );
}
