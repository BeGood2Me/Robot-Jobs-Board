import { gunzipSync } from 'node:zlib';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import type { PublicBoardSnapshot, SnapshotJobBody } from '@robot-jobs-board/snapshot';
import { prisma, withDb } from '@/lib/db';
import { PUBLIC_REVALIDATE_SECONDS } from '@/lib/site';

/** Next.js Data Cache tag — ingest calls /api/revalidate to bust this after each board refresh. */
export const PUBLIC_BOARD_CACHE_TAG = 'public-board';

function parseGzipJson<T>(buf: Buffer): T {
  return JSON.parse(gunzipSync(buf).toString('utf8')) as T;
}

type SnapshotRow = {
  generatedAt: Date;
  jobCount: number;
  manifestJson: string;
  boardGz: Uint8Array;
  bodiesGz: Uint8Array;
  sitemapJobs: string;
  sitemapCategories: string;
  sitemapCompanies: string;
  sitemapBlog: string;
};

const loadSnapshotRow = unstable_cache(
  async (): Promise<SnapshotRow | null> => {
    const row = await prisma.publicSnapshot.findUnique({ where: { id: 'current' } });
    if (!row) return null;
    return {
      generatedAt: row.generatedAt,
      jobCount: row.jobCount,
      manifestJson: row.manifestJson,
      boardGz: row.boardGz,
      bodiesGz: row.bodiesGz,
      sitemapJobs: row.sitemapJobs,
      sitemapCategories: row.sitemapCategories,
      sitemapCompanies: row.sitemapCompanies,
      sitemapBlog: row.sitemapBlog,
    };
  },
  ['public-snapshot-row'],
  { revalidate: PUBLIC_REVALIDATE_SECONDS, tags: [PUBLIC_BOARD_CACHE_TAG] },
);

async function getSnapshotRow(): Promise<SnapshotRow | null> {
  return withDb(() => loadSnapshotRow(), null);
}

/**
 * Public HTTP origin for legacy Blob/static fallback (optional).
 * Prefer Neon `PublicSnapshot` when present.
 */
export function snapshotBaseUrl(): string {
  const fromEnv = process.env.SNAPSHOT_BASE_URL?.trim() || process.env.NEXT_PUBLIC_SNAPSHOT_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT ?? '3000';
    return `http://localhost:${port}/snapshot`;
  }
  return `${(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.robotjobsboard.com').replace(/\/$/, '')}/snapshot`;
}

export const loadPublicSnapshot = cache(async (): Promise<PublicBoardSnapshot | null> => {
  const row = await getSnapshotRow();
  if (row) {
    try {
      return parseGzipJson<PublicBoardSnapshot>(Buffer.from(row.boardGz));
    } catch {
      /* fall through */
    }
  }

  // Optional HTTP/Blob/static fallback for local files or a healthy Blob store.
  try {
    const res = await fetch(`${snapshotBaseUrl()}/board.json.gz`, {
      next: { revalidate: PUBLIC_REVALIDATE_SECONDS, tags: [PUBLIC_BOARD_CACHE_TAG] },
    });
    if (!res.ok) return null;
    return parseGzipJson<PublicBoardSnapshot>(Buffer.from(await res.arrayBuffer()));
  } catch {
    return null;
  }
});

const loadBodiesMap = cache(async (): Promise<Record<string, SnapshotJobBody> | null> => {
  const row = await getSnapshotRow();
  if (row) {
    try {
      return parseGzipJson<Record<string, SnapshotJobBody>>(Buffer.from(row.bodiesGz));
    } catch {
      /* fall through */
    }
  }
  try {
    const res = await fetch(`${snapshotBaseUrl()}/bodies.json.gz`, {
      next: { revalidate: PUBLIC_REVALIDATE_SECONDS, tags: [PUBLIC_BOARD_CACHE_TAG] },
    });
    if (!res.ok) return null;
    return parseGzipJson<Record<string, SnapshotJobBody>>(Buffer.from(await res.arrayBuffer()));
  } catch {
    return null;
  }
});

export const loadJobBody = cache(async (id: string): Promise<SnapshotJobBody | null> => {
  const bodies = await loadBodiesMap();
  return bodies?.[id] ?? null;
});

export async function readStaticSnapshotFile(name: string): Promise<string | null> {
  const row = await getSnapshotRow();
  if (row) {
    switch (name) {
      case 'manifest.json':
        return row.manifestJson;
      case 'sitemap-jobs.xml':
        return row.sitemapJobs || null;
      case 'sitemap-categories.xml':
        return row.sitemapCategories || null;
      case 'sitemap-companies.xml':
        return row.sitemapCompanies || null;
      case 'sitemap-blog.xml':
        return row.sitemapBlog || null;
      default:
        break;
    }
  }

  try {
    const res = await fetch(`${snapshotBaseUrl()}/${name}`, {
      next: { revalidate: PUBLIC_REVALIDATE_SECONDS, tags: [PUBLIC_BOARD_CACHE_TAG] },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function getSnapshotBinary(name: string): Promise<Buffer | null> {
  const row = await getSnapshotRow();
  if (!row) return null;
  if (name === 'board.json.gz') return Buffer.from(row.boardGz);
  if (name === 'bodies.json.gz') return Buffer.from(row.bodiesGz);
  return null;
}
