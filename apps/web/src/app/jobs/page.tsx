import { redirect } from 'next/navigation';
import { filtersFromSearchParams, jobBoardHref } from '@/lib/jobs';

export const dynamic = 'force-dynamic';

export default async function JobsRedirectPage({ searchParams }: PageProps<'/jobs'>) {
  const params = await searchParams;
  redirect(jobBoardHref(filtersFromSearchParams(params)));
}
