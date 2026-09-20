import { prisma } from '@robot-jobs-board/db';

export { prisma };

/**
 * Public board is CDN/snapshot-first. When SNAPSHOT_ONLY=1 (production default via
 * vercel.json), skip Postgres entirely so a Neon free-tier transfer cap cannot
 * burn egress on every page fallback/probe.
 */
export function isDbEnabled(): boolean {
  if (process.env.SNAPSHOT_ONLY === '1' || process.env.DISABLE_DB === '1') return false;
  return Boolean(process.env.DATABASE_URL?.trim());
}

export async function withDb<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!isDbEnabled()) return fallback;
  try {
    return await fn();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Database unavailable', error);
    }
    return fallback;
  }
}
