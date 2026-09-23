import { gunzipSync } from 'node:zlib';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { cache } from 'react';
import type { PublicBoardSnapshot, SnapshotJobBody } from '@robot-jobs-board/snapshot';
import {
  bodyShardIndex,
  bodyShardPath,
  resolveSnapshotBaseUrl,
  SNAPSHOT_BODIES_FILE,
} from '@robot-jobs-board/snapshot';
import { PUBLIC_REVALIDATE_SECONDS } from '@/lib/site';

/** Used by /api/revalidate for path busting after ingest. */
export const PUBLIC_BOARD_CACHE_TAG = 'public-board';

type SnapshotManifest = {
  generatedAt?: string;
  bodiesShardCount?: number;
};

/**
 * Warm-instance caches keyed by snapshot generatedAt so revalidate / new ingest
 * cannot serve a stale board (the failure mode that 404'd /companies/openai).
 */
let boardMem: { generatedAt: string; snapshot: PublicBoardSnapshot } | null = null;
let shardMem = new Map<number, { generatedAt: string; map: Record<string, SnapshotJobBody> }>();

export function clearSnapshotMemoryCache(): void {
  boardMem = null;
  shardMem = new Map();
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
 * - board.json.gz + bodies/shards/*.json.gz: Data Cache OK (under 2MB).
 * - bodies.json.gz (~5MB): never Data-Cache — exceeds 2MB; only used as pre-shard fallback.
 */
async function fetchSnapshotBytes(name: string): Promise<Buffer | null> {
  if (process.env.NODE_ENV === 'development') {
    const local = readLocalSnapshotFile(name);
    if (local) return local;
  }

  const base = snapshotDataBaseUrl();
  const url = `${base}/${name}`;
  const tooLargeForDataCache = name === SNAPSHOT_BODIES_FILE;
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/gzip,application/octet-stream,*/*' },
      ...(tooLargeForDataCache
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

const readManifest = cache(async (): Promise<SnapshotManifest | null> => {
  const text = await fetchTextFile('manifest.json');
  if (!text) return null;
  try {
    return JSON.parse(text) as SnapshotManifest;
  } catch {
    return null;
  }
});

async function bodiesShardsEnabled(): Promise<boolean> {
  const manifest = await readManifest();
  return typeof manifest?.bodiesShardCount === 'number' && manifest.bodiesShardCount > 0;
}

export const loadPublicSnapshot = cache(async (): Promise<PublicBoardSnapshot | null> => {
  const manifest = await readManifest();
  const generatedAt = manifest?.generatedAt?.trim();
  if (boardMem && generatedAt && boardMem.generatedAt === generatedAt) {
    return boardMem.snapshot;
  }

  const gz = await fetchSnapshotBytes('board.json.gz');
  if (!gz) return null;
  try {
    const snapshot = parseGzipJson<PublicBoardSnapshot>(gz);
    if (generatedAt || snapshot.generatedAt) {
      boardMem = { generatedAt: generatedAt || snapshot.generatedAt, snapshot };
    }
    return snapshot;
  } catch {
    return null;
  }
});

async function loadBodyFromShard(id: string): Promise<SnapshotJobBody | null> {
  const manifest = await readManifest();
  const generatedAt = manifest?.generatedAt?.trim();
  const index = bodyShardIndex(id);
  if (generatedAt) {
    const hit = shardMem.get(index);
    if (hit && hit.generatedAt === generatedAt) {
      return hit.map[id] ?? null;
    }
  }

  const gz = await fetchSnapshotBytes(bodyShardPath(id));
  if (!gz) return null;
  try {
    const map = parseGzipJson<Record<string, SnapshotJobBody>>(gz);
    if (generatedAt) shardMem.set(index, { generatedAt, map });
    return map[id] ?? null;
  } catch {
    return null;
  }
}

/** Fallback while CDN still only has the monolithic bodies map (pre-shard ingest). */
async function loadBodyFromFullMap(id: string): Promise<SnapshotJobBody | null> {
  const gz = await fetchSnapshotBytes(SNAPSHOT_BODIES_FILE);
  if (!gz) return null;
  try {
    const map = parseGzipJson<Record<string, SnapshotJobBody>>(gz);
    return map[id] ?? null;
  } catch {
    return null;
  }
}

export const loadJobBody = cache(async (id: string): Promise<SnapshotJobBody | null> => {
  // When shards exist, never gunzip the 5MB monolith — a miss returns null and the
  // job page falls back to empty/DB description instead of burning Fluid CPU.
  if (await bodiesShardsEnabled()) {
    return loadBodyFromShard(id);
  }
  return loadBodyFromFullMap(id);
});

export async function readStaticSnapshotFile(name: string): Promise<string | null> {
  return fetchTextFile(name);
}

const BINARY_SNAPSHOT_RE =
  /^(board\.json\.gz|bodies\.json\.gz|bodies\/shards\/\d+\.json\.gz)$/;

export async function getSnapshotBinary(name: string): Promise<Buffer | null> {
  if (!BINARY_SNAPSHOT_RE.test(name)) return null;
  return fetchSnapshotBytes(name);
}

export function snapshotCdnBaseUrl(): string {
  return snapshotDataBaseUrl();
}
