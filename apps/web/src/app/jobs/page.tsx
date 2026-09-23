import { permanentRedirect } from 'next/navigation';
import { filtersFromSearchParams, jobBoardHref } from '@/lib/jobs';

/**
 * Fallback if next.config `/jobs` → `/` redirect is skipped (e.g. local).
 * Prefer the config redirect in production — no Fluid Active CPU.
 */
export default async function JobsRedirectPage({ searchParams }: PageProps<'/jobs'>) {
  const params = await searchParams;
  permanentRedirect(jobBoardHref(filtersFromSearchParams(params)));
}
