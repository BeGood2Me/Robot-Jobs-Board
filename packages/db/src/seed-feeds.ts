import { prisma } from './index.js';
import { upsertSeedCompanies } from './seed-companies.js';

async function main() {
  const count = await upsertSeedCompanies(prisma);
  console.log(`Upserted ${count} companies and source feeds (no sample jobs).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
