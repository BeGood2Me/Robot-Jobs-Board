import { gunzipSync } from 'node:zlib';
import { cache } from 'react';
import type { PublicBoardSnapshot, SnapshotJobBody } from '@robot-jobs-board/snapshot';

let cached: PublicBoardSnapshot | null = null;
const bodyCache = new Map<string, SnapshotJobBody>();

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

export const loadPublicSnapshot = cache(async (): Promise<PublicBoardSnapshot | null> => {
  if (cached) return cached;

  try {
    const res = await fetch(`${snapshotBaseUrl()}/snapshot/board.json.gz`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    cached = parseGzipJson<PublicBoardSnapshot>(Buffer.from(await res.arrayBuffer()));
    return cached;
  } catch {
    return null;
  }
});

/** Per-job description body (kept out of the board index for CPU). */
export const loadJobBody = cache(async (id: string): Promise<SnapshotJobBody | null> => {
  const hit = bodyCache.get(id);
  if (hit) return hit;

  try {
    const res = await fetch(`${snapshotBaseUrl()}/snapshot/jobs/${encodeURIComponent(id)}.json.gz`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const body = parseGzipJson<SnapshotJobBody>(Buffer.from(await res.arrayBuffer()));
    bodyCache.set(id, body);
    return body;
  } catch {
    return null;
  }
});

export async function readStaticSnapshotFile(name: string): Promise<string | null> {
  try {
    const res = await fetch(`${snapshotBaseUrl()}/snapshot/${name}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}
