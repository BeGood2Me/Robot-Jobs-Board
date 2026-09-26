import { NextResponse } from 'next/server';
import { apiRateLimitResponse } from '@/lib/api-rate-limit';
import { filtersFromSearchParams, searchJobs } from '@/lib/jobs';
import { PUBLIC_REVALIDATE_SECONDS } from '@/lib/site';

function paramsFromUrl(url: URL): Record<string, string | string[] | undefined> {
  const params: Record<string, string | string[]> = {};
  for (const key of new Set(url.searchParams.keys())) {
    const values = url.searchParams.getAll(key);
    params[key] = values.length > 1 ? values : values[0];
  }
  return params;
}

export async function GET(request: Request) {
  const limited = apiRateLimitResponse(request, { name: 'jobs', limit: 90 });
  if (limited) return limited;

  const url = new URL(request.url);
  const result = await searchJobs(filtersFromSearchParams(paramsFromUrl(url)));
  return NextResponse.json(result, {
    headers: {
      'Cache-Control': `public, s-maxage=${PUBLIC_REVALIDATE_SECONDS}, stale-while-revalidate=86400`,
    },
  });
}
