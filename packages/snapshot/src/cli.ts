import { config as loadDotenv } from 'dotenv';
import { resolve } from 'node:path';
import { prisma } from '@robot-jobs-board/db';
import { exportPublicSnapshotToDefaultDir } from './export';

loadDotenv({ path: resolve(process.cwd(), '../../.env') });
loadDotenv({ path: resolve(process.cwd(), '.env') });

async function main() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const result = await exportPublicSnapshotToDefaultDir(siteUrl);
  console.log(JSON.stringify({ event: 'snapshot.export', ...result }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
