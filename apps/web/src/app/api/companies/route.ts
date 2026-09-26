import { NextResponse } from 'next/server';
import { getSiteUrl, PUBLIC_REVALIDATE_SECONDS } from '@/lib/site';
import { loadPublicSnapshot } from '@/lib/snapshot/load';

export async function GET() {
  const snapshot = await loadPublicSnapshot();
  if (!snapshot) {
    return NextResponse.json({ error: 'Snapshot unavailable' }, { status: 503 });
  }

  const site = getSiteUrl();
  const companies = [...snapshot.companies]
    .sort((a, b) => b.openJobCount - a.openJobCount || a.name.localeCompare(b.name))
    .map((company) => ({
      id: company.id,
      name: company.name,
      slug: company.slug,
      website: company.website,
      openJobCount: company.openJobCount,
      pageUrl: `${site}/companies/${company.slug}`,
    }));

  return NextResponse.json(
    {
      generatedAt: snapshot.generatedAt,
      companies,
    },
    {
      headers: {
        'Cache-Control': `public, s-maxage=${PUBLIC_REVALIDATE_SECONDS}, stale-while-revalidate=86400`,
      },
    },
  );
}
