import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { directApplyUrl } from '@robot-jobs-board/ingestion/apply-url';
import { ApplyNowLink } from '@/components/apply-now-link';
import { JobCard } from '@/components/job-card';
import { jobPostingJsonLd } from '@/lib/jsonld';
import { getJobById, getGoneJobById, relatedJobs } from '@/lib/jobs';
import { sanitizeJobHtml } from '@/lib/sanitize';
import { jobPageDescription, jobPagePath, jobPageTitle } from '@/lib/seo';
import { employmentLabel, formatPosted, seniorityLabel, workplaceLabel } from '@/lib/site';

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps<'/jobs/[id]/[slug]'>): Promise<Metadata> {
  const { id, slug } = await params;
  const job = await getJobById(id, slug);
  if (job) {
    const canonical = jobPagePath(job);
    const title = jobPageTitle(job);
    const description = jobPageDescription(job);
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: canonical,
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title,
        description,
      },
    };
  }

  const gone = await getGoneJobById(id);
  if (gone) {
    return {
      title: `${gone.title} – Job closed`,
      robots: { index: false, follow: true },
    };
  }

  return {
    title: 'Job not found',
    robots: { index: false, follow: false },
  };
}

export default async function JobDetailPage({ params }: PageProps<'/jobs/[id]/[slug]'>) {
  const { id, slug } = await params;
  const job = await getJobById(id, slug);
  if (!job) {
    const gone = await getGoneJobById(id);
    if (gone) permanentRedirect(`/companies/${gone.company.slug}`);
    notFound();
  }
  if (job.slug !== slug || job.id !== id) permanentRedirect(`/jobs/${job.id}/${job.slug}`);

  const related = await relatedJobs(job);
  const html = sanitizeJobHtml(job.descriptionHtml || `<p>${job.descriptionPlain}</p>`);
  const applyHref = directApplyUrl(job);
  const applyProps = {
    href: applyHref,
    jobId: job.id,
    jobTitle: job.title,
    companySlug: job.company.slug,
    companyName: job.company.name,
  };
  const facts = [
    job.locationRaw,
    workplaceLabel(job.workplaceType, job.isRemote),
    employmentLabel(job.employmentType),
    job.department,
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
      {job.compensationText ? (
        <p className="mt-2 text-base font-medium text-foreground">{job.compensationText}</p>
      ) : null}
      <p className="mt-2 font-mono text-xs text-muted">{formatPosted(job.postedAt)}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {job.robotDomains.map(({ domain }) => (
          <Link key={domain.id} href={`/robots/${domain.slug}-jobs`} className="rounded-lg bg-chip px-3 py-1 text-sm">
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
        <ApplyNowLink {...applyProps} />
      </div>
      <article className="job-html mt-12 max-w-3xl" dangerouslySetInnerHTML={{ __html: html }} />
      <div className="mt-12">
        <ApplyNowLink {...applyProps} />
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
