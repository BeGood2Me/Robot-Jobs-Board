import type { FeedDescriptor } from './registry';
import { buildEmptyRssFeedXml, buildRssFeedXml, rssResponseHeaders } from './build-feed';
import { loadRssJobs } from './load-jobs';
import { getSiteUrl } from '@/lib/site';

export async function serveFeedXml(feed: FeedDescriptor): Promise<Response> {
  const source = await loadRssJobs({
    filter: feed.filter,
    companySlug: feed.companySlug,
    limit: feed.group === 'board' ? 100 : 75,
  });

  if (!source) {
    const siteUrl = getSiteUrl();
    const xml = buildEmptyRssFeedXml({
      channelTitle: feed.title,
      channelDescription: feed.description,
      channelPageUrl: `${siteUrl}${feed.pagePath}`,
      feedUrl: `${siteUrl}${feed.feedPath}`,
      siteUrl,
    });
    return new Response(xml, { headers: rssResponseHeaders() });
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