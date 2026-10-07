import { revalidatePath, revalidateTag } from 'next/cache';

export function revalidateFeaturedSurfaces(job: { jobId: string; jobSlug: string }) {
  revalidatePath('/');
  revalidatePath('/jobs');
  revalidatePath(`/jobs/${job.jobId}/${job.jobSlug}`);
  revalidateTag('featured-overlay-v1', { expire: 0 });
}
