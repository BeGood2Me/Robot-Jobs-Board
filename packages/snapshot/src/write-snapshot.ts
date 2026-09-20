import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import type { PublicBoardSnapshot, SnapshotJob, SnapshotJobBody } from './types';
import { SNAPSHOT_BODIES_FILE } from './types';

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

function urlEntry(loc: string, lastmod?: string) {
  if (lastmod) {
    return `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`;
  }
  return `  <url><loc>${loc}</loc></url>`;
}

function urlset(entries: Array<string | { loc: string; lastmod?: string }>) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map((entry) => (typeof entry === 'string' ? urlEntry(entry) : urlEntry(entry.loc, entry.lastmod)))
  .join('\n')}
</urlset>`;
}

function toIndexJob(job: SnapshotJob): SnapshotJob {
  const { descriptionHtml: _html, descriptionPlain: _plain, ...rest } = job;
  return rest;
}

function jobBody(job: SnapshotJob): SnapshotJobBody {
  return {
    descriptionHtml: job.descriptionHtml ?? '',
    descriptionPlain: job.descriptionPlain ?? '',
  };
}

function writeJobBodies(jobs: SnapshotJob[], outDir: string): void {
  const bodies: Record<string, SnapshotJobBody> = {};
  for (const job of jobs) {
    bodies[job.id] = jobBody(job);
  }
  writeFileSync(
    join(outDir, SNAPSHOT_BODIES_FILE),
    gzipSync(Buffer.from(JSON.stringify(bodies), 'utf8')),
  );
}

/** Board index without descriptions + one bodies map (Hobby Blob-friendly). */
export function writePublicSnapshotFiles(snapshot: PublicBoardSnapshot, outDir: string): void {
  const site = snapshot.siteUrl.replace(/\/$/, '');
  const jobs = snapshot.jobs;
  mkdirSync(outDir, { recursive: true });

  const indexSnapshot: PublicBoardSnapshot = {
    ...snapshot,
    jobs: jobs.map(toIndexJob),
  };
  writeFileSync(join(outDir, 'board.json.gz'), gzipSync(Buffer.from(JSON.stringify(indexSnapshot), 'utf8')));
  writeJobBodies(jobs, outDir);

  // Job URLs are ephemeral and flood crawl budget (GSC "Discovered – not indexed").
  // Keep them discoverable via company pages; only sitemap durable hub URLs here.
  writeFileSync(join(outDir, 'sitemap-jobs.xml'), urlset([]), 'utf8');

  const boardLastmod = snapshot.generatedAt.slice(0, 10);
  const categoryUrls: Array<{ loc: string; lastmod: string }> = [
    { loc: `${site}/`, lastmod: boardLastmod },
  ];
  for (const domain of snapshot.domains) {
    if (domain.openJobCount >= INDEX_JOB_THRESHOLD) {
      categoryUrls.push({ loc: `${site}/robots/${domain.slug}-jobs`, lastmod: boardLastmod });
    }
  }
  const remoteCount = jobs.filter((job) => job.isRemote).length;
  if (remoteCount >= INDEX_JOB_THRESHOLD) {
    categoryUrls.push({ loc: `${site}/locations/remote-robotics-jobs`, lastmod: boardLastmod });
  }

  const cityCounts = new Map<string, number>();
  const countryCounts = new Map<string, number>();
  for (const job of jobs) {
    if (job.city) cityCounts.set(job.city, (cityCounts.get(job.city) ?? 0) + 1);
    if (job.country) countryCounts.set(job.country, (countryCounts.get(job.country) ?? 0) + 1);
  }
  for (const [city, count] of cityCounts) {
    if (count >= INDEX_JOB_THRESHOLD) {
      categoryUrls.push({
        loc: `${site}/locations/${slugify(city)}-robotics-jobs`,
        lastmod: boardLastmod,
      });
    }
  }
  for (const [country, count] of countryCounts) {
    if (count >= INDEX_JOB_THRESHOLD) {
      categoryUrls.push({
        loc: `${site}/locations/${slugify(country)}-robotics-jobs`,
        lastmod: boardLastmod,
      });
    }
  }
  writeFileSync(join(outDir, 'sitemap-categories.xml'), urlset(categoryUrls), 'utf8');

  const newestByCompany = new Map<string, string>();
  for (const job of jobs) {
    const stamp = (job.postedAt ?? job.createdAt).slice(0, 10);
    const prev = newestByCompany.get(job.companyId);
    if (!prev || stamp > prev) newestByCompany.set(job.companyId, stamp);
  }

  writeFileSync(
    join(outDir, 'sitemap-companies.xml'),
    urlset([
      { loc: `${site}/companies`, lastmod: boardLastmod },
      ...snapshot.companies.map((company) => ({
        loc: `${site}/companies/${company.slug}`,
        lastmod: newestByCompany.get(company.id) ?? boardLastmod,
      })),
    ]),
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
        boardIncludesDescriptions: false,
        bodiesFile: 'bodies.json.gz',
      },
      null,
      2,
    ),
    'utf8',
  );

  const places = new Set<string>(['remote-robotics-jobs']);
  for (const city of snapshot.places.cities) places.add(`${slugify(city)}-robotics-jobs`);
  for (const country of snapshot.places.countries) places.add(`${slugify(country)}-robotics-jobs`);
  for (const region of snapshot.places.regions) places.add(`${slugify(region)}-robotics-jobs`);

  const staticParams = {
    companies: snapshot.companies.map((company) => ({ slug: company.slug })),
    domains: snapshot.domains.map((domain) => ({ slug: `${domain.slug}-jobs` })),
    places: [...places].map((place) => ({ place })),
  };
  // Written next to the importer so Next can bundle a fixed JSON module (no fs tracing).
  const staticParamsPath = join(outDir, '..', '..', 'src', 'lib', 'snapshot', 'static-params.json');
  writeFileSync(staticParamsPath, `${JSON.stringify(staticParams)}\n`, 'utf8');
}
