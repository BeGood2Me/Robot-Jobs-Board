import { gunzipSync } from 'node:zlib';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { cache } from 'react';
import type { PublicBoardSnapshot, SnapshotJobBody } from '@robot-jobs-board/snapshot';
import { resolveSnapshotBaseUrl } from '@robot-jobs-board/snapshot';
import { PUBLIC_REVALIDATE_SECONDS } from '@/lib/site';

/** Used by /api/revalidate for path busting after ingest. */
export const PUBLIC_BOARD_CACHE_TAG = 'public-board';

const BODIES_MEM_TTL_MS = 15 * 60 * 1000;
let bodiesMem: { loadedAt: number; map: Record<string, SnapshotJobBody> } | null = null;

/**
 * No process-level board cache in production: warm serverless instances can keep a
 * pre-ingest snapshot for minutes and skip the tagged Data Cache, so some routes
 * (e.g. /api/companies) show new companies while pages still 404.
 * React `cache()` still dedupes within a single request.
 */
export function clearSnapshotMemoryCache(): void {
  bodiesMem = null;
}

function parseGzipJson<T>(buf: Buffer): T {
  return JSON.parse(gunzipSync(buf).toString('utf8')) as T;
}

function localSnapshotDir(): string {
  return join(process.cwd(), 'public', 'snapshot');
}

function readLocalSnapshotFile(name: string): Buffer | null {
  const path = join(localSnapshotDir(), name);
  if (!existsSync(path)) return null;
  return readFileSync(path);
}

/** CDN / static branch — not the public /snapshot route (avoids origin loops). */
function snapshotDataBaseUrl(): string {
  const fromEnv =
    process.env.SNAPSHOT_BASE_URL?.trim() || process.env.NEXT_PUBLIC_SNAPSHOT_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT ?? '3000';
    return `http://localhost:${port}/snapshot`;
  }
  return resolveSnapshotBaseUrl();
}

/**
 * Fetch snapshot bytes.
 * - board.json.gz (~300KB): Next Data Cache OK (under 2MB limit) so location SSG stays static.
 * - bodies.json.gz (~5MB): never Data-Cache — exceeds 2MB and would fail / force dynamic.
 */
async function fetchSnapshotBytes(name: string): Promise<Buffer | null> {
  if (process.env.NODE_ENV === 'development') {
    const local = readLocalSnapshotFile(name);
    if (local) return local;
  }

  const base = snapshotDataBaseUrl();
  const url = `${base}/${name}`;
  const large = name === 'bodies.json.gz';
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/gzip,application/octet-stream,*/*' },
      ...(large
        ? { cache: 'no-store' as const }
        : { next: { revalidate: PUBLIC_REVALIDATE_SECONDS, tags: [PUBLIC_BOARD_CACHE_TAG] } }),
    });
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

async function fetchTextFile(name: string): Promise<string | null> {
  if (process.env.NODE_ENV === 'development') {
    const local = readLocalSnapshotFile(name);
    if (local) return local.toString('utf8');
  }

  const base = snapshotDataBaseUrl();
  try {
    const response = await fetch(`${base}/${name}`, {
      next: { revalidate: PUBLIC_REVALIDATE_SECONDS, tags: [PUBLIC_BOARD_CACHE_TAG] },
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

export function snapshotBaseUrl(): string {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT ?? '3000';
    return `http://localhost:${port}/snapshot`;
  }
  return `${(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.robotjobsboard.com').replace(/\/$/, '')}/snapshot`;
}

export const loadPublicSnapshot = cache(async (): Promise<PublicBoardSnapshot | null> => {
  const gz = await fetchSnapshotBytes('board.json.gz');
  if (!gz) return null;
  try {
    return parseGzipJson<PublicBoardSnapshot>(gz);
  } catch {
    return null;
  }
});

async function loadBodiesMap(): Promise<Record<string, SnapshotJobBody> | null> {
  if (bodiesMem && Date.now() - bodiesMem.loadedAt < BODIES_MEM_TTL_MS) {
    return bodiesMem.map;
  }
  const gz = await fetchSnapshotBytes('bodies.json.gz');
  if (!gz) return null;
  try {
    const map = parseGzipJson<Record<string, SnapshotJobBody>>(gz);
    bodiesMem = { loadedAt: Date.now(), map };
    return map;
  } catch {
    return null;
  }
}

export const loadJobBody = cache(async (id: string): Promise<SnapshotJobBody | null> => {
  const bodies = await loadBodiesMap();
  return bodies?.[id] ?? null;
});

export async function readStaticSnapshotFile(name: string): Promise<string | null> {
  return fetchTextFile(name);
}

export async function getSnapshotBinary(name: string): Promise<Buffer | null> {
  if (name === 'board.json.gz' || name === 'bodies.json.gz') {
    return fetchSnapshotBytes(name);
  }
  return null;
}

export function snapshotCdnBaseUrl(): string {
  return snapshotDataBaseUrl();
}
