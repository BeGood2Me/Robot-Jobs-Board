import { config as loadDotenv } from 'dotenv';
import { resolve } from 'node:path';
import { prisma } from '@robot-jobs-board/db';
import { reclassifyActiveJobs, reviveNowAllowedJobs, runIngestion } from './runner';

loadDotenv({ path: resolve(process.cwd(), '../../.env') });
loadDotenv({ path: resolve(process.cwd(), '.env') });

async function main() {
  const command = process.argv[2] ?? 'run';
  if (command === 'reclassify') {
    const result = await reclassifyActiveJobs();
    console.log(JSON.stringify({ event: 'ingest.reclassify', ...result }));
    return;
  }
  if (command === 'revive') {
    const revived = await reviveNowAllowedJobs();
    console.log(JSON.stringify({ event: 'ingest.revive', revived }));
    return;
  }
  if (command !== 'run' && command !== 'cron') {
    console.error('Usage: ingest:run | ingest:cron | ingest:reclassify');
    process.exit(1);
  }
  await runIngestion();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
