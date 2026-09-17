import type { Metadata } from 'next';
import { JobBoard } from '@/components/job-board';
import { filtersFromSearchParams, isDefaultBoardListing } from '@/lib/job-filter-utils';

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

  return {
    title: 'Robotics jobs board',
    description:
      'Robotics jobs board with open roles in the United States, United Kingdom, Canada, Australia, and Europe. Filter by location, robot type, and experience, then apply on the original posting.',
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
