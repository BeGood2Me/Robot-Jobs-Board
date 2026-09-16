import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { writePublicSnapshotFiles } from '../packages/snapshot/src/write-snapshot.ts';

const snap = JSON.parse(gunzipSync(readFileSync('apps/web/public/snapshot/board.json.gz')).toString('utf8'));
writePublicSnapshotFiles(snap, 'apps/web/public/snapshot');
console.log(
  JSON.stringify({
    event: 'snapshot.sitemaps.rewrite',
    jobsInBoard: snap.jobs.length,
  }),
);
