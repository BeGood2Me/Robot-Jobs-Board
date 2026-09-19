import { PUBLIC_REVALIDATE_SECONDS } from '@/lib/site';
import { readSnapshotSitemap, snapshotXmlHeaders } from '@/lib/snapshot/sitemap';
import { unstable_cache } from 'next/cache';
import { prisma, withDb } from '@/lib/db';
import { getSiteUrl } from '@/lib/site';

const loadCompanySitemapXml = unstable_cache(
  async () => {
    const site = getSiteUrl();
    const companies = await prisma.company.findMany({
      select: {
        slug: true,
        jobs: {
          where: { isActive: true, isHidden: false },
          select: { postedAt: true },
          orderBy: { postedAt: 'desc' },
          take: 1,
        },
      },
    });
    const today = new Date().toISOString().slice(0, 10);
    const rows = [
      `  <url><loc>${site}/companies</loc><lastmod>${today}</lastmod></url>`,
      ...companies.map((c) => {
        const lastmod = c.jobs[0]?.postedAt
          ? new Date(c.jobs[0].postedAt).toISOString().slice(0, 10)
          : today;
        return `  <url><loc>${site}/companies/${c.slug}</loc><lastmod>${lastmod}</lastmod></url>`;
      }),
    ];
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rows.join('\n')}
</urlset>`;
  },
  ['sitemap-companies'],
  { revalidate: PUBLIC_REVALIDATE_SECONDS },
);

export async function GET() {
  const staticXml = await readSnapshotSitemap('sitemap-companies.xml');
  if (staticXml) {
    return new Response(staticXml, { headers: snapshotXmlHeaders() });
  }

  const xml = await withDb(loadCompanySitemapXml, '');
  return new Response(xml, { headers: snapshotXmlHeaders() });
}
