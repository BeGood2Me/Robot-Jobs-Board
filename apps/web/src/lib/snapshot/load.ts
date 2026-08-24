import { gunzipSync } from 'node:zlib';
import { cache } from 'react';
import type { PublicBoardSnapshot } from '@robot-jobs-board/snapshot';

let cached: PublicBoardSnapshot | null = null;

function snapshotBaseUrl(): string {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT ?? '3000';
    return `http://localhost:${port}`;
  }
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.robotjobsboard.com').replace(/\/$/, '');
}

function parseSnapshotBuffer(buf: Buffer): PublicBoardSnapshot {
  return JSON.parse(gunzipSync(buf).toString('utf8')) as PublicBoardSnapshot;
}

export const loadPublicSnapshot = cache(async (): Promise<PublicBoardSnapshot | null> => {
  if (cached) return cached;

  try {
    const res = await fetch(`${snapshotBaseUrl()}/snapshot/board.json.gz`, {
      next: { revalidate: 14400 },
    });
    if (!res.ok) return null;
    cached = parseSnapshotBuffer(Buffer.from(await res.arrayBuffer()));
    return cached;
  } catch {
    return null;
  }
});

export async function readStaticSnapshotFile(name: string): Promise<string | null> {
  try {
    const res = await fetch(`${snapshotBaseUrl()}/snapshot/${name}`, {
      next: { revalidate: 14400 },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}
