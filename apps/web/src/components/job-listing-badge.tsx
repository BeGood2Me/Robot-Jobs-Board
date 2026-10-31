import { isJobFeatured, type JobFeaturedFields } from '@/lib/is-featured';

export function JobListingBadge({
  job,
  className = '',
}: {
  job: JobFeaturedFields;
  className?: string;
}) {
  if (!isJobFeatured(job)) return null;
  return (
    <p
      className={`mb-1 text-xs font-semibold tracking-wide text-accent uppercase ${className}`.trim()}
    >
      Featured
    </p>
  );
}
