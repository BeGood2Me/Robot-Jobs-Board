import { unstable_cache } from 'next/cache';
import { prisma, withDb } from '@/lib/db';
import { publicJobWhere } from '@/lib/jobs';
import { INDEX_JOB_THRESHOLD, getSiteUrl, PUBLIC_REVALIDATE_SECONDS, slugify } from '@/lib/site';

function urlset(urls: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
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
  const urls = await withDb(loadCategorySitemapUrls, []);
  return new Response(urlset(urls), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': `public, s-maxage=${PUBLIC_REVALIDATE_SECONDS}, stale-while-revalidate=86400`,
    },
  });
}
