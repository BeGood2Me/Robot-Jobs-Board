import Link from 'next/link';
import { Suspense } from 'react';
import { JobBoardInteractive } from '@/components/job-board-interactive';
import { JobBoardShell } from '@/components/job-board-shell';
import { JobCard } from '@/components/job-card';
import { JobPagination } from '@/components/job-pagination';
import { NewsletterSignup } from '@/components/newsletter-signup';
import {
  filtersFromSearchParams,
  getCountryFacets,
  getTagFacets,
  getTaxonomy,
  jobBoardHref,
  searchJobs,
} from '@/lib/jobs';
import { homePageJsonLd } from '@/lib/jsonld';
import { getHomeMarginReferralOffer } from '@/lib/margin-referral';
import { MarginReferralAd } from '@/components/margin-referral-ad';
import { PAGE_SIZE } from '@/lib/site';

export async function JobBoard({
  params,
  showHomeMarginReferral = false,
}: {
  params: Record<string, string | string[] | undefined>;
  /** Homepage hero referral, desktop only (env-gated). */
  showHomeMarginReferral?: boolean;
}) {
  const filters = filtersFromSearchParams(params);
  const [{ jobs, total, page }, taxonomy, countries, tags] = await Promise.all([
    searchJobs(filters),
    getTaxonomy(),
    getCountryFacets(),
    getTagFacets(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filterOptions = {
    domains: taxonomy.domains.map((d) => ({ slug: d.slug, label: d.name })),
    tags,
    seniorities: taxonomy.seniorities.map((s) => ({ slug: s.slug, label: s.label })),
    countries,
  };
  const href = jobBoardHref(filters);
  const initialQuery = href.includes('?') ? href.slice(href.indexOf('?') + 1) : '';
  const marginReferral =
    showHomeMarginReferral ? getHomeMarginReferralOffer() : null;

  return (
    <div className="mx-auto max-w-6xl px-6 pt-8 pb-32 md:pt-16 md:pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homePageJsonLd()) }} />
      <div className="lg:flex lg:items-start lg:justify-between lg:gap-8">
        <div className="min-w-0">
          <h1 className="max-w-[680px] bg-gradient-to-r from-black to-[#666666] bg-clip-text text-3xl font-semibold text-balance text-transparent md:text-5xl dark:from-white dark:to-[#9B9B9B]">
            Robotics Jobs Board
          </h1>
          <p className="mt-2 max-w-[680px] text-pretty text-sm text-muted md:mt-3 md:text-base">
            Updated daily from public company ATS boards — US, UK, Canada, and remote.
          </p>
          <nav aria-label="Popular job hubs" className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <Link href="/locations/united-states-robotics-jobs" className="underline">
              US robotics jobs
            </Link>
            <Link href="/locations/united-kingdom-robotics-jobs" className="underline">
              UK robotics jobs
            </Link>
            <Link href="/locations/remote-robotics-jobs" className="underline">
              Remote robotics jobs
            </Link>
            <Link href="/locations/canada-robotics-jobs" className="underline">
              Canada robotics jobs
            </Link>
            <Link href="/companies" className="underline">
              Companies
            </Link>
          </nav>
        </div>
        {marginReferral ? <MarginReferralAd offer={marginReferral} layout="hero" /> : null}
      </div>

      <NewsletterSignup source="homepage" variant="hero" />

      <Suspense
        fallback={
          <JobBoardShell filters={filters} total={total} filterProps={{ filters, ...filterOptions }}>
            {jobs.length
              ? jobs.map((job) => <JobCard key={job.id} job={job} />)
              : null}
            <JobPagination page={page} pages={pages} hrefFor={(target) => jobBoardHref(filters, target)} />
            {marginReferral && pages > 1 ? (
              <MarginReferralAd offer={marginReferral} layout="mobileFooter" />
            ) : null}
          </JobBoardShell>
        }
      >
        <JobBoardInteractive
          initialQuery={initialQuery}
          initialFilters={filters}
          initialResult={{ jobs, total, page }}
          filterOptions={filterOptions}
          marginReferral={marginReferral}
        />
      </Suspense>
    </div>
  );
}
