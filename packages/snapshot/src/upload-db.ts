import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '@robot-jobs-board/db';

export type UploadSnapshotDbResult = {
  uploaded: true;
  jobCount: number;
  companyCount: number;
  generatedAt: string;
  bytes: number;
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

/** Persist the slim public snapshot into Neon (Hobby-safe; no Blob Advanced Ops). */
export async function uploadSnapshotDirToDb(outDir: string): Promise<UploadSnapshotDbResult> {
  const manifestRaw = requireFile(outDir, 'manifest.json').toString('utf8');
  const manifest = JSON.parse(manifestRaw) as {
    generatedAt: string;
    jobCount?: number;
    companyCount?: number;
  };
  const boardGz = requireFile(outDir, 'board.json.gz');
  const bodiesGz = requireFile(outDir, 'bodies.json.gz');
  const sitemapJobs = optionalText(outDir, 'sitemap-jobs.xml');
  const sitemapCategories = optionalText(outDir, 'sitemap-categories.xml');
  const sitemapCompanies = optionalText(outDir, 'sitemap-companies.xml');
  const sitemapBlog = optionalText(outDir, 'sitemap-blog.xml');

  const jobCount = manifest.jobCount ?? 0;
  if (jobCount < 1) {
    throw new Error(`Refusing to upload empty snapshot (jobCount=${jobCount})`);
  }

  await prisma.publicSnapshot.upsert({
    where: { id: 'current' },
    create: {
      id: 'current',
      generatedAt: new Date(manifest.generatedAt),
      jobCount,
      companyCount: manifest.companyCount ?? 0,
      manifestJson: manifestRaw,
      boardGz: new Uint8Array(boardGz),
      bodiesGz: new Uint8Array(bodiesGz),
      sitemapJobs,
      sitemapCategories,
      sitemapCompanies,
      sitemapBlog,
    },
    update: {
      generatedAt: new Date(manifest.generatedAt),
      jobCount,
      companyCount: manifest.companyCount ?? 0,
      manifestJson: manifestRaw,
      boardGz: new Uint8Array(boardGz),
      bodiesGz: new Uint8Array(bodiesGz),
      sitemapJobs,
      sitemapCategories,
      sitemapCompanies,
      sitemapBlog,
    },
  });

  return {
    uploaded: true,
    jobCount,
    companyCount: manifest.companyCount ?? 0,
    generatedAt: manifest.generatedAt,
    bytes: boardGz.length + bodiesGz.length,
  };
}
