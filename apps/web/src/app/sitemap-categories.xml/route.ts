import { prisma, withDb } from '@/lib/db';
import { INDEX_JOB_THRESHOLD, getSiteUrl, slugify } from '@/lib/site';

function urlset(urls: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>`;
}

export async function GET() {
  const site = getSiteUrl();
  const urls: string[] = [`${site}/`];

  const domains = await withDb(() => prisma.robotDomain.findMany(), []);
  for (const domain of domains) {
    const count = await withDb(
      () => prisma.job.count({ where: { isActive: true, isHidden: false, robotDomains: { some: { domainId: domain.id } } } }),
      0,
    );
    if (count >= INDEX_JOB_THRESHOLD) urls.push(`${site}/robots/${domain.slug}-jobs`);
  }

  const remoteCount = await withDb(() => prisma.job.count({ where: { isActive: true, isHidden: false, isRemote: true } }), 0);
  if (remoteCount >= INDEX_JOB_THRESHOLD) urls.push(`${site}/locations/remote-robotics-jobs`);

  const cities = await withDb(
    () =>
      prisma.job.groupBy({
        by: ['city'],
        where: { isActive: true, isHidden: false, city: { not: null } },
        _count: true,
      }),
    [],
  );
  for (const row of cities) {
    if (row.city && row._count >= INDEX_JOB_THRESHOLD) {
      urls.push(`${site}/locations/${slugify(row.city)}-robotics-jobs`);
    }
  }

  const countries = await withDb(
    () =>
      prisma.job.groupBy({
        by: ['country'],
        where: { isActive: true, isHidden: false, country: { not: null } },
        _count: true,
      }),
    [],
  );
  for (const row of countries) {
    if (row.country && row._count >= INDEX_JOB_THRESHOLD) {
      urls.push(`${site}/locations/${slugify(row.country)}-robotics-jobs`);
    }
  }

  return new Response(urlset(urls), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
