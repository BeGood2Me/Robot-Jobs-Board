import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { resolveSnapshotBaseUrl } from './snapshot-base-url';
import type { PublicBoardSnapshot } from './types';

function parseBoardGz(buf: Buffer): PublicBoardSnapshot | null {
  try {
    return JSON.parse(gunzipSync(buf).toString('utf8')) as PublicBoardSnapshot;
  } catch {
    return null;
  }
}

export function readLocalPreviousBoard(outDir: string): PublicBoardSnapshot | null {
  const path = join(outDir, 'board.json.gz');
  if (!existsSync(path)) return null;
  try {
    return parseBoardGz(readFileSync(path));
  } catch {
    return null;
  }
}

/**
 * Prefer local board.json.gz (local export / cached CI). When missing — e.g. GitHub
 * Actions on main with no committed snapshot — fetch the live CDN board so goneJobs
 * and feed carry-forward keep working across force-pushed snapshot-data publishes.
 */
export async function loadPreviousBoard(outDir: string): Promise<PublicBoardSnapshot | null> {
  const local = readLocalPreviousBoard(outDir);
  if (local?.jobs?.length) return local;

  const base = resolveSnapshotBaseUrl();
  if (!base || base.includes('localhost')) return local;

  try {
    const response = await fetch(`${base}/board.json.gz`, {
      headers: { Accept: 'application/gzip,application/octet-stream,*/*' },
      signal: AbortSignal.timeout(90_000),
    });
    if (!response.ok) return local;
    const buf = Buffer.from(await response.arrayBuffer());
    const parsed = parseBoardGz(buf);
    if (!parsed?.jobs?.length) return local;
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'board.json.gz'), buf);
    console.log(
      JSON.stringify({
        event: 'snapshot.previous.cdn',
        jobCount: parsed.jobs.length,
        goneCount: parsed.goneJobs?.length ?? 0,
        generatedAt: parsed.generatedAt,
      }),
    );
    return parsed;
  } catch (error) {
    console.warn(
      JSON.stringify({
        event: 'snapshot.previous.cdn',
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return local;
  }
}
