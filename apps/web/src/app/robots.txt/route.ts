import { getSiteUrl } from '@/lib/site';

export async function GET() {
  const site = getSiteUrl();
  const body = `User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${site}/sitemap.xml
`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
