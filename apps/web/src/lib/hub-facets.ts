import {
  matchesListingFilter,
  type ListingFilter,
} from '@robot-jobs-board/snapshot';
import { loadPublicSnapshot } from '@/lib/snapshot/load';
import { placeStaticParams } from '@/lib/snapshot/static-params';
import { INDEX_JOB_THRESHOLD, slugify } from '@/lib/site';

export type HubFacetLink = { href: string; label: string; count: number };

export async function loadHubFacets(
  filter: ListingFilter,
  options: {
    showCompanies?: boolean;
    showCities?: boolean;
    companyLimit?: number;
    cityLimit?: number;
  } = {},
): Promise<{ companies: HubFacetLink[]; cities: HubFacetLink[] }> {
  const snapshot = await loadPublicSnapshot();
  if (!snapshot) return { companies: [], cities: [] };

  const filtered = snapshot.jobs.filter(
    (job) => job.isActive && !job.isHidden && matchesListingFilter(job, filter),
  );

  const companyLimit = options.companyLimit ?? 10;
  const cityLimit = options.cityLimit ?? 10;
  const showCompanies = options.showCompanies !== false;
  const showCities = options.showCities === true;

  let companies: HubFacetLink[] = [];
  if (showCompanies) {
    const map = new Map<string, { name: string; slug: string; count: number }>();
    for (const job of filtered) {
      const slug = job.company.slug;
      const existing = map.get(slug);
      if (existing) existing.count += 1;
      else map.set(slug, { name: job.company.name, slug, count: 1 });
    }
    companies = [...map.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, companyLimit)
      .map((row) => ({
        href: `/companies/${row.slug}`,
        label: row.name,
        count: row.count,
      }));
  }

  let cities: HubFacetLink[] = [];
  if (showCities) {
    const placeSet = new Set(placeStaticParams().map((row) => row.place));
    const map = new Map<string, number>();
    for (const job of filtered) {
      if (!job.city || job.city === 'Remote') continue;
      map.set(job.city, (map.get(job.city) ?? 0) + 1);
    }
    cities = [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, cityLimit * 2)
      .flatMap(([city, count]) => {
        if (count < INDEX_JOB_THRESHOLD) return [];
        const place = `${slugify(city)}-robotics-jobs`;
        if (!placeSet.has(place)) return [];
        return [{ href: `/locations/${place}`, label: city, count }];
      })
      .slice(0, cityLimit);
  }

  return { companies, cities };
}
