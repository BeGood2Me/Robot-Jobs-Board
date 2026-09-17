import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import type { PublicBoardSnapshot } from '@robot-jobs-board/snapshot';
import { slugify } from '@/lib/site';

function snapshotPath(): string {
  const candidates = [
    join(process.cwd(), 'public', 'snapshot', 'board.json.gz'),
    join(process.cwd(), 'apps', 'web', 'public', 'snapshot', 'board.json.gz'),
  ];
  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  return candidates[0];
}

export function readBoardSnapshotAtBuild(): PublicBoardSnapshot | null {
  try {
    const path = snapshotPath();
    if (!existsSync(path)) return null;
    return JSON.parse(gunzipSync(readFileSync(path)).toString('utf8')) as PublicBoardSnapshot;
  } catch {
    return null;
  }
}

export function companyStaticParams(): Array<{ slug: string }> {
  const snapshot = readBoardSnapshotAtBuild();
  if (!snapshot) return [];
  return snapshot.companies.map((company) => ({ slug: company.slug }));
}

export function domainStaticParams(): Array<{ slug: string }> {
  const snapshot = readBoardSnapshotAtBuild();
  if (!snapshot) return [];
  return snapshot.domains.map((domain) => ({ slug: `${domain.slug}-jobs` }));
}

export function placeStaticParams(): Array<{ place: string }> {
  const snapshot = readBoardSnapshotAtBuild();
  if (!snapshot) return [{ place: 'remote-robotics-jobs' }];
  const places = new Set<string>(['remote-robotics-jobs']);
  for (const city of snapshot.places.cities) places.add(`${slugify(city)}-robotics-jobs`);
  for (const country of snapshot.places.countries) places.add(`${slugify(country)}-robotics-jobs`);
  for (const region of snapshot.places.regions) places.add(`${slugify(region)}-robotics-jobs`);
  return [...places].map((place) => ({ place }));
}
