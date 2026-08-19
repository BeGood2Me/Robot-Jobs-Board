import { prisma, withDb } from '@/lib/db';
import { getSiteUrl } from '@/lib/site';

export async function GET() {
  const site = getSiteUrl();
  const companies = await withDb(() => prisma.company.findMany({ select: { slug: true } }), []);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${site}/companies</loc></url>
${companies.map((c) => `  <url><loc>${site}/companies/${c.slug}</loc></url>`).join('\n')}
</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
