import { unstable_cache } from 'next/cache';
import { prisma, withDb } from '@/lib/db';
import { loadPublicSnapshot } from '@/lib/snapshot/load';
import { readSnapshotSitemap, snapshotXmlHeaders } from '@/lib/snapshot/sitemap';
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

function sitemapHasUrls(xml: string): boolean {
  return /<url[\s>]/i.test(xml);
}

async function urlsFromBoardSnapshot(): Promise<string[]> {
  const board = await loadPublicSnapshot();
  if (!board?.jobs?.length) return [];
  const site = (board.siteUrl || getSiteUrl()).replace(/\/$/, '');
  return board.jobs
    .filter((job) => job.isActive && !job.isHidden)
    .map((job) => `${site}/jobs/${job.id}/${job.slug}`);
}

export async function GET() {
  const staticXml = await readSnapshotSitemap('sitemap-jobs.xml');
  // Prefer snapshot XML when it actually lists jobs; empty urlsets starved GSC.
  if (staticXml && sitemapHasUrls(staticXml)) {
    return new Response(staticXml, { headers: snapshotXmlHeaders() });
  }

  // CDN may still serve a cached empty sitemap-jobs.xml — rebuild from board.json.gz.
  const fromBoard = await urlsFromBoardSnapshot();
  if (fromBoard.length > 0) {
    return new Response(urlset(fromBoard), { headers: snapshotXmlHeaders() });
  }

  const urls = await withDb(loadJobSitemapUrls, []);
  return new Response(urlset(urls), { headers: snapshotXmlHeaders() });
}
