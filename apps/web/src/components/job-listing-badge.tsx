import { isPaidFeatured, isPartnerFeatured, type JobFeaturedFields } from '@/lib/is-featured';

/** Partner referral slots: Sponsored only. Paid employer placement: Featured only. */
export function JobListingBadge({
  job,
  className = '',
}: {
  job: JobFeaturedFields;
  className?: string;
}) {
  if (isPartnerFeatured(job)) {
    return (
      <p className={`text-xs font-semibold tracking-wide text-muted uppercase ${className}`.trim()}>
        Sponsored
      </p>
    );
  }
  if (isPaidFeatured(job)) {
    return (
      <p className={`text-xs font-semibold tracking-wide text-accent uppercase ${className}`.trim()}>
        Featured
      </p>
    );
  }
  return null;
}
