import { snapshotXmlHeaders } from '@/lib/snapshot/sitemap';
import { getSiteUrl } from '@/lib/site';

export const revalidate = 86400;

function urlset(urls: string[], lastmod: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}
</urlset>`;
}

/**
 * HTML discovery only — do not list `*.rss` URLs here. GSC treats sitemap URLs as
 * web pages; mass-submitting feed XML caused "Blocked due to other 4xx issue".
 * Feed endpoints stay on `link rel="alternate"`, /rss hub, and llms.txt.
 */
export async function GET() {
  const site = getSiteUrl();
  const lastmod = new Date().toISOString().slice(0, 10);
  return new Response(urlset([`${site}/rss`], lastmod), { headers: snapshotXmlHeaders() });
}