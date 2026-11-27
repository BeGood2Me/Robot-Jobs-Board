import { unstable_cache } from 'next/cache';
import {
  fetchWorkdayJobList,
  postedAtFromWorkdayListPosting,
  type WorkdayBoard,
} from '@robot-jobs-board/ingestion/workday';
import { PUBLIC_REVALIDATE_SECONDS } from '@/lib/site';

const AUTOSTORE_WORKDAY: WorkdayBoard = {
  host: 'autostore.wd3.myworkdayjobs.com',
  tenant: 'autostore',
  site: 'autostore',
};

const loadAutostorePostedByReq = unstable_cache(
  async () => {
    const list = await fetchWorkdayJobList(AUTOSTORE_WORKDAY, { listAttempts: 12 });
    const ref = new Date();
    const out: Record<string, string> = {};
    for (const posting of list) {
      const reqId = posting.bulletFields?.[0];
      if (!reqId) continue;
      const posted = postedAtFromWorkdayListPosting(posting, ref);
      if (posted) out[reqId] = posted.toISOString();
    }
    return out;
  },
  ['workday-posted-autostore-v1'],
  { revalidate: PUBLIC_REVALIDATE_SECONDS },
);

type PostedOverlayJob = {
  externalId: string;
  sourceSystem: string;
  company: { slug: string };
  postedAt?: Date | string | null;
};

/** Snapshot-safe: fills missing Workday postedAt when CI retains stale AutoStore rows after 429. */
export async function applyWorkdayPostedOverlay<T extends PostedOverlayJob>(jobs: T[]): Promise<T[]> {
  if (!jobs.some((j) => j.company.slug === 'autostore' && j.sourceSystem === 'workday' && !j.postedAt)) {
    return jobs;
  }
  try {
    const byReq = await loadAutostorePostedByReq();
    return jobs.map((job) => {
      if (job.company.slug !== 'autostore' || job.sourceSystem !== 'workday' || job.postedAt) return job;
      const iso = byReq[job.externalId];
      return iso ? { ...job, postedAt: iso } : job;
    });
  } catch {
    return jobs;
  }
}