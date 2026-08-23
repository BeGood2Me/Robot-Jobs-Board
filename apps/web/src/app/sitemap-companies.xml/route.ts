import { PUBLIC_REVALIDATE_SECONDS } from '@/lib/site';
import { readSnapshotSitemap, snapshotXmlHeaders } from '@/lib/snapshot/sitemap';
import { unstable_cache } from 'next/cache';
import { prisma, withDb } from '@/lib/db';
import { getSiteUrl } from '@/lib/site';

const loadCompanySitemapXml = unstable_cache(
  async () => {
    const site = getSiteUrl();
    const companies = await prisma.company.findMany({ select: { slug: true } });
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${site}/companies</loc></url>
${companies.map((c) => `  <url><loc>${site}/companies/${c.slug}</loc></url>`).join('\n')}
</urlset>`;
  },
  ['sitemap-companies'],
  { revalidate: PUBLIC_REVALIDATE_SECONDS },
);

export async function GET() {
  const staticXml = readSnapshotSitemap('sitemap-companies.xml');
  if (staticXml) {
    return new Response(staticXml, { headers: snapshotXmlHeaders() });
  }

  const xml = await withDb(loadCompanySitemapXml, '');
  return new Response(xml, { headers: snapshotXmlHeaders() });
}
