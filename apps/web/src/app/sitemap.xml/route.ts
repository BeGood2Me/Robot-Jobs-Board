import { getSiteUrl } from '@/lib/site';

export async function GET() {
  const site = getSiteUrl();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${site}/sitemap-jobs.xml</loc></sitemap>
  <sitemap><loc>${site}/sitemap-categories.xml</loc></sitemap>
  <sitemap><loc>${site}/sitemap-companies.xml</loc></sitemap>
  <sitemap><loc>${site}/sitemap-blog.xml</loc></sitemap>
</sitemapindex>`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
