import { gunzipSync } from 'node:zlib';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import type { PublicBoardSnapshot } from '@robot-jobs-board/snapshot';

let cached: PublicBoardSnapshot | null = null;
let cachedMtime = 0;
let cachedDir: string | null = null;

function resolveSnapshotDir(): string {
  if (cachedDir) return cachedDir;

  const candidates: string[] = [];
  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    candidates.push(path.join(dir, 'public', 'snapshot'));
    candidates.push(path.join(dir, 'apps', 'web', 'public', 'snapshot'));
    if (existsSync(path.join(dir, 'pnpm-workspace.yaml'))) break;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, 'board.json.gz'))) {
      cachedDir = candidate;
      return candidate;
    }
  }

  cachedDir = path.join(process.cwd(), 'public', 'snapshot');
  return cachedDir;
}

export function snapshotBoardPath(): string {
  return path.join(resolveSnapshotDir(), 'board.json.gz');
}

function snapshotSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.robotjobsboard.com').replace(/\/$/, '');
}

function parseSnapshotBuffer(buf: Buffer): PublicBoardSnapshot {
  return JSON.parse(gunzipSync(buf).toString('utf8')) as PublicBoardSnapshot;
}

export function hasPublicSnapshot(): boolean {
  return existsSync(snapshotBoardPath());
}

export const loadPublicSnapshot = cache(async (): Promise<PublicBoardSnapshot | null> => {
  const filePath = snapshotBoardPath();
  if (existsSync(filePath)) {
    const mtime = statSync(filePath).mtimeMs;
    if (cached && cachedMtime === mtime) return cached;
    cached = parseSnapshotBuffer(readFileSync(filePath));
    cachedMtime = mtime;
    return cached;
  }

  try {
    const res = await fetch(`${snapshotSiteUrl()}/snapshot/board.json.gz`, {
      next: { revalidate: 14400 },
    });
    if (!res.ok) return null;
    cached = parseSnapshotBuffer(Buffer.from(await res.arrayBuffer()));
    cachedMtime = Date.now();
    return cached;
  } catch {
    return null;
  }
});

export async function readStaticSnapshotFile(name: string): Promise<string | null> {
  const filePath = path.join(resolveSnapshotDir(), name);
  if (existsSync(filePath)) {
    return readFileSync(filePath, 'utf8');
  }

  try {
    const res = await fetch(`${snapshotSiteUrl()}/snapshot/${name}`, {
      next: { revalidate: 14400 },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}
