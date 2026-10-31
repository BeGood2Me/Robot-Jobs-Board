export type FeaturedSource = 'paid' | 'partner';

export type JobFeaturedFields = {
  featuredUntil?: string | Date | null;
  featuredSource?: FeaturedSource | null;
};

function featuredUntilMs(job: JobFeaturedFields): number | null {
  if (!job.featuredUntil) return null;
  const ms =
    typeof job.featuredUntil === 'string' ? Date.parse(job.featuredUntil) : job.featuredUntil.getTime();
  return Number.isFinite(ms) ? ms : null;
}

function featuredActive(job: JobFeaturedFields): boolean {
  const until = featuredUntilMs(job);
  return until !== null && until > Date.now();
}

/** Snapshot-only partner/referral slots (`featuredSource: partner`). */
export function isPartnerFeatured(job: JobFeaturedFields): boolean {
  return featuredActive(job) && job.featuredSource === 'partner';
}

/** Paid Stripe/Neon Featured (default when `featuredUntil` is set without partner source). */
export function isPaidFeatured(job: JobFeaturedFields): boolean {
  return featuredActive(job) && job.featuredSource !== 'partner';
}

/** Either paid or partner Featured — sorting, borders, etc. */
export function isJobFeatured(job: JobFeaturedFields): boolean {
  return featuredActive(job);
}

/** Employer $149 upsell — not for partner listings. */
export function isEmployerFeaturedUpsellEligible(job: JobFeaturedFields): boolean {
  return !isPartnerFeatured(job);
}
