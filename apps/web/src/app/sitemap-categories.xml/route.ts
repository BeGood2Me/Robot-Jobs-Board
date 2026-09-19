import { readSnapshotSitemap, snapshotXmlHeaders } from '@/lib/snapshot/sitemap';
import { unstable_cache } from 'next/cache';
import { prisma, withDb } from '@/lib/db';
import { publicJobWhere } from '@/lib/jobs';
import { INDEX_JOB_THRESHOLD, getSiteUrl, PUBLIC_REVALIDATE_SECONDS, slugify } from '@/lib/site';

function urlset(urls: string[], lastmod?: string) {
  const mod = lastmod ? `<lastmod>${lastmod}</lastmod>` : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc>${mod}</url>`).join('\n')}
</urlset>`;
}

const loadCategorySitemapUrls = unstable_cache(
  async () => {
    const site = getSiteUrl();
    const urls: string[] = [`${site}/`];

    const domains = await prisma.robotDomain.findMany({
      select: {
        slug: true,
        _count: { select: { jobs: { where: { job: publicJobWhere } } } },
      },
    });
    for (const domain of domains) {
      if (domain._count.jobs >= INDEX_JOB_THRESHOLD) {
        urls.push(`${site}/robots/${domain.slug}-jobs`);
      }
    }

    const remoteCount = await prisma.job.count({ where: { ...publicJobWhere, isRemote: true } });
    if (remoteCount >= INDEX_JOB_THRESHOLD) urls.push(`${site}/locations/remote-robotics-jobs`);

    const [cities, countries] = await Promise.all([
      prisma.job.groupBy({
        by: ['city'],
        where: { ...publicJobWhere, city: { not: null } },
        _count: true,
      }),
      prisma.job.groupBy({
        by: ['country'],
        where: { ...publicJobWhere, country: { not: null } },
        _count: true,
      }),
    ]);

    for (const row of cities) {
      if (row.city && row._count >= INDEX_JOB_THRESHOLD) {
        urls.push(`${site}/locations/${slugify(row.city)}-robotics-jobs`);
      }
    }
    for (const row of countries) {
      if (row.country && row._count >= INDEX_JOB_THRESHOLD) {
        urls.push(`${site}/locations/${slugify(row.country)}-robotics-jobs`);
      }
    }

    return urls;
  },
  ['sitemap-categories'],
  { revalidate: PUBLIC_REVALIDATE_SECONDS },
);

export async function GET() {
  const staticXml = await readSnapshotSitemap('sitemap-categories.xml');
  if (staticXml) {
    return new Response(staticXml, { headers: snapshotXmlHeaders() });
  }

  const urls = await withDb(loadCategorySitemapUrls, []);
  const lastmod = new Date().toISOString().slice(0, 10);
  return new Response(urlset(urls, lastmod), { headers: snapshotXmlHeaders() });
}
