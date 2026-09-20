import { gunzipSync } from 'node:zlib';
import { cache } from 'react';
import type { PublicBoardSnapshot, SnapshotJobBody } from '@robot-jobs-board/snapshot';
import { prisma, withDb } from '@/lib/db';

/** Used by /api/revalidate for path busting after ingest. */
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

/**
 * Request-scoped only — do not put boardGz/bodiesGz in `unstable_cache`
 * (they exceed the 2MB Data Cache item limit and stall static generation).
 */
async function getSnapshotRow(): Promise<SnapshotRow | null> {
  return withDb(async () => {
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
  }, null);
}

export function snapshotBaseUrl(): string {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT ?? '3000';
    return `http://localhost:${port}/snapshot`;
  }
  return `${(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.robotjobsboard.com').replace(/\/$/, '')}/snapshot`;
}

export const loadPublicSnapshot = cache(async (): Promise<PublicBoardSnapshot | null> => {
  const row = await getSnapshotRow();
  if (!row) return null;
  try {
    return parseGzipJson<PublicBoardSnapshot>(Buffer.from(row.boardGz));
  } catch {
    return null;
  }
});

const loadBodiesMap = cache(async (): Promise<Record<string, SnapshotJobBody> | null> => {
  const row = await getSnapshotRow();
  if (!row) return null;
  try {
    return parseGzipJson<Record<string, SnapshotJobBody>>(Buffer.from(row.bodiesGz));
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
  if (!row) return null;
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
