import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JobCard } from '@/components/job-card';
import { JobPagination } from '@/components/job-pagination';
import { getCompanyBySlug, getCompanyJobsPage } from '@/lib/jobs';
import { companyPageJsonLd } from '@/lib/jsonld';
import { PAGE_SIZE, PUBLIC_REVALIDATE_SECONDS } from '@/lib/site';

export const revalidate = PUBLIC_REVALIDATE_SECONDS;

function companyJobsHref(slug: string, page = 1) {
  return page > 1 ? `/companies/${slug}?page=${page}` : `/companies/${slug}`;
}

export async function generateMetadata({ params }: PageProps<'/companies/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) return { title: 'Company not found' };
  const { total } = await getCompanyJobsPage(company.id, 1);
  return {
    title: `${company.name} robotics jobs`,
    description: `${total} open robotics job${total === 1 ? '' : 's'} at ${company.name}. ${company.description}`.slice(
      0,
      160,
    ),
    alternates: { canonical: `/companies/${slug}` },
    openGraph: {
      title: `${company.name} robotics jobs`,
      description: company.description.slice(0, 160),
      url: `/companies/${slug}`,
      type: 'website',
    },
  };
}

export default async function CompanyPage({
  params,
  searchParams,
}: PageProps<'/companies/[slug]'>) {
  const { slug } = await params;
  const sp = await searchParams;
  const requestedPage = Math.max(1, Number(typeof sp.page === 'string' ? sp.page : 1) || 1);

  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const { total, jobs } = await getCompanyJobsPage(company.id, requestedPage);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, pages);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(companyPageJsonLd({ ...company, jobs, total, page })) }}
      />
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap gap-2">
          <li>
            <Link href="/" className="underline">
              Robotics jobs
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/companies" className="underline">
              Companies
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-foreground">{company.name}</li>
        </ol>
      </nav>
      <h1 className="mt-6 max-w-[680px] text-4xl font-semibold text-balance">
        {company.name} robotics jobs
      </h1>
      {company.website ? (
        <a
          href={company.website}
          className="mt-3 inline-block text-sm underline"
          rel="noopener noreferrer"
          target="_blank"
        >
          Company website
        </a>
      ) : null}
      <p className="mt-6 max-w-[680px] text-pretty text-muted">{company.seoIntro || company.description}</p>
      <p className="mt-8 font-mono text-sm text-muted">
        {total} open job{total === 1 ? '' : 's'}
      </p>
      <div className="mt-4 grid gap-4">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
        {!jobs.length ? <p className="text-muted">No open jobs at {company.name} right now.</p> : null}
      </div>
      <JobPagination page={page} pages={pages} hrefFor={(target) => companyJobsHref(slug, target)} />
    </div>
  );
}
