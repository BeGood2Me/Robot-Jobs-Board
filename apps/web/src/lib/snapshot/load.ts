import { gunzipSync } from 'node:zlib';
import { cache } from 'react';
import type { PublicBoardSnapshot, SnapshotJobBody } from '@robot-jobs-board/snapshot';

/** Next.js Data Cache tag — ingest calls /api/revalidate to bust this after each board refresh. */
export const PUBLIC_BOARD_CACHE_TAG = 'public-board';

function snapshotBaseUrl(): string {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT ?? '3000';
    return `http://localhost:${port}`;
  }
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.robotjobsboard.com').replace(/\/$/, '');
}

function parseGzipJson<T>(buf: Buffer): T {
  return JSON.parse(gunzipSync(buf).toString('utf8')) as T;
}

async function boardCacheBuster(): Promise<string> {
  try {
    const res = await fetch(`${snapshotBaseUrl()}/snapshot/manifest.json`, {
      next: { revalidate: 60, tags: [PUBLIC_BOARD_CACHE_TAG] },
    });
    if (!res.ok) return '0';
    const manifest = (await res.json()) as { generatedAt?: string; jobCount?: number };
    return manifest.generatedAt ?? String(manifest.jobCount ?? 0);
  } catch {
    return '0';
  }
}

export const loadPublicSnapshot = cache(async (): Promise<PublicBoardSnapshot | null> => {
  try {
    const v = await boardCacheBuster();
    const res = await fetch(`${snapshotBaseUrl()}/snapshot/board.json.gz?v=${encodeURIComponent(v)}`, {
      next: { revalidate: 3600, tags: [PUBLIC_BOARD_CACHE_TAG] },
    });
    if (!res.ok) return null;
    return parseGzipJson<PublicBoardSnapshot>(Buffer.from(await res.arrayBuffer()));
  } catch {
    return null;
  }
});

/** Per-job description body (kept out of the board index for CPU). */
export const loadJobBody = cache(async (id: string): Promise<SnapshotJobBody | null> => {
  try {
    const v = await boardCacheBuster();
    const res = await fetch(
      `${snapshotBaseUrl()}/snapshot/jobs/${encodeURIComponent(id)}.json.gz?v=${encodeURIComponent(v)}`,
      { next: { revalidate: 3600, tags: [PUBLIC_BOARD_CACHE_TAG] } },
    );
    if (!res.ok) return null;
    return parseGzipJson<SnapshotJobBody>(Buffer.from(await res.arrayBuffer()));
  } catch {
    return null;
  }
});

export async function readStaticSnapshotFile(name: string): Promise<string | null> {
  try {
    const v = await boardCacheBuster();
    const res = await fetch(`${snapshotBaseUrl()}/snapshot/${name}?v=${encodeURIComponent(v)}`, {
      next: { revalidate: 3600, tags: [PUBLIC_BOARD_CACHE_TAG] },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}
