import { NextResponse } from 'next/server';
import { filtersFromSearchParams, searchJobs } from '@/lib/jobs';

function paramsFromUrl(url: URL): Record<string, string | string[] | undefined> {
  const params: Record<string, string | string[]> = {};
  for (const key of new Set(url.searchParams.keys())) {
    const values = url.searchParams.getAll(key);
    params[key] = values.length > 1 ? values : values[0];
  }
  return params;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const result = await searchJobs(filtersFromSearchParams(paramsFromUrl(url)));
  return NextResponse.json(result);
}
