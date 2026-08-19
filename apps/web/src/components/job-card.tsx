import Link from 'next/link';
import { Clock, MapPin } from '@phosphor-icons/react/ssr';
import type { JobWithRelations } from '@/lib/jobs';
import { employmentLabel, formatPosted } from '@/lib/site';
import { SaveJobButton } from './save-job-button';

export function JobCard({ job }: { job: JobWithRelations }) {
  const href = `/jobs/${job.id}/${job.slug}`;
  const location =
    [
      job.isRemote ? 'Remote' : null,
      job.city && job.city !== 'Remote' ? job.city : null,
      job.country,
    ]
      .filter(Boolean)
      .join(', ') || job.locationRaw;
  const typeLabel = [
    employmentLabel(job.employmentType),
    job.workplaceType === 'HYBRID' && !job.isRemote ? 'Hybrid' : null,
  ]
    .filter(Boolean)
    .join(' \u00b7 ');

  return (
    <article className="rounded-2xl border border-line bg-card p-6 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_0_24px_rgba(94,234,212,0.08)]">
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold">
            <Link href={href} className="hover:text-accent">
              {job.title}
            </Link>
          </h2>
          <p className="mt-1 text-sm text-muted">
            <Link href={`/companies/${job.company.slug}`} className="hover:text-accent">
              {job.company.name}
            </Link>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted">
            <span className="inline-flex items-center gap-2">
              <MapPin size={16} className="text-accent" />
              {location}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock size={16} className="text-accent" />
              {typeLabel}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-2 md:items-end">
          <div className="flex items-center gap-2">
            <SaveJobButton jobId={job.id} title={job.title} />
            <Link
              href={href}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-3 text-base font-semibold text-accent-fg transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98]"
            >
              View job
            </Link>
          </div>
          <p className="font-mono text-xs text-muted md:text-right">{formatPosted(job.postedAt)}</p>
        </div>
      </div>
    </article>
  );
}

export function JobCardSkeleton() {
  return <div className="h-32 animate-pulse rounded-2xl bg-chip" />;
}
