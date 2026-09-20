import { config as loadDotenv } from 'dotenv';
import { resolve } from 'node:path';
import { prisma } from '@robot-jobs-board/db';
import { exportPublicSnapshotFromFeedsToDefaultDir } from './export-from-feeds';
import { exportPublicSnapshotToDefaultDir, defaultSnapshotOutDir } from './export';
import { uploadSnapshotDirToBlob } from './upload-blob';
import { uploadSnapshotDirToDb } from './upload-db';

loadDotenv({ path: resolve(process.cwd(), '../../.env') });
loadDotenv({ path: resolve(process.cwd(), '.env') });
loadDotenv({ path: resolve(process.cwd(), '../../.env.blob.local') });
loadDotenv({ path: resolve(process.cwd(), '../../.env.local') });

async function main() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const fromFeeds = process.argv.includes('--from-feeds');
  const uploadBlob = process.argv.includes('--upload-blob');
  const uploadOnly = process.argv.includes('--upload-only');
  const outDir = defaultSnapshotOutDir();

  if (!uploadOnly) {
    const result = fromFeeds
      ? await exportPublicSnapshotFromFeedsToDefaultDir(siteUrl)
      : await exportPublicSnapshotToDefaultDir(siteUrl);
    console.log(JSON.stringify({ event: fromFeeds ? 'snapshot.export.feeds' : 'snapshot.export', ...result }));
  }

  // Neon: manifest + sitemaps only (optional when transfer quota is exhausted).
  try {
    const db = await uploadSnapshotDirToDb(outDir);
    console.log(JSON.stringify({ event: 'snapshot.upload.db', ...db }));
  } catch (error) {
    console.warn(
      JSON.stringify({
        event: 'snapshot.upload.db',
        skipped: true,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }

  if (uploadBlob || process.env.SNAPSHOT_UPLOAD_BLOB === '1') {
    try {
      const blob = await uploadSnapshotDirToBlob(outDir);
      console.log(JSON.stringify({ event: 'snapshot.upload.blob', ...blob }));
    } catch (error) {
      console.warn('Blob upload skipped:', error instanceof Error ? error.message : error);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
