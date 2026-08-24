import { loadEnv } from '@robot-jobs-board/config';
import { prisma, type SourceSystem } from '@robot-jobs-board/db';
import { isRobotRole, RuleBasedClassifier } from '@robot-jobs-board/taxonomy';
import { jobsForFeed } from './feeds';
import { parseLocation, slugify } from './normalize';
import { shouldIngestJob } from './region';
import type { FeedConfigJson, NormalizedJob } from './types';

const classifier = new RuleBasedClassifier();

export type SourceMetrics = {
  source: string;
  company: string;
  fetched: number;
  created: number;
  updated: number;
  skipped: number;
  deleted: number;
  errors: string[];
};

export type RunMetrics = {
  sources: SourceMetrics[];
  deleted: number;
  geoDeleted: number;
  robotDeleted: number;
};

async function deleteJobFromFeed(job: NormalizedJob): Promise<void> {
  await prisma.job.deleteMany({
    where: {
      sourceSystem: job.sourceSystem,
      externalId: job.externalId,
    },
  });
}

async function deleteJobsMissingFromFeed(
  companyId: string,
  sourceSystem: SourceSystem,
  seenExternalIds: string[],
): Promise<number> {
  const where = seenExternalIds.length
    ? { companyId, sourceSystem, externalId: { notIn: seenExternalIds } }
    : { companyId, sourceSystem };
  const result = await prisma.job.deleteMany({ where });
  return result.count;
}

export async function upsertNormalizedJob(
  companyId: string,
  job: NormalizedJob,
): Promise<'created' | 'updated'> {
  const existing = await prisma.job.findUnique({
    where: {
      sourceSystem_externalId: {
        sourceSystem: job.sourceSystem,
        externalId: job.externalId,
      },
    },
    select: { id: true, isHidden: true },
  });

  const slug = slugify(job.title);
  const payload = {
    companyId,
    title: job.title,
    slug,
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
    postedAt: job.postedAt,
    lastSeenAt: new Date(),
    isActive: true,
    expiresAt: null,
  };

  const saved = await prisma.job.upsert({
    where: {
      sourceSystem_externalId: {
        sourceSystem: job.sourceSystem,
        externalId: job.externalId,
      },
    },
    create: {
      externalId: job.externalId,
      sourceSystem: job.sourceSystem,
      ...payload,
    },
    update: payload,
  });

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  await syncJobTaxonomy(saved.id, {
    title: job.title,
    descriptionPlain: job.descriptionPlain,
    department: job.department,
    sourceSystem: job.sourceSystem,
    companyName: company?.name ?? job.companyName,
  });

  return existing ? 'updated' : 'created';
}

async function syncJobTaxonomy(
  jobId: string,
  input: {
    title: string;
    descriptionPlain: string;
    department?: string | null;
    sourceSystem?: string | null;
    companyName?: string | null;
  },
  lookup?: TaxonomyLookup,
) {
  const classification = classifier.classify(input);
  let domainIds: string[] = [];
  let tagIds: string[] = [];
  let seniorityId: string | undefined;

  if (lookup) {
    domainIds = classification.domains
      .map((slug) => lookup.domainBySlug.get(slug)?.id)
      .filter((id): id is string => Boolean(id));
    tagIds = classification.techTags
      .map((slug) => lookup.tagBySlug.get(slug)?.id)
      .filter((id): id is string => Boolean(id));
    seniorityId = lookup.seniorityBySlug.get(classification.seniority)?.id;
  } else {
    const [domains, tags, seniority] = await Promise.all([
      prisma.robotDomain.findMany({ where: { slug: { in: classification.domains } } }),
      prisma.techTag.findMany({ where: { slug: { in: classification.techTags } } }),
      prisma.seniorityLevel.findFirst({ where: { slug: classification.seniority } }),
    ]);
    domainIds = domains.map((row) => row.id);
    tagIds = tags.map((row) => row.id);
    seniorityId = seniority?.id;
  }

  await prisma.$transaction([
    prisma.jobRobotDomain.deleteMany({ where: { jobId } }),
    prisma.jobTechTag.deleteMany({ where: { jobId } }),
    prisma.jobSeniority.deleteMany({ where: { jobId } }),
  ]);

  if (domainIds.length) {
    await prisma.jobRobotDomain.createMany({
      data: domainIds.map((domainId) => ({ jobId, domainId })),
    });
  }
  if (tagIds.length) {
    await prisma.jobTechTag.createMany({
      data: tagIds.map((techTagId) => ({ jobId, techTagId })),
    });
  }
  if (seniorityId) {
    await prisma.jobSeniority.create({
      data: { jobId, seniorityId },
    });
  }
}

type TaxonomyLookup = {
  domainBySlug: Map<string, { id: string; slug: string }>;
  tagBySlug: Map<string, { id: string; slug: string }>;
  seniorityBySlug: Map<string, { id: string; slug: string }>;
};

async function loadTaxonomyLookup(): Promise<TaxonomyLookup> {
  const [domains, tags, seniorities] = await Promise.all([
    prisma.robotDomain.findMany({ select: { id: true, slug: true } }),
    prisma.techTag.findMany({ select: { id: true, slug: true } }),
    prisma.seniorityLevel.findMany({ select: { id: true, slug: true } }),
  ]);
  return {
    domainBySlug: new Map(domains.map((row) => [row.slug, row])),
    tagBySlug: new Map(tags.map((row) => [row.slug, row])),
    seniorityBySlug: new Map(seniorities.map((row) => [row.slug, row])),
  };
}

export async function reviveNowAllowedJobs(): Promise<number> {
  const env = loadEnv();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - env.INGEST_INACTIVE_AFTER_DAYS);
  const inactive = await prisma.job.findMany({
    where: { isActive: false, isHidden: false, lastSeenAt: { gte: cutoff } },
    select: {
      id: true,
      title: true,
      department: true,
      country: true,
      region: true,
      city: true,
      locationRaw: true,
      isRemote: true,
    },
  });

  const revive: Array<{ id: string; country: string | null; region: string | null; city: string | null }> = [];
  for (const job of inactive) {
    if (!isRobotRole(job)) continue;
    const parsed = parseLocation(job.locationRaw);
    const country = job.country ?? parsed.country;
    const region = job.region ?? parsed.region;
    const city = job.city ?? parsed.city;
    if (
      !shouldIngestJob({
        title: job.title,
        country,
        region,
        city,
        locationRaw: job.locationRaw,
        isRemote: job.isRemote ?? false,
      })
    ) {
      continue;
    }
    revive.push({ id: job.id, country, region, city });
  }

  for (const job of revive) {
    await prisma.job.update({
      where: { id: job.id },
      data: {
        isActive: true,
        expiresAt: null,
        country: job.country,
        region: job.region,
        city: job.city,
      },
    });
  }
  return revive.length;
}

export async function reclassifyActiveJobs(): Promise<{ classified: number; locationsUpdated: number; revived: number }> {
  const revived = await reviveNowAllowedJobs();
  const lookup = await loadTaxonomyLookup();
  const jobs = await prisma.job.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      descriptionPlain: true,
      department: true,
      sourceSystem: true,
      locationRaw: true,
      country: true,
      region: true,
      city: true,
      company: { select: { name: true } },
    },
  });

  let locationsUpdated = 0;
  for (const job of jobs) {
    const parsed = parseLocation(job.locationRaw);
    if (!job.country && parsed.country) {
      await prisma.job.update({
        where: { id: job.id },
        data: {
          country: parsed.country,
          region: job.region ?? parsed.region,
          city: job.city ?? parsed.city,
        },
      });
      locationsUpdated += 1;
    }
    await syncJobTaxonomy(
      job.id,
      {
        title: job.title,
        descriptionPlain: job.descriptionPlain,
        department: job.department,
        sourceSystem: job.sourceSystem,
        companyName: job.company.name,
      },
      lookup,
    );
  }

  return { classified: jobs.length, locationsUpdated, revived };
}

export async function deleteStaleJobs(inactiveAfterDays: number): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - inactiveAfterDays);
  const result = await prisma.job.deleteMany({
    where: {
      isActive: true,
      lastSeenAt: { lt: cutoff },
    },
  });
  return result.count;
}

export async function purgeInactiveJobs(): Promise<number> {
  const result = await prisma.job.deleteMany({
    where: { isActive: false },
  });
  return result.count;
}

/** @deprecated Use deleteStaleJobs */
export const expireStaleJobs = deleteStaleJobs;

export async function expireNonRobotJobs(): Promise<number> {
  const active = await prisma.job.findMany({
    where: { isActive: true },
    select: { id: true, title: true, department: true },
  });
  const ids = active.filter((job) => !isRobotRole(job)).map((job) => job.id);
  if (!ids.length) return 0;
  let count = 0;
  for (let i = 0; i < ids.length; i += 500) {
    const chunk = ids.slice(i, i + 500);
    const result = await prisma.job.deleteMany({
      where: { id: { in: chunk } },
    });
    count += result.count;
  }
  return count;
}

export async function expireOutOfRegionJobs(): Promise<number> {
  const active = await prisma.job.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      country: true,
      region: true,
      city: true,
      locationRaw: true,
      isRemote: true,
    },
  });
  const ids = active.filter((job) => !shouldIngestJob(job)).map((job) => job.id);
  if (!ids.length) return 0;
  const result = await prisma.job.deleteMany({
    where: { id: { in: ids } },
  });
  return result.count;
}

export async function runIngestion(): Promise<RunMetrics> {
  const env = loadEnv();
  const feeds = await prisma.sourceFeedConfig.findMany({
    where: { active: true },
    include: { company: true },
  });

  const sources: SourceMetrics[] = [];

  for (const feed of feeds) {
    const metrics: SourceMetrics = {
      source: feed.sourceSystem,
      company: feed.company.name,
      fetched: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      deleted: 0,
      errors: [],
    };
    try {
      const config = (feed.config ?? {}) as FeedConfigJson;
      const jobs = await jobsForFeed(feed.sourceSystem, config);
      metrics.fetched = jobs.length;
      const seenExternalIds = jobs.map((job) => job.externalId);
      for (const job of jobs) {
        if (!shouldIngestJob(job)) {
          metrics.skipped += 1;
          await deleteJobFromFeed(job);
          continue;
        }
        if (!isRobotRole(job)) {
          metrics.skipped += 1;
          await deleteJobFromFeed(job);
          continue;
        }
        const result = await upsertNormalizedJob(feed.companyId, job);
        if (result === 'created') metrics.created += 1;
        else metrics.updated += 1;
      }
      metrics.deleted = await deleteJobsMissingFromFeed(feed.companyId, feed.sourceSystem, seenExternalIds);
    } catch (error) {
      metrics.errors.push(error instanceof Error ? error.message : String(error));
    }
    sources.push(metrics);
    console.log(
      JSON.stringify({
        event: 'ingest.source',
        ...metrics,
      }),
    );
  }

  const feedDeleted = sources.reduce((sum, row) => sum + row.deleted, 0);
  const [staleDeleted, geoDeleted, robotDeleted, legacyDeleted] = await Promise.all([
    deleteStaleJobs(env.INGEST_INACTIVE_AFTER_DAYS),
    expireOutOfRegionJobs(),
    expireNonRobotJobs(),
    purgeInactiveJobs(),
  ]);
  const deleted = feedDeleted + staleDeleted + legacyDeleted;
  const summary: RunMetrics = { sources, deleted, geoDeleted, robotDeleted };
  console.log(
    JSON.stringify({
      event: 'ingest.complete',
      ...summary,
      staleDeleted,
      legacyDeleted,
      feedDeleted,
    }),
  );
  return summary;
}
