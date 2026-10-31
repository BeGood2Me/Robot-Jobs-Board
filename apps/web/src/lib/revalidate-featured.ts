import { revalidatePath, revalidateTag } from 'next/cache';
import { expireFeaturedOverlayCache, FEATURED_OVERLAY_CACHE_TAG } from '@/lib/featured-overlay';

export async function revalidateFeaturedSurfaces(job: { jobId: string; jobSlug: string }) {
  revalidatePath('/');
  revalidatePath('/jobs');
  revalidatePath(`/jobs/${job.jobId}/${job.jobSlug}`);
  revalidateTag(FEATURED_OVERLAY_CACHE_TAG, { expire: 0 });
  await expireFeaturedOverlayCache();
}
