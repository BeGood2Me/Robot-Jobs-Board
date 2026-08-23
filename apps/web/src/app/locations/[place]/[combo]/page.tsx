import type { ListingFilter } from '@robot-jobs-board/snapshot';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SeoJobList } from '@/components/seo-job-list';
import {
  getDomainBySlug,
  getTagBySlug,
  listingIsIndexable,
  loadListing,
  resolvePlace,
} from '@/lib/programmatic';

export const revalidate = 14400;

async function resolveCombo(place: string, combo: string) {
  const resolved = await resolvePlace(place);
  if (!resolved) return null;

  const domainMatch = combo.match(/^([a-z0-9-]+)-jobs$/);
  const skillMatch = combo.match(/^([a-z0-9-]+)-robotics-jobs$/);
  let extra: ListingFilter | null = null;
  let label = resolved.label;
  let introFocus = 'robotics';
  let cacheKey = `combo-${place}-${combo}`;

  if (skillMatch) {
    const tag = await getTagBySlug(skillMatch[1]);
    if (!tag) return null;
    extra = { kind: 'tag', tagId: tag.id };
    label = `${tag.label} robotics jobs in ${resolved.label}`;
    introFocus = tag.label;
    cacheKey = `combo-tag-${place}-${tag.id}`;
  } else if (domainMatch) {
    const domain = await getDomainBySlug(domainMatch[1]);
    if (!domain) return null;
    extra = { kind: 'domain', domainId: domain.id };
    label = `${domain.name} jobs in ${resolved.label}`;
    introFocus = domain.name;
    cacheKey = `combo-domain-${place}-${domain.id}`;
  } else {
    return null;
  }

  return {
    filter: { kind: 'and' as const, filters: [resolved.filter, extra] },
    h1: label,
    introFocus,
    placeLabel: resolved.label,
    cacheKey,
  };
}

export async function generateMetadata({
  params,
}: PageProps<'/locations/[place]/[combo]'>): Promise<Metadata> {
  const { place, combo } = await params;
  const resolved = await resolveCombo(place, combo);
  if (!resolved) return { title: 'Robotics jobs' };
  const indexable = await listingIsIndexable(resolved.filter, `${resolved.cacheKey}-meta`);
  return {
    title: resolved.h1,
    description: `Open ${resolved.introFocus} jobs in ${resolved.placeLabel}.`,
    robots: indexable ? undefined : { index: false, follow: true },
  };
}

export default async function ComboJobsPage({ params }: PageProps<'/locations/[place]/[combo]'>) {
  const { place, combo } = await params;
  const resolved = await resolveCombo(place, combo);
  if (!resolved) notFound();
  const listing = await loadListing(resolved.filter, resolved.cacheKey);
  return (
    <SeoJobList
      h1={resolved.h1}
      intro={`This combination page lists ${resolved.introFocus} jobs tied to ${resolved.placeLabel}. Use it when you already know both the robot type or stack and the city. Typical work mixes software (often C++ or Python) with on site bring up for hardware programs. Apply on the original ATS listing from each card. If the set is still small, widen to the location or domain page.`}
      jobs={listing.jobs}
      indexable={listing.indexable}
    />
  );
}
