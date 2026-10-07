/** Client-safe Featured check (no Node/Prisma imports). */
export function isJobFeatured(job: { featuredUntil?: string | Date | null }): boolean {
  if (!job.featuredUntil) return false;
  const until =
    typeof job.featuredUntil === 'string' ? Date.parse(job.featuredUntil) : job.featuredUntil.getTime();
  return Number.isFinite(until) && until > Date.now();
}
