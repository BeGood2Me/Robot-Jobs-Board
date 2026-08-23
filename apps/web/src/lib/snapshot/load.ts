import { gunzipSync } from 'node:zlib';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import type { PublicBoardSnapshot } from '@robot-jobs-board/snapshot';

let cached: PublicBoardSnapshot | null = null;
let cachedMtime = 0;

export function snapshotBoardPath(): string {
  return path.join(process.cwd(), 'public', 'snapshot', 'board.json.gz');
}

export function hasPublicSnapshot(): boolean {
  return existsSync(snapshotBoardPath());
}

export function loadPublicSnapshot(): PublicBoardSnapshot | null {
  const filePath = snapshotBoardPath();
  if (!existsSync(filePath)) return null;
  const mtime = statSync(filePath).mtimeMs;
  if (cached && cachedMtime === mtime) return cached;
  cached = JSON.parse(gunzipSync(readFileSync(filePath)).toString('utf8')) as PublicBoardSnapshot;
  cachedMtime = mtime;
  return cached;
}

export function readStaticSnapshotFile(name: string): string | null {
  const filePath = path.join(process.cwd(), 'public', 'snapshot', name);
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath, 'utf8');
}
