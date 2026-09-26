import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JobCard } from '@/components/job-card';
import { JobPagination } from '@/components/job-pagination';
import {
  getCompanyBySlug,
  getCompanyJobsPage,
  getRelatedCompanies,
} from '@/lib/jobs';
import { companyPageJsonLd } from '@/lib/jsonld';
import { companyPageDescription, companyPageIntro, companyPageTitle } from '@/lib/seo';
import { companyStaticParams } from '@/lib/snapshot/static-params';
import { formatPosted, PAGE_SIZE } from '@/lib/site';

export const revalidate = 14400;
/** New companies appear via ingest/CDN without a rebuild — allow slugs beyond build-time static params. */
export const dynamicParams = true;

export function generateStaticParams() {
  return companyStaticParams();
}

function companyJobsHref(slug: string, page = 1) {
  return page > 1 ? `/companies/${slug}?page=${page}` : `/companies/${slug}`;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<'/companies/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(typeof sp.page === 'string' ? sp.page : 1) || 1);
  const company = await getCompanyBySlug(slug);
  if (!company) return { title: 'Company not found' };
  const { total } = await getCompanyJobsPage(company.id, 1);
  const title = companyPageTitle(company.name, total);
  const description = companyPageDescription(
    company.name,
    total,
    company.description,
    company.seoIntro,
  );
  const canonical = `/companies/${slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    robots: total < 1 || page > 1 ? { index: false, follow: true } : undefined,
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

export default async function CompanyPage({
  params,
  searchParams,
}: PageProps<'/companies/[slug]'>) {
  const { slug } = await params;
  const sp = await searchParams;
  const requestedPage = Math.max(1, Number(typeof sp.page === 'string' ? sp.page : 1) || 1);

  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const [{ total, jobs }, related] = await Promise.all([
    getCompanyJobsPage(company.id, requestedPage),
    getRelatedCompanies(slug, 5),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, pages);
  const newestPosted = jobs[0]?.postedAt ?? null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            companyPageJsonLd({
              ...company,
              seoIntro: company.seoIntro,
              jobs,
              total,
              page,
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
        {companyPageTitle(company.name, total)}
      </h1>
      <p className="mt-3 font-mono text-sm text-muted">
        {total} open job{total === 1 ? '' : 's'}
        {newestPosted ? ` · ${formatPosted(newestPosted)}` : null}
      </p>
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
      <p className="mt-6 max-w-[680px] text-pretty text-muted">
        {companyPageIntro(company.name, total, company.description, company.seoIntro)}
      </p>
      <div className="mt-8 grid gap-4">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
        {!jobs.length ? <p className="text-muted">No open jobs at {company.name} right now.</p> : null}
      </div>
      <JobPagination page={page} pages={pages} hrefFor={(target) => companyJobsHref(slug, target)} />
      {related.length ? (
        <section className="mt-16 border-t border-line pt-10">
          <h2 className="text-xl font-semibold">Also hiring in robotics</h2>
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {related.map((peer) => (
              <li key={peer.slug}>
                <Link href={`/companies/${peer.slug}`} className="underline">
                  {peer.name} jobs
                </Link>
                <span className="text-muted"> ({peer.openJobCount})</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
