import { config as loadDotenv } from 'dotenv';
import { resolve } from 'node:path';
import { prisma } from '@robot-jobs-board/db';
import { exportPublicSnapshotFromFeedsToDefaultDir } from './export-from-feeds';
import { exportPublicSnapshotToDefaultDir } from './export';

loadDotenv({ path: resolve(process.cwd(), '../../.env') });
loadDotenv({ path: resolve(process.cwd(), '.env') });

async function main() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const fromFeeds = process.argv.includes('--from-feeds');
  const result = fromFeeds
    ? await exportPublicSnapshotFromFeedsToDefaultDir(siteUrl)
    : await exportPublicSnapshotToDefaultDir(siteUrl);
  console.log(JSON.stringify({ event: fromFeeds ? 'snapshot.export.feeds' : 'snapshot.export', ...result }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    if (!process.argv.includes('--from-feeds')) {
      await prisma.$disconnect();
    }
  });
