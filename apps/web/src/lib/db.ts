import { prisma } from '@robot-jobs-board/db';

export { prisma };

export async function withDb<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Database unavailable', error);
    }
    return fallback;
  }
}
