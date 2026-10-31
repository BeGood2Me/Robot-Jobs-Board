import {
  applyManualFeaturedToSnapshot,
  mergeManualFeaturedJobsIntoList,
  manualFeaturedJobs,
} from './manual-featured';
import {
  MICRO1_MANUAL_POST_ID,
  fetchMicro1JobStatus,
  isMicro1JobStatusOpen,
} from './micro1-post-status';
import type { PublicBoardSnapshot, SnapshotJob } from './types';

function statusTtlMs(): number {
  const raw = process.env.MANUAL_FEATURED_STATUS_TTL_SECONDS?.trim();
  const seconds = raw ? Number(raw) : 86_400;
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 86_400_000;
}

type OpenCache = { open: boolean; until: number };

let openCache: OpenCache | null = null;
let inflightOpen: Promise<boolean> | null = null;

export function clearManualFeaturedOpenCache(): void {
  openCache = null;
  inflightOpen = null;
}

/**
 * Whether the partner manual Featured row should appear.
 * Fail-open on fetch/parse errors so a micro1 blip does not hide the listing.
 */
export async function isManualFeaturedMicro1Open(): Promise<boolean> {
  if (process.env.DISABLE_MANUAL_FEATURED === '1') return false;
  if (process.env.DISABLE_MANUAL_FEATURED_STATUS_CHECK === '1') return true;

  const now = Date.now();
  if (openCache && openCache.until > now) return openCache.open;

  if (!inflightOpen) {
    inflightOpen = (async () => {
      try {
        const status = await fetchMicro1JobStatus(MICRO1_MANUAL_POST_ID);
        if (status === null) {
          return openCache?.open ?? true;
        }
        const open = isMicro1JobStatusOpen(status);
        if (!open && status !== null) {
          console.log(
            JSON.stringify({
              event: 'manual_featured.hidden',
              postId: MICRO1_MANUAL_POST_ID,
              jobStatus: status,
            }),
          );
        }
        openCache = { open, until: Date.now() + statusTtlMs() };
        return open;
      } finally {
        inflightOpen = null;
      }
    })();
  }

  return inflightOpen;
}

export async function activeManualFeaturedJobs(): Promise<SnapshotJob[]> {
  if (!(await isManualFeaturedMicro1Open())) return [];
  return manualFeaturedJobs();
}

export async function mergeManualFeaturedJobsIntoListLive(jobs: SnapshotJob[]): Promise<SnapshotJob[]> {
  const manual = await activeManualFeaturedJobs();
  return mergeManualFeaturedJobsIntoList(jobs, manual);
}

export async function applyManualFeaturedToSnapshotLive(
  snapshot: PublicBoardSnapshot,
): Promise<PublicBoardSnapshot> {
  const manual = await activeManualFeaturedJobs();
  return applyManualFeaturedToSnapshot(snapshot, manual);
}

export { MICRO1_MANUAL_POST_ID };
