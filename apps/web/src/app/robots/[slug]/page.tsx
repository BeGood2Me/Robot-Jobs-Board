import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SeoJobList } from '@/components/seo-job-list';
import {
  domainCopy,
  getDomainBySlug,
  listingIsIndexable,
  loadListing,
  parseDomainSlug,
} from '@/lib/programmatic';

export const revalidate = 900;

export async function generateMetadata({ params }: PageProps<'/robots/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const domainSlug = parseDomainSlug(slug);
  const domain = domainSlug ? await getDomainBySlug(domainSlug) : null;
  if (!domain) return { title: 'Robot jobs' };
  const where = { robotDomains: { some: { domainId: domain.id } } };
  const indexable = await listingIsIndexable(where, `domain-${domain.id}`);
  const copy = domainCopy(domain.name, domain.description);
  return {
    title: copy.title,
    description: copy.description,
    robots: indexable ? undefined : { index: false, follow: true },
  };
}

export default async function DomainJobsPage({ params }: PageProps<'/robots/[slug]'>) {
  const { slug } = await params;
  const domainSlug = parseDomainSlug(slug);
  if (!domainSlug) notFound();
  const domain = await getDomainBySlug(domainSlug);
  if (!domain) notFound();
  const where = { robotDomains: { some: { domainId: domain.id } } };
  const listing = await loadListing(where, `domain-${domain.id}`);
  const copy = domainCopy(domain.name, domain.description);
  return <SeoJobList h1={copy.h1} intro={copy.intro} jobs={listing.jobs} indexable={listing.indexable} />;
}
