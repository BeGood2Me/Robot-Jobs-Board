import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SeoJobList } from '@/components/seo-job-list';
import { prisma, withDb } from '@/lib/db';
import { loadListing, parseSkillSlug, skillCopy } from '@/lib/programmatic';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/skills/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const tagSlug = parseSkillSlug(slug);
  const tag = tagSlug ? await withDb(() => prisma.techTag.findUnique({ where: { slug: tagSlug } }), null) : null;
  if (!tag) return { title: 'Skill jobs' };
  const listing = await loadListing({ techTags: { some: { techTagId: tag.id } } });
  const copy = skillCopy(tag.label);
  return {
    title: copy.title,
    description: copy.description,
    robots: listing.indexable ? undefined : { index: false, follow: true },
  };
}

export default async function SkillJobsPage({ params }: PageProps<'/skills/[slug]'>) {
  const { slug } = await params;
  const tagSlug = parseSkillSlug(slug);
  if (!tagSlug) notFound();
  const tag = await withDb(() => prisma.techTag.findUnique({ where: { slug: tagSlug } }), null);
  if (!tag) notFound();
  const listing = await loadListing({ techTags: { some: { techTagId: tag.id } } });
  const copy = skillCopy(tag.label);
  return <SeoJobList h1={copy.h1} intro={copy.intro} jobs={listing.jobs} indexable={listing.indexable} />;
}
