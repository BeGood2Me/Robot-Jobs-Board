import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getGoneJobBySlug, getJobBySlug } from '@/lib/jobs';

export const revalidate = 14400;

type SlugParams = { params: Promise<{ slug: string }> };

/**
 * Legacy / shorthand URLs: /jobs/{slug} → /jobs/{id}/{slug}.
 * Google still has slug-only and incomplete links that 404 without this.
 */
export async function generateMetadata({ params }: SlugParams): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (job) {
    return {
      title: 'Redirecting…',
      robots: { index: false, follow: true },
    };
  }
  return {
    title: 'Job not found',
    robots: { index: false, follow: false },
  };
}

export default async function JobSlugRedirectPage({ params }: SlugParams) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (job) permanentRedirect(`/jobs/${job.id}/${job.slug}`);

  const gone = await getGoneJobBySlug(slug);
  if (gone) permanentRedirect(`/companies/${gone.company.slug}`);

  notFound();
}
