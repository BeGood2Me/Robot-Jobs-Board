import type { Metadata } from 'next';
import { rssFeedUrlForPagePath } from './registry';
import { getSiteUrl } from '@/lib/site';

export function mergeRssAlternates(canonical: string): NonNullable<Metadata['alternates']> {
  const feedPath = rssFeedUrlForPagePath(canonical);
  if (!feedPath) return { canonical };
  const site = getSiteUrl();
  return {
    canonical,
    types: {
      'application/rss+xml': `${site}${feedPath}`,
    },
  };
}