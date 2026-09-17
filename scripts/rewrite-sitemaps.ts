import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import type { PublicBoardSnapshot, SnapshotJobBody } from '../packages/snapshot/src/types.ts';
import { writePublicSnapshotFiles } from '../packages/snapshot/src/write-snapshot.ts';

const outDir = 'apps/web/public/snapshot';
const snap = JSON.parse(
  gunzipSync(readFileSync(join(outDir, 'board.json.gz'))).toString('utf8'),
) as PublicBoardSnapshot;

for (const job of snap.jobs) {
  if (job.descriptionPlain != null && job.descriptionHtml != null) continue;
  const bodyPath = join(outDir, 'jobs', `${job.id}.json.gz`);
  if (!existsSync(bodyPath)) continue;
  try {
    const body = JSON.parse(gunzipSync(readFileSync(bodyPath)).toString('utf8')) as SnapshotJobBody;
    job.descriptionHtml = body.descriptionHtml;
    job.descriptionPlain = body.descriptionPlain;
  } catch {
    // keep index-only job
  }
}

writePublicSnapshotFiles(snap, outDir);
console.log(
  JSON.stringify({
    event: 'snapshot.sitemaps.rewrite',
    jobsInBoard: snap.jobs.length,
  }),
);
