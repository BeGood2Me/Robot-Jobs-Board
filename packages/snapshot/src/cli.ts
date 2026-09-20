import { config as loadDotenv } from 'dotenv';
import { resolve } from 'node:path';
import { prisma } from '@robot-jobs-board/db';
import { exportPublicSnapshotFromFeedsToDefaultDir } from './export-from-feeds';
import { exportPublicSnapshotToDefaultDir, defaultSnapshotOutDir } from './export';
import { uploadSnapshotDirToBlob } from './upload-blob';

loadDotenv({ path: resolve(process.cwd(), '../../.env') });
loadDotenv({ path: resolve(process.cwd(), '.env') });
loadDotenv({ path: resolve(process.cwd(), '../../.env.blob.local') });
loadDotenv({ path: resolve(process.cwd(), '../../.env.local') });

async function main() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const fromFeeds = process.argv.includes('--from-feeds');
  const uploadBlob = process.argv.includes('--upload-blob');
  const uploadOnly = process.argv.includes('--upload-only');

  if (uploadOnly) {
    const outDir = defaultSnapshotOutDir();
    const uploaded = await uploadSnapshotDirToBlob(outDir);
    console.log(JSON.stringify({ event: 'snapshot.upload.blob', ...uploaded }));
    return;
  }

  const result = fromFeeds
    ? await exportPublicSnapshotFromFeedsToDefaultDir(siteUrl)
    : await exportPublicSnapshotToDefaultDir(siteUrl);
  console.log(JSON.stringify({ event: fromFeeds ? 'snapshot.export.feeds' : 'snapshot.export', ...result }));

  if (uploadBlob) {
    const outDir = defaultSnapshotOutDir();
    const uploaded = await uploadSnapshotDirToBlob(outDir);
    console.log(JSON.stringify({ event: 'snapshot.upload.blob', ...uploaded }));
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    if (!process.argv.includes('--from-feeds') && !process.argv.includes('--upload-only')) {
      await prisma.$disconnect();
    }
  });
