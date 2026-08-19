import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SeoJobList } from '@/components/seo-job-list';
import { prisma, withDb } from '@/lib/db';
import { domainCopy, loadListing, parseDomainSlug } from '@/lib/programmatic';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/robots/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const domainSlug = parseDomainSlug(slug);
  const domain = domainSlug
    ? await withDb(() => prisma.robotDomain.findUnique({ where: { slug: domainSlug } }), null)
    : null;
  if (!domain) return { title: 'Robot jobs' };
  const listing = await loadListing({ robotDomains: { some: { domainId: domain.id } } });
  const copy = domainCopy(domain.name, domain.description);
  return {
    title: copy.title,
    description: copy.description,
    robots: listing.indexable ? undefined : { index: false, follow: true },
  };
}

export default async function DomainJobsPage({ params }: PageProps<'/robots/[slug]'>) {
  const { slug } = await params;
  const domainSlug = parseDomainSlug(slug);
  if (!domainSlug) notFound();
  const domain = await withDb(() => prisma.robotDomain.findUnique({ where: { slug: domainSlug } }), null);
  if (!domain) notFound();
  const listing = await loadListing({ robotDomains: { some: { domainId: domain.id } } });
  const copy = domainCopy(domain.name, domain.description);
  return <SeoJobList h1={copy.h1} intro={copy.intro} jobs={listing.jobs} indexable={listing.indexable} />;
}
