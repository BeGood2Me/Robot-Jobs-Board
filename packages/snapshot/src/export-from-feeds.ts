import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { seedCompanies } from '@robot-jobs-board/db/seed-companies';
import { taxonomySeed } from '@robot-jobs-board/db/taxonomy-seed';
import { jobsForFeed } from '@robot-jobs-board/ingestion/feeds';
import { slugify } from '@robot-jobs-board/ingestion/normalize';
import { shouldIngestJob } from '@robot-jobs-board/ingestion/region';
import { isRobotRole, RuleBasedClassifier, capJobsPerCompany } from '@robot-jobs-board/taxonomy';
import { defaultSnapshotOutDir } from './export';
import { buildCountryFacets } from './filter';
import { stableEntityId } from './stable-id';
import type { PublicBoardSnapshot, SnapshotGoneJob, SnapshotJob, SnapshotJobBody } from './types';
import { SNAPSHOT_BODIES_FILE, SNAPSHOT_JOBS_DIR } from './types';
import { writePublicSnapshotFiles } from './write-snapshot';

const classifier = new RuleBasedClassifier();
const MAX_GONE_JOBS = 3000;

const preferredCountries = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Ireland',
  'Germany',
  'France',
  'Switzerland',
];

function readPreviousSnapshot(outDir: string): PublicBoardSnapshot | null {
  const path = join(outDir, 'board.json.gz');
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(gunzipSync(readFileSync(path)).toString('utf8')) as PublicBoardSnapshot;
  } catch {
    return null;
  }
}

function readBodiesMap(outDir: string): Record<string, SnapshotJobBody> | null {
  const path = join(outDir, SNAPSHOT_BODIES_FILE);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(gunzipSync(readFileSync(path)).toString('utf8')) as Record<string, SnapshotJobBody>;
  } catch {
    return null;
  }
}

function readJobBody(outDir: string, jobId: string, bodies?: Record<string, SnapshotJobBody> | null): SnapshotJobBody | null {
  if (bodies?.[jobId]) return bodies[jobId]!;
  // Legacy per-job file (local snapshots before bodies.json.gz).
  const path = join(outDir, SNAPSHOT_JOBS_DIR, `${jobId}.json.gz`);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(gunzipSync(readFileSync(path)).toString('utf8')) as SnapshotJobBody;
  } catch {
    return null;
  }
}

/** Rehydrate index rows with description bodies so a rewrite does not wipe them. */
export function carryForwardCompanyJobs(
  previous: PublicBoardSnapshot | null,
  companySlug: string,
  outDir: string,
): SnapshotJob[] {
  if (!previous) return [];
  const bodies = readBodiesMap(outDir);
  return previous.jobs
    .filter((job) => job.company.slug === companySlug)
    .map((job) => {
      if (job.descriptionHtml != null && job.descriptionPlain != null) return job;
      const body = readJobBody(outDir, job.id, bodies);
      return {
        ...job,
        descriptionHtml: body?.descriptionHtml ?? job.descriptionHtml ?? '',
        descriptionPlain: body?.descriptionPlain ?? job.descriptionPlain ?? '',
      };
    });
}

/**
 * Closed roles redirect to the company page instead of hard 404s in GSC.
 * Jobs from companies whose feeds failed this run stay active and are excluded.
 */
export function buildGoneJobs(
  previous: PublicBoardSnapshot | null,
  activeJobs: SnapshotJob[],
  retainedCompanySlugs: ReadonlySet<string> = new Set(),
): SnapshotGoneJob[] {
  if (!previous) return [];
  const activeIds = new Set(activeJobs.map((job) => job.id));
  const next = new Map<string, SnapshotGoneJob>();

  for (const job of previous.jobs) {
    if (activeIds.has(job.id)) continue;
    if (retainedCompanySlugs.has(job.company.slug)) continue;
    next.set(job.id, {
      id: job.id,
      slug: job.slug,
      title: job.title,
      company: { name: job.company.name, slug: job.company.slug },
    });
  }
  for (const gone of previous.goneJobs ?? []) {
    if (activeIds.has(gone.id) || next.has(gone.id)) continue;
    // Drop gone entries that we carried forward again after a feed outage.
    if (retainedCompanySlugs.has(gone.company.slug)) continue;
    next.set(gone.id, gone);
  }

  return [...next.values()].slice(0, MAX_GONE_JOBS);
}

function buildTaxonomy() {
  const domains = taxonomySeed.domains.map((domain) => ({
    id: stableEntityId('domain', domain.slug),
    slug: domain.slug,
    name: domain.name,
    description: domain.description,
  }));
  const tags = taxonomySeed.techTags.map((tag) => ({
    id: stableEntityId('tag', tag.slug),
    slug: tag.slug,
    label: tag.label,
  }));
  const seniorities = taxonomySeed.seniorities.map((seniority) => ({
    id: stableEntityId('seniority', seniority.slug),
    slug: seniority.slug,
    label: seniority.label,
  }));
  return {
    domainBySlug: new Map(domains.map((domain) => [domain.slug, domain])),
    tagBySlug: new Map(tags.map((tag) => [tag.slug, tag])),
    seniorityBySlug: new Map(seniorities.map((seniority) => [seniority.slug, seniority])),
    domains,
    tags,
    seniorities,
  };
}

function toSnapshotJob(
  company: (typeof seedCompanies)[number],
  companyId: string,
  job: Awaited<ReturnType<typeof jobsForFeed>>[number],
  taxonomy: ReturnType<typeof buildTaxonomy>,
  previousSlugById: Map<string, string>,
): SnapshotJob {
  const classification = classifier.classify({
    title: job.title,
    descriptionPlain: job.descriptionPlain,
    department: job.department,
    sourceSystem: job.sourceSystem,
    companyName: company.name,
  });

  const id = stableEntityId('job', `${job.sourceSystem}:${job.externalId}`);
  const now = new Date().toISOString();
  return {
    id,
    slug: previousSlugById.get(id) ?? slugify(job.title),
    title: job.title,
    descriptionHtml: job.descriptionHtml,
    descriptionPlain: job.descriptionPlain,
    url: job.url,
    locationRaw: job.locationRaw,
    country: job.country,
    region: job.region,
    city: job.city,
    isRemote: job.isRemote,
    workplaceType: job.workplaceType,
    employmentType: job.employmentType,
    department: job.department,
    compensationText: job.compensationText,
    postedAt: job.postedAt?.toISOString() ?? null,
    expiresAt: null,
    createdAt: now,
    isHidden: false,
    isActive: true,
    sourceSystem: job.sourceSystem,
    externalId: job.externalId,
    companyId,
    company: {
      name: company.name,
      slug: company.slug,
      website: company.website,
      logoUrl: null,
      sourceIdentifier: company.sourceIdentifier,
    },
    robotDomains: classification.domains.flatMap((slug) => {
      const domain = taxonomy.domainBySlug.get(slug);
      return domain ? [{ domainId: domain.id, domain: { id: domain.id, slug: domain.slug, name: domain.name } }] : [];
    }),
    techTags: classification.techTags.flatMap((slug) => {
      const tag = taxonomy.tagBySlug.get(slug);
      return tag ? [{ techTag: { id: tag.id, slug: tag.slug, label: tag.label } }] : [];
    }),
    seniorities: (() => {
      const seniority = taxonomy.seniorityBySlug.get(classification.seniority);
      return seniority ? [{ seniority: { id: seniority.id, slug: seniority.slug, label: seniority.label } }] : [];
    })(),
  };
}

function mergeCarriedJobs(jobs: SnapshotJob[], carried: SnapshotJob[], seen: Set<string>): number {
  let added = 0;
  for (const job of carried) {
    const key = `${job.sourceSystem}:${job.externalId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    jobs.push(job);
    added += 1;
  }
  return added;
}

export async function exportPublicSnapshotFromFeeds(options: {
  outDir: string;
  siteUrl: string;
}): Promise<{ jobCount: number; generatedAt: string }> {
  const site = options.siteUrl.replace(/\/$/, '');
  const previous = readPreviousSnapshot(options.outDir);
  const previousSlugById = new Map(
    (previous?.jobs ?? []).map((job) => [job.id, job.slug] as const),
  );
  const previousCountByCompany = new Map<string, number>();
  for (const job of previous?.jobs ?? []) {
    previousCountByCompany.set(job.company.slug, (previousCountByCompany.get(job.company.slug) ?? 0) + 1);
  }
  const taxonomy = buildTaxonomy();
  const jobs: SnapshotJob[] = [];
  const seen = new Set<string>();
  const retainedCompanySlugs = new Set<string>();

  for (const company of seedCompanies) {
    const previousCount = previousCountByCompany.get(company.slug) ?? 0;
    try {
      const fetched = await jobsForFeed(company.sourceSystem, company.config);
      console.log(
        JSON.stringify({
          event: 'snapshot.feed',
          company: company.name,
          source: company.sourceSystem,
          fetched: fetched.length,
        }),
      );

      // Empty success after a non-empty board usually means a broken/blocked feed, not a mass layoff.
      if (fetched.length === 0 && previousCount > 0) {
        const carried = capJobsPerCompany(carryForwardCompanyJobs(previous, company.slug, options.outDir));
        const added = mergeCarriedJobs(jobs, carried, seen);
        retainedCompanySlugs.add(company.slug);
        console.warn(
          JSON.stringify({
            event: 'snapshot.feed.retained',
            company: company.name,
            source: company.sourceSystem,
            reason: 'empty_fetch',
            retained: added,
            previousCount,
          }),
        );
        continue;
      }

      const companyId = stableEntityId('company', company.slug);
      const companyJobs = [];
      for (const job of fetched) {
        if (!shouldIngestJob(job) || !isRobotRole(job)) continue;
        const key = `${job.sourceSystem}:${job.externalId}`;
        if (seen.has(key)) continue;
        companyJobs.push(job);
      }

      const capped = capJobsPerCompany(companyJobs);
      if (capped.length < companyJobs.length) {
        console.warn(
          JSON.stringify({
            event: 'snapshot.feed.capped',
            company: company.name,
            source: company.sourceSystem,
            before: companyJobs.length,
            after: capped.length,
          }),
        );
      }

      for (const job of capped) {
        const key = `${job.sourceSystem}:${job.externalId}`;
        seen.add(key);
        jobs.push(toSnapshotJob(company, companyId, job, taxonomy, previousSlugById));
      }
    } catch (error) {
      const carried = capJobsPerCompany(carryForwardCompanyJobs(previous, company.slug, options.outDir));
      const added = mergeCarriedJobs(jobs, carried, seen);
      if (added > 0) retainedCompanySlugs.add(company.slug);
      console.warn(
        JSON.stringify({
          event: 'snapshot.feed.error',
          company: company.name,
          source: company.sourceSystem,
          error: error instanceof Error ? error.message : String(error),
          retained: added,
          previousCount,
        }),
      );
    }
  }

  jobs.sort((a, b) => {
    const aTime = a.postedAt ?? a.createdAt;
    const bTime = b.postedAt ?? b.createdAt;
    return bTime.localeCompare(aTime);
  });

  const companyCounts = new Map<string, number>();
  const domainCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  const cities = new Set<string>();
  const countries = new Set<string>();
  const regions = new Set<string>();

  for (const job of jobs) {
    companyCounts.set(job.company.slug, (companyCounts.get(job.company.slug) ?? 0) + 1);
    for (const { domainId } of job.robotDomains) {
      domainCounts.set(domainId, (domainCounts.get(domainId) ?? 0) + 1);
    }
    for (const { techTag } of job.techTags) {
      tagCounts.set(techTag.id, (tagCounts.get(techTag.id) ?? 0) + 1);
    }
    if (job.country) countries.add(job.country);
    if (job.city) cities.add(job.city);
    if (job.region) regions.add(job.region);
  }

  const countryFacets = buildCountryFacets(jobs, preferredCountries);

  const snapshot: PublicBoardSnapshot = {
    version: 1,
    generatedAt: new Date().toISOString(),
    siteUrl: site,
    jobs,
    goneJobs: buildGoneJobs(previous, jobs, retainedCompanySlugs),
    companies: seedCompanies.map((company) => ({
      id: stableEntityId('company', company.slug),
      name: company.name,
      slug: company.slug,
      website: company.website,
      logoUrl: null,
      description: company.description,
      seoIntro: company.seoIntro,
      openJobCount: companyCounts.get(company.slug) ?? 0,
    })),
    domains: taxonomy.domains.map((domain) => ({
      ...domain,
      openJobCount: domainCounts.get(domain.id) ?? 0,
    })),
    tags: taxonomy.tags.map((tag) => ({
      ...tag,
      openJobCount: tagCounts.get(tag.id) ?? 0,
    })),
    seniorities: taxonomy.seniorities,
    countryFacets,
    places: {
      cities: [...cities].sort(),
      countries: [...countries].sort(),
      regions: [...regions].sort(),
    },
  };

  writePublicSnapshotFiles(snapshot, options.outDir);
  if (jobs.length === 0) {
    throw new Error('Feed snapshot export produced zero jobs');
  }
  return { jobCount: jobs.length, generatedAt: snapshot.generatedAt };
}

export async function exportPublicSnapshotFromFeedsToDefaultDir(siteUrl: string) {
  return exportPublicSnapshotFromFeeds({ outDir: defaultSnapshotOutDir(), siteUrl });
}
