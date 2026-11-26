import { buildEmptyRssFeedXml, rssResponseHeaders } from '@/lib/rss/build-feed';
import { resolveFeedByInternalParts } from '@/lib/rss/registry';
import { serveFeedXml } from '@/lib/rss/serve';
import { getSiteUrl } from '@/lib/site';

export const revalidate = 86400;

export async function GET(_request: Request, { params }: { params: Promise<{ parts: string[] }> }) {
  const { parts } = await params;
  const resolved = await resolveFeedByInternalParts(parts);

  if (resolved === 'no_snapshot') {
    const site = getSiteUrl();
    const xml = buildEmptyRssFeedXml({
      channelTitle: 'Robot Jobs Board feeds',
      channelDescription: 'Robotics job RSS feeds — snapshot loading.',
      channelPageUrl: `${site}/rss`,
      feedUrl: `${site}/robotics-jobs.rss`,
      siteUrl: site,
    });
    return new Response(xml, { headers: rssResponseHeaders() });
  }
  if (resolved === 'not_found') {
    return new Response('Feed not found.', { status: 404, headers: { 'X-Robots-Tag': 'noindex, nofollow' } });
  }

  return serveFeedXml(resolved);
}