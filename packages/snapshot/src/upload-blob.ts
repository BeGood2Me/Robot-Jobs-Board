import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { put } from '@vercel/blob';

const PREFIX = 'snapshot';
const MAX_RETRIES = 8;

/** Only these files go to Blob — keeps Advanced Operations under Hobby limits. */
const BLOB_FILES = [
  'manifest.json',
  'board.json.gz',
  'bodies.json.gz',
  'sitemap-jobs.xml',
  'sitemap-categories.xml',
  'sitemap-companies.xml',
  'sitemap-blog.xml',
] as const;

function contentTypeFor(path: string): string {
  if (path.endsWith('.json.gz')) return 'application/gzip';
  if (path.endsWith('.json')) return 'application/json; charset=utf-8';
  if (path.endsWith('.xml')) return 'application/xml; charset=utf-8';
  return 'application/octet-stream';
}

function cacheControlFor(name: string): number {
  if (name === 'manifest.json' || name === 'board.json.gz' || name === 'bodies.json.gz') return 60;
  return 300;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const retryAfter =
        typeof error === 'object' &&
        error &&
        'retryAfter' in error &&
        typeof (error as { retryAfter?: unknown }).retryAfter === 'number'
          ? (error as { retryAfter: number }).retryAfter
          : null;
      const message = error instanceof Error ? error.message : String(error);
      const rateLimited = /too many requests|rate limit/i.test(message) || retryAfter != null;
      if (!rateLimited || attempt === MAX_RETRIES - 1) throw error;
      const waitMs = Math.max(1000, (retryAfter ?? 2 ** attempt) * 1000);
      console.warn(`retry ${attempt + 1}/${MAX_RETRIES} ${label} after ${waitMs}ms`);
      await sleep(waitMs);
    }
  }
  throw lastError;
}

export type UploadSnapshotResult = {
  uploaded: number;
  deleted: number;
  snapshotBaseUrl: string;
  boardUrl: string;
  jobCount: number;
};

/**
 * Upload the small public snapshot index to Vercel Blob.
 * Does not upload per-job files and does not list/delete orphans (those burn Hobby Advanced Ops).
 */
export async function uploadSnapshotDirToBlob(outDir: string): Promise<UploadSnapshotResult> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN is required to upload the public snapshot');
  }

  let boardUrl = '';
  let uploaded = 0;

  for (const name of BLOB_FILES) {
    const filePath = join(outDir, name);
    if (!existsSync(filePath)) {
      if (name === 'board.json.gz' || name === 'manifest.json' || name === 'bodies.json.gz') {
        throw new Error(`Required snapshot file missing: ${name}`);
      }
      continue;
    }
    const pathname = `${PREFIX}/${name}`;
    const body = readFileSync(filePath);
    const result = await withRetry(pathname, () =>
      put(pathname, body, {
        access: 'public',
        token,
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: contentTypeFor(name),
        cacheControlMaxAge: cacheControlFor(name),
      }),
    );
    uploaded += 1;
    console.log(`uploaded ${name}`);
    if (name === 'board.json.gz') boardUrl = result.url;
  }

  if (!boardUrl) {
    throw new Error('Upload finished but board.json.gz was not uploaded');
  }

  const board = new URL(boardUrl);
  const snapshotBaseUrl = `${board.origin}/${PREFIX}`;
  const manifest = JSON.parse(readFileSync(join(outDir, 'manifest.json'), 'utf8')) as {
    jobCount?: number;
  };

  return {
    uploaded,
    deleted: 0,
    snapshotBaseUrl,
    boardUrl,
    jobCount: manifest.jobCount ?? 0,
  };
}
