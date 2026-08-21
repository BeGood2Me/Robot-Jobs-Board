import { unstable_cache } from 'next/cache';
import { prisma, withDb } from '@/lib/db';
import { getSiteUrl, PUBLIC_REVALIDATE_SECONDS } from '@/lib/site';

function urlset(urls: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>`;
}

const loadJobSitemapUrls = unstable_cache(
  async () => {
    const site = getSiteUrl();
    const jobs = await prisma.job.findMany({
      where: { isActive: true, isHidden: false },
      select: { id: true, slug: true },
    });
    return jobs.map((job) => `${site}/jobs/${job.id}/${job.slug}`);
  },
  ['sitemap-jobs'],
  { revalidate: PUBLIC_REVALIDATE_SECONDS },
);

export async function GET() {
  const urls = await withDb(loadJobSitemapUrls, []);
  return new Response(urlset(urls), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': `public, s-maxage=${PUBLIC_REVALIDATE_SECONDS}, stale-while-revalidate=86400`,
    },
  });
}
