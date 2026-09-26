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
import { domainStaticParams } from '@/lib/snapshot/static-params';

export const revalidate = 14400;
export const dynamicParams = false;

export function generateStaticParams() {
  return domainStaticParams();
}

export async function generateMetadata({ params }: PageProps<'/robots/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const domainSlug = parseDomainSlug(slug);
  const domain = domainSlug ? await getDomainBySlug(domainSlug) : null;
  if (!domain) return { title: 'Robot jobs' };
  const filter = { kind: 'domain' as const, domainId: domain.id };
  const indexable = await listingIsIndexable(filter, `domain-${domain.id}`);
  const copy = domainCopy(domain.name, domain.description);
  const canonical = `/robots/${slug}`;
  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical },
    robots: indexable ? undefined : { index: false, follow: true },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: canonical,
      type: 'website',
    },
  };
}

export default async function DomainJobsPage({ params }: PageProps<'/robots/[slug]'>) {
  const { slug } = await params;
  const domainSlug = parseDomainSlug(slug);
  if (!domainSlug) notFound();
  const domain = await getDomainBySlug(domainSlug);
  if (!domain) notFound();
  const filter = { kind: 'domain' as const, domainId: domain.id };
  const listing = await loadListing(filter, `domain-${domain.id}`);
  const copy = domainCopy(domain.name, domain.description);
  const path = `/robots/${slug}`;
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
    />
  );
}
