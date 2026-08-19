import { PrismaClient } from '@prisma/client';
import { loadDatabaseEnv } from './load-env';

loadDatabaseEnv();

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaUrl?: string;
};

const databaseUrl = process.env.DATABASE_URL;

if (globalForPrisma.prisma && globalForPrisma.prismaUrl !== databaseUrl) {
  void globalForPrisma.prisma.$disconnect();
  globalForPrisma.prisma = undefined;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaUrl = databaseUrl;
}

export * from '@prisma/client';
