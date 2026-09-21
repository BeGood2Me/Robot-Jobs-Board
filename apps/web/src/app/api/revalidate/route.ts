import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { cronAuthorized } from '@/lib/admin';
import { clearSnapshotMemoryCache, PUBLIC_BOARD_CACHE_TAG } from '@/lib/snapshot/load';

export const dynamic = 'force-dynamic';

/**
 * Bust Next.js Data Cache after ingest deploys a new board.json.gz.
 * Auth: Authorization Bearer $CRON_SECRET (same as Vercel cron).
 */
export async function POST(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  clearSnapshotMemoryCache();
  // expire: 0 — ingest must not serve stale-while-revalidate board bytes (new company 404s).
  revalidateTag(PUBLIC_BOARD_CACHE_TAG, { expire: 0 });
  revalidatePath('/', 'layout');
  revalidatePath('/board');
  revalidatePath('/companies');
  revalidatePath('/companies/[slug]', 'page');
  revalidatePath('/robots');
  revalidatePath('/robots/[slug]', 'page');
  revalidatePath('/locations');
  revalidatePath('/api/jobs');
  revalidatePath('/api/facets');
  revalidatePath('/api/companies');

  return NextResponse.json({ ok: true, tag: PUBLIC_BOARD_CACHE_TAG });
}
