import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import type { PublicBoardSnapshot } from './types';

const INDEX_JOB_THRESHOLD = 5;

function slugify(input: string, maxLength = 80): string {
  const slug = input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/g, '');
  return slug || 'item';
}

function blogPostsForSitemap(contentDir: string): Array<{ slug: string; publishedAt: string; updatedAt?: string }> {
  let files: string[];
  try {
    files = readdirSync(contentDir).filter((file) => file.endsWith('.mdx'));
  } catch {
    return [];
  }
  return files
    .map((file) => {
      const raw = readFileSync(join(contentDir, file), 'utf8');
      const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!match?.[1]) return null;
      const frontmatter = match[1];
      const slug = frontmatter.match(/^slug:\s*"?([^"\n]+)"?/m)?.[1]?.trim();
      const publishedAt = frontmatter.match(/^publishedAt:\s*"?([^"\n]+)"?/m)?.[1]?.trim();
      const updatedAt = frontmatter.match(/^updatedAt:\s*"?([^"\n]+)"?/m)?.[1]?.trim();
      if (!slug || !publishedAt) return null;
      return { slug, publishedAt, updatedAt };
    })
    .filter(Boolean) as Array<{ slug: string; publishedAt: string; updatedAt?: string }>;
}

function urlset(urls: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>`;
}

export function writePublicSnapshotFiles(snapshot: PublicBoardSnapshot, outDir: string): void {
  const site = snapshot.siteUrl.replace(/\/$/, '');
  const jobs = snapshot.jobs;
  mkdirSync(outDir, { recursive: true });

  writeFileSync(join(outDir, 'board.json.gz'), gzipSync(Buffer.from(JSON.stringify(snapshot), 'utf8')));
  writeFileSync(
    join(outDir, 'sitemap-jobs.xml'),
    urlset(jobs.map((job) => `${site}/jobs/${job.id}/${job.slug}`)),
    'utf8',
  );

  const categoryUrls = [`${site}/`];
  for (const domain of snapshot.domains) {
    if (domain.openJobCount >= INDEX_JOB_THRESHOLD) {
      categoryUrls.push(`${site}/robots/${domain.slug}-jobs`);
    }
  }
  const remoteCount = jobs.filter((job) => job.isRemote).length;
  if (remoteCount >= INDEX_JOB_THRESHOLD) categoryUrls.push(`${site}/locations/remote-robotics-jobs`);

  const cityCounts = new Map<string, number>();
  const countryCounts = new Map<string, number>();
  for (const job of jobs) {
    if (job.city) cityCounts.set(job.city, (cityCounts.get(job.city) ?? 0) + 1);
    if (job.country) countryCounts.set(job.country, (countryCounts.get(job.country) ?? 0) + 1);
  }
  for (const [city, count] of cityCounts) {
    if (count >= INDEX_JOB_THRESHOLD) categoryUrls.push(`${site}/locations/${slugify(city)}-robotics-jobs`);
  }
  for (const [country, count] of countryCounts) {
    if (count >= INDEX_JOB_THRESHOLD) categoryUrls.push(`${site}/locations/${slugify(country)}-robotics-jobs`);
  }
  writeFileSync(join(outDir, 'sitemap-categories.xml'), urlset(categoryUrls), 'utf8');

  writeFileSync(
    join(outDir, 'sitemap-companies.xml'),
    urlset([`${site}/companies`, ...snapshot.companies.map((company) => `${site}/companies/${company.slug}`)]),
    'utf8',
  );

  const blogDir = join(outDir, '..', '..', 'content', 'blog');
  const posts = blogPostsForSitemap(blogDir);
  writeFileSync(
    join(outDir, 'sitemap-blog.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${site}/guides</loc>
    <changefreq>weekly</changefreq>
  </url>
${posts
  .map((post) => {
    const lastmod = post.updatedAt ?? post.publishedAt;
    return `  <url>
    <loc>${site}/guides/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
  </url>`;
  })
  .join('\n')}
</urlset>`,
    'utf8',
  );

  writeFileSync(
    join(outDir, 'manifest.json'),
    JSON.stringify(
      {
        generatedAt: snapshot.generatedAt,
        siteUrl: site,
        jobCount: jobs.length,
        companyCount: snapshot.companies.length,
      },
      null,
      2,
    ),
    'utf8',
  );
}
