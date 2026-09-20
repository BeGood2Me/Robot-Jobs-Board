import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '@robot-jobs-board/db';

export type UploadSnapshotDbResult = {
  uploaded: true;
  jobCount: number;
  companyCount: number;
  generatedAt: string;
};

function requireFile(outDir: string, name: string): Buffer {
  const path = join(outDir, name);
  if (!existsSync(path)) {
    throw new Error(`Required snapshot file missing: ${name}`);
  }
  return readFileSync(path);
}

function optionalText(outDir: string, name: string): string {
  const path = join(outDir, name);
  if (!existsSync(path)) return '';
  return readFileSync(path, 'utf8');
}

const MAX_DB_ATTEMPTS = 5;

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/** Persist manifest + sitemaps into Neon (small rows; no gzip blobs). */
export async function uploadSnapshotDirToDb(outDir: string): Promise<UploadSnapshotDbResult> {
  const manifestRaw = requireFile(outDir, 'manifest.json').toString('utf8');
  const manifest = JSON.parse(manifestRaw) as {
    generatedAt: string;
    jobCount?: number;
    companyCount?: number;
  };
  const sitemapJobs = optionalText(outDir, 'sitemap-jobs.xml');
  const sitemapCategories = optionalText(outDir, 'sitemap-categories.xml');
  const sitemapCompanies = optionalText(outDir, 'sitemap-companies.xml');
  const sitemapBlog = optionalText(outDir, 'sitemap-blog.xml');

  const jobCount = manifest.jobCount ?? 0;
  if (jobCount < 1) {
    throw new Error(`Refusing to upload empty snapshot (jobCount=${jobCount})`);
  }

  const payload = {
    generatedAt: new Date(manifest.generatedAt),
    jobCount,
    companyCount: manifest.companyCount ?? 0,
    manifestJson: manifestRaw,
    sitemapJobs,
    sitemapCategories,
    sitemapCompanies,
    sitemapBlog,
  };

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_DB_ATTEMPTS; attempt++) {
    try {
      await prisma.publicSnapshot.upsert({
        where: { id: 'current' },
        create: { id: 'current', ...payload },
        update: payload,
      });
      return {
        uploaded: true,
        jobCount,
        companyCount: manifest.companyCount ?? 0,
        generatedAt: manifest.generatedAt,
      };
    } catch (error) {
      lastError = error;
      if (attempt < MAX_DB_ATTEMPTS) {
        await sleep(attempt * 4000);
      }
    }
  }
  throw lastError;
}
