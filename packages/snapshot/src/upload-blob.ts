import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { del, list, put } from '@vercel/blob';

const PREFIX = 'snapshot';
const CONCURRENCY = 4;
const MAX_RETRIES = 8;

function contentTypeFor(path: string): string {
  if (path.endsWith('.json.gz')) return 'application/gzip';
  if (path.endsWith('.json')) return 'application/json; charset=utf-8';
  if (path.endsWith('.xml')) return 'application/xml; charset=utf-8';
  return 'application/octet-stream';
}

function cacheControlFor(pathname: string): number {
  // Board index + manifest change every ingest; job bodies are immutable per id until replaced.
  if (pathname.endsWith('/manifest.json') || pathname.endsWith('/board.json.gz')) return 60;
  if (pathname.includes('/jobs/')) return 3600;
  return 300;
}

function walkFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walkFiles(full));
    else if (name !== '.gitkeep') out.push(full);
  }
  return out;
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

async function mapPool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx]!);
    }
  });
  await Promise.all(workers);
}

async function listAll(prefix: string): Promise<Array<{ url: string; pathname: string }>> {
  const blobs: Array<{ url: string; pathname: string }> = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    for (const blob of page.blobs) {
      blobs.push({ url: blob.url, pathname: blob.pathname });
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return blobs;
}

export type UploadSnapshotResult = {
  uploaded: number;
  deleted: number;
  snapshotBaseUrl: string;
  boardUrl: string;
  jobCount: number;
};

/** Upload a local `public/snapshot` directory to Vercel Blob under `snapshot/`. */
export async function uploadSnapshotDirToBlob(outDir: string): Promise<UploadSnapshotResult> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN is required to upload the public snapshot');
  }

  const files = walkFiles(outDir);
  if (!files.length) {
    throw new Error(`No snapshot files found under ${outDir}`);
  }

  let boardUrl = '';
  let uploaded = 0;

  await mapPool(files, CONCURRENCY, async (filePath) => {
    const rel = relative(outDir, filePath).split(sep).join('/');
    const pathname = `${PREFIX}/${rel}`;
    const body = readFileSync(filePath);
    const result = await withRetry(pathname, () =>
      put(pathname, body, {
        access: 'public',
        token,
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: contentTypeFor(pathname),
        cacheControlMaxAge: cacheControlFor(pathname),
      }),
    );
    uploaded += 1;
    if (uploaded % 100 === 0 || rel === 'board.json.gz' || rel === 'manifest.json') {
      console.log(`uploaded ${uploaded}/${files.length}: ${rel}`);
    }
    if (rel === 'board.json.gz') boardUrl = result.url;
  });

  if (!boardUrl) {
    throw new Error('Upload finished but board.json.gz was not found in the local snapshot');
  }

  const activePathnames = new Set(
    files.map((filePath) => {
      const rel = relative(outDir, filePath).split(sep).join('/');
      return `${PREFIX}/${rel}`;
    }),
  );

  const remote = await listAll(`${PREFIX}/`);
  const stale = remote.filter((blob) => !activePathnames.has(blob.pathname));
  if (stale.length) {
    await del(
      stale.map((blob) => blob.url),
      { token },
    );
  }

  const board = new URL(boardUrl);
  const snapshotBaseUrl = `${board.origin}/${PREFIX}`;
  const manifest = JSON.parse(readFileSync(join(outDir, 'manifest.json'), 'utf8')) as {
    jobCount?: number;
  };

  return {
    uploaded,
    deleted: stale.length,
    snapshotBaseUrl,
    boardUrl,
    jobCount: manifest.jobCount ?? 0,
  };
}
