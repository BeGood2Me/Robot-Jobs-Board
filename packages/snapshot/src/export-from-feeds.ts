import { seedCompanies } from '@robot-jobs-board/db/seed-companies';
import { taxonomySeed } from '@robot-jobs-board/db/taxonomy-seed';
import { jobsForFeed } from '@robot-jobs-board/ingestion/feeds';
import { slugify } from '@robot-jobs-board/ingestion/normalize';
import { shouldIngestJob } from '@robot-jobs-board/ingestion/region';
import { isRobotRole, RuleBasedClassifier } from '@robot-jobs-board/taxonomy';
import { defaultSnapshotOutDir } from './export';
import { stableEntityId } from './stable-id';
import type { PublicBoardSnapshot, SnapshotJob } from './types';
import { writePublicSnapshotFiles } from './write-snapshot';

const classifier = new RuleBasedClassifier();

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
): SnapshotJob {
  const classification = classifier.classify({
    title: job.title,
    descriptionPlain: job.descriptionPlain,
    department: job.department,
    sourceSystem: job.sourceSystem,
    companyName: company.name,
  });

  const now = new Date().toISOString();
  return {
    id: stableEntityId('job', `${job.sourceSystem}:${job.externalId}`),
    slug: slugify(job.title),
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

export async function exportPublicSnapshotFromFeeds(options: {
  outDir: string;
  siteUrl: string;
}): Promise<{ jobCount: number; generatedAt: string }> {
  const site = options.siteUrl.replace(/\/$/, '');
  const taxonomy = buildTaxonomy();
  const jobs: SnapshotJob[] = [];
  const seen = new Set<string>();

  for (const company of seedCompanies) {
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
      const companyId = stableEntityId('company', company.slug);
      for (const job of fetched) {
        if (!shouldIngestJob(job) || !isRobotRole(job)) continue;
        const key = `${job.sourceSystem}:${job.externalId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        jobs.push(toSnapshotJob(company, companyId, job, taxonomy));
      }
    } catch (error) {
      console.warn(
        JSON.stringify({
          event: 'snapshot.feed.error',
          company: company.name,
          source: company.sourceSystem,
          error: error instanceof Error ? error.message : String(error),
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
  const countryCounts = new Map<string, number>();
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
    if (job.country) {
      countryCounts.set(job.country, (countryCounts.get(job.country) ?? 0) + 1);
      countries.add(job.country);
    }
    if (job.city) cities.add(job.city);
    if (job.region) regions.add(job.region);
  }

  const countryFacets = [...countryCounts.entries()]
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => {
      const ai = preferredCountries.indexOf(a.country);
      const bi = preferredCountries.indexOf(b.country);
      if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      return b.count - a.count;
    });

  const snapshot: PublicBoardSnapshot = {
    version: 1,
    generatedAt: new Date().toISOString(),
    siteUrl: site,
    jobs,
    goneJobs: [],
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
  return { jobCount: jobs.length, generatedAt: snapshot.generatedAt };
}

export async function exportPublicSnapshotFromFeedsToDefaultDir(siteUrl: string) {
  return exportPublicSnapshotFromFeeds({ outDir: defaultSnapshotOutDir(), siteUrl });
}
