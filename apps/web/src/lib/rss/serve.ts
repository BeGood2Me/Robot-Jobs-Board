import type { FeedDescriptor } from './registry';
import { buildRssFeedXml, rssResponseHeaders } from './build-feed';
import { loadRssJobs } from './load-jobs';
import { getSiteUrl } from '@/lib/site';

export async function serveFeedXml(feed: FeedDescriptor): Promise<Response> {
  const source = await loadRssJobs({
    filter: feed.filter,
    companySlug: feed.companySlug,
    limit: feed.group === 'board' ? 100 : 75,
  });

  if (!source) {
    return new Response('Feed unavailable — snapshot not loaded yet.', { status: 503 });
  }

  const siteUrl = getSiteUrl();
  const publicSite = source.siteUrl || siteUrl;
  const xml = buildRssFeedXml({
    channelTitle: feed.title,
    channelDescription: feed.description,
    channelPageUrl: `${publicSite}${feed.pagePath}`,
    feedUrl: `${publicSite}${feed.feedPath}`,
    siteUrl: publicSite,
    jobs: source.jobs,
    lastBuild: source.generatedAt,
  });

  return new Response(xml, { headers: rssResponseHeaders() });
}