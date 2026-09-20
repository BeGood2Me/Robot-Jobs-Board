import { prisma } from '@robot-jobs-board/db';

export { prisma };

/**
 * Public board is CDN/snapshot-first. Skip Postgres on Vercel unless SNAPSHOT_ONLY=0
 * so a Neon free-tier transfer cap cannot flood build logs or burn egress.
 */
export function isDbEnabled(): boolean {
  if (process.env.SNAPSHOT_ONLY === '1' || process.env.DISABLE_DB === '1') return false;
  if (process.env.SNAPSHOT_ONLY === '0') return Boolean(process.env.DATABASE_URL?.trim());
  // Default off on Vercel (Hobby Neon transfer is exhausted).
  if (process.env.VERCEL === '1') return false;
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
