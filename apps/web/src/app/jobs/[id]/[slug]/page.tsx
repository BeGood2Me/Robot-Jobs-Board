import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { directApplyUrl } from '@robot-jobs-board/ingestion/apply-url';
import { JobCard } from '@/components/job-card';
import { jobPostingJsonLd } from '@/lib/jsonld';
import { getJobById, relatedJobs } from '@/lib/jobs';
import { sanitizeJobHtml } from '@/lib/sanitize';
import { employmentLabel, formatPosted, seniorityLabel, workplaceLabel } from '@/lib/site';

export const revalidate = 900;

export async function generateMetadata({ params }: PageProps<'/jobs/[id]/[slug]'>): Promise<Metadata> {
  const { id } = await params;
  const job = await getJobById(id);
  if (!job || job.isHidden) return { title: 'Job not found' };
  return {
    title: `${job.title} at ${job.company.name}`,
    description: job.descriptionPlain.slice(0, 160),
  };
}

function ApplyNowLink({ href, className }: { href: string; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        'inline-flex h-10 items-center rounded-lg bg-accent px-3 text-base font-semibold text-accent-fg transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98]'
      }
    >
      Apply now
    </a>
  );
}

export default async function JobDetailPage({ params }: PageProps<'/jobs/[id]/[slug]'>) {
  const { id, slug } = await params;
  const job = await getJobById(id);
  if (!job || job.isHidden) notFound();
  if (job.slug !== slug) permanentRedirect(`/jobs/${job.id}/${job.slug}`);

  const related = await relatedJobs(job);
  const html = sanitizeJobHtml(job.descriptionHtml || `<p>${job.descriptionPlain}</p>`);
  const applyHref = directApplyUrl(job);
  const facts = [
    job.locationRaw,
    workplaceLabel(job.workplaceType, job.isRemote),
    employmentLabel(job.employmentType),
    job.department,
    job.compensationText,
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd(job)) }} />
      <p className="text-sm">
        <Link href={`/companies/${job.company.slug}`} className="text-muted hover:text-accent">
          {job.company.name}
        </Link>
      </p>
      <h1 className="mt-2 max-w-[680px] text-4xl font-semibold">{job.title}</h1>
      <p className="mt-4 text-muted">{facts.join(' · ')}</p>
      <p className="mt-2 font-mono text-xs text-muted">{formatPosted(job.postedAt)}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {job.robotDomains.map(({ domain }) => (
          <Link key={domain.id} href={`/?domain=${domain.slug}`} className="rounded-lg bg-chip px-3 py-1 text-sm">
            {domain.name}
          </Link>
        ))}
        {job.techTags.map(({ techTag }) => (
          <Link
            key={techTag.id}
            href={`/?tag=${techTag.slug}`}
            className="rounded-lg border border-line px-3 py-1 text-sm"
          >
            {techTag.label}
          </Link>
        ))}
        {job.seniorities.map(({ seniority }) => (
          <Link
            key={seniority.id}
            href={seniority.slug === 'junior' ? '/?entry=1' : `/?seniority=${seniority.slug}`}
            className="rounded-lg bg-chip px-3 py-1 text-sm"
          >
            {seniorityLabel(seniority.slug, seniority.label)}
          </Link>
        ))}
      </div>
      <div className="mt-8">
        <ApplyNowLink href={applyHref} />
      </div>
      <article className="job-html mt-12 max-w-3xl" dangerouslySetInnerHTML={{ __html: html }} />
      <div className="mt-12">
        <ApplyNowLink href={applyHref} />
      </div>
      <section className="mt-16">
        <h2 className="text-2xl font-semibold">Related jobs</h2>
        <div className="mt-6 grid gap-4">
          {related.map((item) => (
            <JobCard key={item.id} job={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
