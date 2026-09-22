import { NextResponse } from 'next/server';
import { getCountryFacets, getTagFacets, getTaxonomy } from '@/lib/jobs';
import { loadPublicSnapshot } from '@/lib/snapshot/load';

export async function GET() {
  const [taxonomy, tags, countries, snapshot] = await Promise.all([
    getTaxonomy(),
    getTagFacets(),
    getCountryFacets(),
    loadPublicSnapshot(),
  ]);

  return NextResponse.json({
    generatedAt: snapshot?.generatedAt ?? null,
    jobCount: snapshot?.jobs.length ?? null,
    companyCount: snapshot?.companies.length ?? null,
    domains: snapshot
      ? snapshot.domains
          .filter((domain) => domain.openJobCount > 0)
          .map(({ slug, name, openJobCount, description }) => ({
            slug,
            name,
            count: openJobCount,
            description,
          }))
      : taxonomy.domains.map((domain) => ({
          slug: domain.slug,
          name: domain.name,
          count: null as number | null,
          description: null as string | null,
        })),
    tags,
    seniorities: taxonomy.seniorities.map(({ slug, label }) => ({ slug, label })),
    countries,
    workplaces: ['ONSITE', 'HYBRID', 'REMOTE'],
    employments: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'TEMPORARY'],
    internshipTracks: [
      { slug: 'ug', label: 'Undergraduate' },
      { slug: 'pg', label: "Master's / postgraduate" },
      { slug: 'phd', label: 'PhD' },
    ],
  });
}
