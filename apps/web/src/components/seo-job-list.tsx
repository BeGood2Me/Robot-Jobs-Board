import Link from 'next/link';
import { JobCard } from '@/components/job-card';
import type { JobCardData } from '@/lib/jobs';
import { locationPageJsonLd } from '@/lib/jsonld';

const HUB_LINKS = [
  { href: '/locations/united-states-robotics-jobs', label: 'US robotics jobs' },
  { href: '/locations/united-kingdom-robotics-jobs', label: 'UK robotics jobs' },
  { href: '/locations/remote-robotics-jobs', label: 'Remote robotics jobs' },
  { href: '/locations/canada-robotics-jobs', label: 'Canada robotics jobs' },
  { href: '/companies', label: 'Companies' },
] as const;

export function SeoJobList({
  h1,
  intro,
  jobs,
  indexable,
  total,
  breadcrumbLabel,
  path,
  description,
}: {
  h1: string;
  intro: string;
  jobs: JobCardData[];
  indexable: boolean;
  total: number;
  breadcrumbLabel: string;
  path: string;
  description: string;
}) {
  const related = HUB_LINKS.filter((link) => link.href !== path);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            locationPageJsonLd({
              label: breadcrumbLabel,
              path,
              description,
              total,
              jobs: jobs.map((job) => ({ id: job.id, slug: job.slug, title: job.title })),
            }),
          ),
        }}
      />
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap gap-2">
          <li>
            <Link href="/" className="underline">
              Robotics jobs
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-foreground">{breadcrumbLabel}</li>
        </ol>
      </nav>
      <h1 className="mt-6 max-w-[680px] text-4xl font-semibold">{h1}</h1>
      <p className="mt-3 font-mono text-sm text-muted">
        {total} open role{total === 1 ? '' : 's'}
        {indexable ? ' · Updated from public company ATS boards' : null}
      </p>
      <p className="mt-6 max-w-[680px] text-muted">{intro}</p>
      {!indexable ? (
        <p className="mt-4 font-mono text-xs text-muted">
          Fewer than five live jobs. This page is not indexed yet.
        </p>
      ) : null}
      <div className="mt-10 grid gap-4">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
        {!jobs.length ? <p className="text-muted">No live jobs for this page right now.</p> : null}
      </div>
      <nav aria-label="Related job hubs" className="mt-16 border-t border-line pt-10">
        <h2 className="text-xl font-semibold">Related robotics job hubs</h2>
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <li>
            <Link href="/" className="underline">
              Robotics jobs board
            </Link>
          </li>
          {related.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="underline">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
