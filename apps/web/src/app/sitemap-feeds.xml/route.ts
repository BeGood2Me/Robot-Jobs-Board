import { listPublicFeeds } from '@/lib/rss/registry';
import { snapshotXmlHeaders } from '@/lib/snapshot/sitemap';
import { getSiteUrl } from '@/lib/site';

export const revalidate = 86400;

function urlset(urls: string[], lastmod: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}
</urlset>`;
}

export async function GET() {
  const site = getSiteUrl();
  const feeds = (await listPublicFeeds()) ?? [];
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = [`${site}/rss`, ...feeds.map((feed) => `${site}${feed.feedPath}`)];
  return new Response(urlset(urls, lastmod), { headers: snapshotXmlHeaders() });
}