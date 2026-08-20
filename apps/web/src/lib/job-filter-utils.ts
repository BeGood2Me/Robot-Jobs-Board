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
