import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { prisma } from '@robot-jobs-board/db';
import type { PublicBoardSnapshot, SnapshotJob } from './types';

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

const jobDetailSelect = {
  id: true,
  slug: true,
  title: true,
  descriptionHtml: true,
  descriptionPlain: true,
  url: true,
  locationRaw: true,
  country: true,
  region: true,
  city: true,
  isRemote: true,
  workplaceType: true,
  employmentType: true,
  department: true,
  compensationText: true,
  postedAt: true,
  expiresAt: true,
  createdAt: true,
  isHidden: true,
  isActive: true,
  sourceSystem: true,
  externalId: true,
  companyId: true,
  company: {
    select: { name: true, slug: true, website: true, logoUrl: true, sourceIdentifier: true },
  },
  robotDomains: {
    select: { domainId: true, domain: { select: { id: true, slug: true, name: true } } },
  },
  techTags: { select: { techTag: { select: { id: true, slug: true, label: true } } } },
  seniorities: { select: { seniority: { select: { id: true, slug: true, label: true } } } },
} as const;

const publicJobWhere = { isActive: true, isHidden: false };

function serializeJob(
  job: Awaited<
    ReturnType<
      typeof prisma.job.findMany<{ select: typeof jobDetailSelect; where: typeof publicJobWhere }>
    >
  >[number],
): SnapshotJob {
  return {
    ...job,
    postedAt: job.postedAt?.toISOString() ?? null,
    expiresAt: job.expiresAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
  };
}

function urlset(urls: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>`;
}

function writeSitemap(path: string, xml: string) {
  writeFileSync(path, xml, 'utf8');
}

export async function exportPublicSnapshot(options: {
  outDir: string;
  siteUrl: string;
}): Promise<{ jobCount: number; generatedAt: string }> {
  const site = options.siteUrl.replace(/\/$/, '');
  mkdirSync(options.outDir, { recursive: true });

  const [jobsRaw, goneJobsRaw, companiesRaw, domainsRaw, tagsRaw, seniorities, countryGroups, cityRows, countryRows, regionRows] =
    await Promise.all([
      prisma.job.findMany({
        where: publicJobWhere,
        select: jobDetailSelect,
        orderBy: [{ postedAt: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.job.findMany({
        where: { OR: [{ isActive: false }, { isHidden: true }] },
        select: {
          id: true,
          slug: true,
          title: true,
          company: { select: { name: true, slug: true } },
        },
      }),
      prisma.company.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          website: true,
          logoUrl: true,
          description: true,
          seoIntro: true,
          _count: { select: { jobs: { where: publicJobWhere } } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.robotDomain.findMany({
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          _count: { select: { jobs: { where: { job: publicJobWhere } } } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.techTag.findMany({
        select: {
          id: true,
          slug: true,
          label: true,
          _count: { select: { jobs: { where: { job: publicJobWhere } } } },
        },
        orderBy: { label: 'asc' },
      }),
      prisma.seniorityLevel.findMany({
        orderBy: { label: 'asc' },
        select: { id: true, slug: true, label: true },
      }),
      prisma.job.groupBy({
        by: ['country'],
        where: { ...publicJobWhere, country: { not: null } },
        _count: { _all: true },
      }),
      prisma.job.findMany({
        where: { ...publicJobWhere, city: { not: null } },
        distinct: ['city'],
        select: { city: true },
      }),
      prisma.job.findMany({
        where: { ...publicJobWhere, country: { not: null } },
        distinct: ['country'],
        select: { country: true },
      }),
      prisma.job.findMany({
        where: { ...publicJobWhere, region: { not: null } },
        distinct: ['region'],
        select: { region: true },
      }),
    ]);

  const jobs = jobsRaw.map(serializeJob);
  const preferred = [
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
    'Ireland',
    'Germany',
    'France',
    'Switzerland',
  ];
  const countryFacets = countryGroups
    .filter((row) => row.country)
    .map((row) => ({ country: row.country as string, count: row._count._all }))
    .sort((a, b) => {
      const ai = preferred.indexOf(a.country);
      const bi = preferred.indexOf(b.country);
      if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      return b.count - a.count;
    });

  const snapshot: PublicBoardSnapshot = {
    version: 1,
    generatedAt: new Date().toISOString(),
    siteUrl: site,
    jobs,
    goneJobs: goneJobsRaw,
    companies: companiesRaw.map((company) => ({
      id: company.id,
      name: company.name,
      slug: company.slug,
      website: company.website,
      logoUrl: company.logoUrl,
      description: company.description,
      seoIntro: company.seoIntro,
      openJobCount: company._count.jobs,
    })),
    domains: domainsRaw.map((domain) => ({
      id: domain.id,
      slug: domain.slug,
      name: domain.name,
      description: domain.description,
      openJobCount: domain._count.jobs,
    })),
    tags: tagsRaw.map((tag) => ({
      id: tag.id,
      slug: tag.slug,
      label: tag.label,
      openJobCount: tag._count.jobs,
    })),
    seniorities,
    countryFacets,
    places: {
      cities: cityRows.map((row) => row.city!).filter(Boolean),
      countries: countryRows.map((row) => row.country!).filter(Boolean),
      regions: regionRows.map((row) => row.region!).filter(Boolean),
    },
  };

  const boardPath = join(options.outDir, 'board.json.gz');
  writeFileSync(boardPath, gzipSync(Buffer.from(JSON.stringify(snapshot), 'utf8')));

  writeSitemap(
    join(options.outDir, 'sitemap-jobs.xml'),
    urlset(jobs.map((job) => `${site}/jobs/${job.id}/${job.slug}`)),
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
  writeSitemap(join(options.outDir, 'sitemap-categories.xml'), urlset(categoryUrls));

  writeSitemap(
    join(options.outDir, 'sitemap-companies.xml'),
    urlset([
      `${site}/companies`,
      ...snapshot.companies.map((company) => `${site}/companies/${company.slug}`),
    ]),
  );

  const blogDir = join(options.outDir, '..', '..', 'content', 'blog');
  const posts = blogPostsForSitemap(blogDir);
  writeSitemap(
    join(options.outDir, 'sitemap-blog.xml'),
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
  );

  writeFileSync(
    join(options.outDir, 'manifest.json'),
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

  return { jobCount: jobs.length, generatedAt: snapshot.generatedAt };
}

export function defaultSnapshotOutDir(cwd = process.cwd()) {
  const webRoot = cwd.endsWith('apps\\web') || cwd.endsWith('apps/web') ? cwd : join(cwd, 'apps', 'web');
  return join(webRoot, 'public', 'snapshot');
}

export async function exportPublicSnapshotToDefaultDir(siteUrl: string) {
  const outDir = defaultSnapshotOutDir();
  mkdirSync(dirname(outDir), { recursive: true });
  return exportPublicSnapshot({ outDir, siteUrl });
}
