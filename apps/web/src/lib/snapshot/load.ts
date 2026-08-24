import { gunzipSync } from 'node:zlib';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
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
  const filePath = path.join(resolveSnapshotDir(), name);
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath, 'utf8');
}
