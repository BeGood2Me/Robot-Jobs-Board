import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SeoJobList } from '@/components/seo-job-list';
import { listingIsIndexable, loadListing, locationPageCopy, resolvePlace } from '@/lib/programmatic';
import { loadHubFacets } from '@/lib/hub-facets';
import { mergeRssAlternates } from '@/lib/rss/metadata';
import { placeStaticParams } from '@/lib/snapshot/static-params';

const FACET_PLACE_SLUGS = new Set(['united-states']);

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return placeStaticParams();
}

function parsePlaceParam(slug: string): string | null {
  const match = slug.match(/^([a-z0-9-]+)-robotics-jobs$/);
  return match?.[1] ?? null;
}

export async function generateMetadata({ params }: PageProps<'/locations/[place]'>): Promise<Metadata> {
  const { place: raw } = await params;
  const place = parsePlaceParam(raw);
  if (!place) return { title: 'Location jobs' };
  const resolved = await resolvePlace(place);
  if (!resolved) return { title: 'Location jobs' };
  const listing = await loadListing(resolved.filter, `place-${place}`);
  const copy = locationPageCopy(place, resolved.label, listing.total);
  const indexable = listing.indexable || (await listingIsIndexable(resolved.filter, `place-${place}`));
  const canonical = `/locations/${raw}`;
  return {
    title: copy.title,
    description: copy.description,
    alternates: indexable ? mergeRssAlternates(canonical) : { canonical },
    robots: indexable ? undefined : { index: false, follow: true },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: canonical,
      type: 'website',
    },
  };
}

export default async function LocationJobsPage({ params }: PageProps<'/locations/[place]'>) {
  const { place: raw } = await params;
  const place = parsePlaceParam(raw);
  if (!place) notFound();
  const resolved = await resolvePlace(place);
  if (!resolved) notFound();
  const listing = await loadListing(resolved.filter, `place-${place}`);
  const copy = locationPageCopy(place, resolved.label, listing.total);
  const path = `/locations/${raw}`;
  const facets =
    place && FACET_PLACE_SLUGS.has(place)
      ? await loadHubFacets(resolved.filter, { showCities: true })
      : undefined;
  return (
    <SeoJobList
      h1={copy.h1}
      intro={copy.intro}
      jobs={listing.jobs}
      indexable={listing.indexable}
      total={listing.total}
      breadcrumbLabel={copy.h1}
      path={path}
      description={copy.description}
      facets={facets}
    />
  );
}
