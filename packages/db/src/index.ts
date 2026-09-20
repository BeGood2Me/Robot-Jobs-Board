import { PrismaClient } from '@prisma/client';
import { loadDatabaseEnv } from './load-env';

loadDatabaseEnv();

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaUrl?: string;
};

const databaseUrl = process.env.DATABASE_URL;
const snapshotOnly =
  process.env.SNAPSHOT_ONLY === '1' ||
  process.env.DISABLE_DB === '1' ||
  (process.env.VERCEL === '1' && process.env.SNAPSHOT_ONLY !== '0');

if (globalForPrisma.prisma && globalForPrisma.prismaUrl !== databaseUrl) {
  void globalForPrisma.prisma.$disconnect();
  globalForPrisma.prisma = undefined;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Quiet when the public site is snapshot-only — Neon errors otherwise flood Vercel build logs.
    log: snapshotOnly ? [] : process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaUrl = databaseUrl;
}

export * from '@prisma/client';
