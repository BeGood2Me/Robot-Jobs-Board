import type { ListingFilter, PublicBoardSnapshot } from '@robot-jobs-board/snapshot';
import { slugify } from '@/lib/site';

/** Resolve a location hub slug using snapshot index only (no database). */
export function resolvePlaceFilterFromSnapshot(
  snapshot: PublicBoardSnapshot,
  place: string,
): { label: string; filter: ListingFilter } | null {
  if (place === 'remote') {
    return { label: 'Remote', filter: { kind: 'remote' } };
  }

  const city = snapshot.places.cities.find((value) => slugify(value) === place);
  if (city) return { label: city, filter: { kind: 'city', value: city } };

  const region = snapshot.places.regions.find((value) => slugify(value) === place);
  if (region) return { label: region, filter: { kind: 'region', value: region } };

  const country = snapshot.places.countries.find((value) => slugify(value) === place);
  if (country) return { label: country, filter: { kind: 'country', value: country } };

  return null;
}

export function parseLocationPlaceParam(raw: string): string | null {
  const match = raw.match(/^([a-z0-9-]+)-robotics-jobs$/);
  return match?.[1] ?? null;
}

export function parseRobotDomainParam(raw: string): string | null {
  const match = raw.match(/^([a-z0-9-]+)-jobs$/);
  return match?.[1] ?? null;
}