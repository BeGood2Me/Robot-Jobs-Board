import { readSnapshotSitemap, snapshotXmlHeaders } from '@/lib/snapshot/sitemap';
import { getBlogPosts } from '@/lib/blog';
import { getSiteUrl } from '@/lib/site';

export async function GET() {
  const staticXml = readSnapshotSitemap('sitemap-blog.xml');
  if (staticXml) {
    return new Response(staticXml, { headers: snapshotXmlHeaders() });
  }

  const site = getSiteUrl();
  const posts = getBlogPosts();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${site}/guides</loc>
    <changefreq>weekly</changefreq>
  </url>
${posts
  .map((post) => {
    const lastmod = post.updatedAt ?? post.publishedAt;
    return `  <url>
    <loc>${site}/guides/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
  </url>`;
  })
  .join('\n')}
</urlset>`;
  return new Response(xml, { headers: snapshotXmlHeaders() });
}
