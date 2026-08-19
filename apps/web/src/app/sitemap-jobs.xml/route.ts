import { prisma, withDb } from '@/lib/db';
import { getSiteUrl } from '@/lib/site';

function urlset(urls: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>`;
}

export async function GET() {
  const site = getSiteUrl();
  const jobs = await withDb(
    () =>
      prisma.job.findMany({
        where: { isActive: true, isHidden: false },
        select: { id: true, slug: true },
      }),
    [],
  );
  const xml = urlset(jobs.map((job) => `${site}/jobs/${job.id}/${job.slug}`));
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
