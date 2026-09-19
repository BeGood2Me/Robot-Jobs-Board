import type { Metadata } from 'next';
import { JobBoard } from '@/components/job-board';
import { filtersFromSearchParams, isDefaultBoardListing } from '@/lib/job-filter-utils';
import { loadPublicSnapshot } from '@/lib/snapshot/load';

/** Filtered homepage queries — rewritten from `/?…` so `/` stays ISR-cached. */
export const dynamic = 'force-dynamic';

type BoardSearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: BoardSearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const filters = filtersFromSearchParams(params);
  const indexable = isDefaultBoardListing(filters);
  const snapshot = await loadPublicSnapshot();
  const count = snapshot?.jobs.length ?? 0;
  const countLabel = count > 0 ? `${count.toLocaleString('en-US')} open roles. ` : '';
  const title = 'Robotics jobs board';
  const description =
    `${countLabel}Robotics jobs board for engineers and technicians — US, UK, Canada, and remote. Updated daily from company ATS boards; filter by robot type and apply on the original posting.`.slice(
      0,
      160,
    );

  return {
    title,
    description,
    alternates: { canonical: '/' },
    robots: indexable ? undefined : { index: false, follow: true },
  };
}

export default async function FilteredBoardPage({
  searchParams,
}: {
  searchParams: BoardSearchParams;
}) {
  const params = await searchParams;
  return <JobBoard params={params} />;
}
