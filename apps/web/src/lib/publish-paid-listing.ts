import { prisma } from '@robot-jobs-board/db';
import {
  FEATURED_DURATION_DAYS,
  companySlugFromName,
  descriptionHtmlFromPlain,
  extendFeaturedUntil,
  jobSlugFromTitle,
  locationRawFromInput,
  workplaceFromInput,
  type FeaturedListingInput,
} from '@/lib/featured-listing';

function uniqueSlug(base: string, existing: Set<string>): string {
  if (!existing.has(base)) return base;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base}-${i}`;
    if (!existing.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

function featuredWindow(from = new Date()) {
  return {
    now: from,
    featuredUntil: new Date(from.getTime() + FEATURED_DURATION_DAYS * 86_400_000),
  };
}

export type PublishResult = {
  jobId: string;
  jobSlug: string;
  title: string;
  extended: boolean;
};

/**
 * Feature or extend an existing board job.
 * Idempotent per Stripe session / PaidListing — webhook + success cannot double-stack +30d.
 */
async function publishExistingJobBoost(paidListingId: string): Promise<PublishResult> {
  return prisma.$transaction(async (tx) => {
    const listing = await tx.paidListing.findUnique({ where: { id: paidListingId } });
    if (!listing?.targetJobId) throw new Error(`PaidListing ${paidListingId} has no targetJobId`);

    const existingBoost = await tx.featuredBoost.findUnique({
      where: { jobId: listing.targetJobId },
    });

    // This payment already applied (stripe session or listing link).
    if (
      existingBoost &&
      ((listing.stripeSessionId && existingBoost.stripeSessionId === listing.stripeSessionId) ||
        existingBoost.paidListingId === listing.id)
    ) {
      if (listing.status !== 'paid') {
        await tx.paidListing.update({
          where: { id: listing.id },
          data: { status: 'paid', paidAt: listing.paidAt ?? new Date() },
        });
      }
      return {
        jobId: existingBoost.jobId,
        jobSlug: existingBoost.jobSlug,
        title: existingBoost.title,
        extended: listing.isExtension,
      };
    }

    const now = new Date();
    const neonJob = await tx.job.findUnique({
      where: { id: listing.targetJobId },
      select: { featuredUntil: true, featuredAt: true },
    });

    const currentEnd =
      existingBoost?.featuredUntil && existingBoost.featuredUntil > now
        ? existingBoost.featuredUntil
        : neonJob?.featuredUntil && neonJob.featuredUntil > now
          ? neonJob.featuredUntil
          : null;
    const featuredUntil = extendFeaturedUntil(currentEnd, now);
    const featuredAt = existingBoost?.featuredAt ?? neonJob?.featuredAt ?? now;
    const jobSlug =
      listing.targetJobSlug?.trim() ||
      existingBoost?.jobSlug ||
      jobSlugFromTitle(listing.title);

    // Atomic claim: only one worker applies a given stripeSessionId.
    if (existingBoost && listing.stripeSessionId) {
      const claimed = await tx.featuredBoost.updateMany({
        where: {
          jobId: listing.targetJobId,
          OR: [{ stripeSessionId: null }, { stripeSessionId: { not: listing.stripeSessionId } }],
        },
        data: {
          jobSlug,
          featuredUntil,
          featuredAt: existingBoost.featuredAt,
          buyerEmail: listing.buyerEmail,
          stripeSessionId: listing.stripeSessionId,
          paidListingId: listing.id,
          title: listing.title,
          companyName: listing.companyName,
        },
      });
      if (claimed.count === 0) {
        const boost = await tx.featuredBoost.findUniqueOrThrow({
          where: { jobId: listing.targetJobId },
        });
        await tx.paidListing.update({
          where: { id: listing.id },
          data: { status: 'paid', paidAt: listing.paidAt ?? now },
        });
        return {
          jobId: boost.jobId,
          jobSlug: boost.jobSlug,
          title: boost.title,
          extended: listing.isExtension,
        };
      }
    } else {
      await tx.featuredBoost.upsert({
        where: { jobId: listing.targetJobId },
        create: {
          jobId: listing.targetJobId,
          jobSlug,
          title: listing.title,
          companyName: listing.companyName,
          buyerEmail: listing.buyerEmail,
          featuredAt,
          featuredUntil,
          stripeSessionId: listing.stripeSessionId,
          paidListingId: listing.id,
        },
        update: {
          jobSlug,
          featuredUntil,
          buyerEmail: listing.buyerEmail,
          stripeSessionId: listing.stripeSessionId,
          paidListingId: listing.id,
          title: listing.title,
          companyName: listing.companyName,
        },
      });
    }

    await tx.job
      .updateMany({
        where: { id: listing.targetJobId },
        data: {
          featuredAt,
          featuredUntil,
          lastSeenAt: now,
          expiresAt: featuredUntil,
          isActive: true,
        },
      })
      .catch(() => undefined);

    await tx.paidListing.update({
      where: { id: listing.id },
      data: { status: 'paid', paidAt: listing.paidAt ?? now },
    });

    const boost = await tx.featuredBoost.findUniqueOrThrow({
      where: { jobId: listing.targetJobId },
    });

    return {
      jobId: boost.jobId,
      jobSlug: boost.jobSlug,
      title: boost.title,
      extended: listing.isExtension,
    };
  });
}

/**
 * Idempotent publish after Stripe payment.
 * - New post (no targetJobId): create Company + Job (sourceSystem=direct).
 * - Existing board job (targetJobId): FeaturedBoost overlay (+ extend if already Featured).
 */
export async function publishPaidListing(paidListingId: string): Promise<PublishResult> {
  const listing = await prisma.paidListing.findUnique({ where: { id: paidListingId } });
  if (!listing) throw new Error(`PaidListing ${paidListingId} not found`);

  if (listing.targetJobId) {
    return publishExistingJobBoost(paidListingId);
  }

  if (listing.jobId) {
    const existing = await prisma.job.findUnique({
      where: { id: listing.jobId },
      select: { id: true, slug: true, title: true },
    });
    if (existing) {
      return {
        jobId: existing.id,
        jobSlug: existing.slug,
        title: existing.title,
        extended: false,
      };
    }
  }

  // Recover after crash between job.create and PaidListing.jobId write.
  const byExternal = await prisma.job.findUnique({
    where: {
      sourceSystem_externalId: { sourceSystem: 'direct', externalId: listing.id },
    },
    select: { id: true, slug: true, title: true },
  });
  if (byExternal) {
    await prisma.paidListing.update({
      where: { id: listing.id },
      data: {
        status: 'paid',
        jobId: byExternal.id,
        paidAt: listing.paidAt ?? new Date(),
      },
    });
    return {
      jobId: byExternal.id,
      jobSlug: byExternal.slug,
      title: byExternal.title,
      extended: false,
    };
  }

  const input: FeaturedListingInput = {
    title: listing.title,
    companyName: listing.companyName,
    applyUrl: listing.applyUrl,
    description: listing.description,
    city: listing.city ?? '',
    country: listing.country ?? '',
    isRemote: listing.isRemote,
    employmentType: listing.employmentType,
    compensationText: listing.compensationText ?? '',
    buyerEmail: listing.buyerEmail,
  };

  const companyBase = companySlugFromName(input.companyName);
  let company = await prisma.company.findFirst({
    where: {
      OR: [
        { sourceSystem: 'direct', sourceIdentifier: companyBase },
        { sourceSystem: 'direct', slug: companyBase },
        { slug: companyBase, name: { equals: input.companyName, mode: 'insensitive' } },
      ],
    },
  });

  if (!company) {
    const taken = new Set(
      (
        await prisma.company.findMany({
          where: { slug: { startsWith: companyBase } },
          select: { slug: true },
        })
      ).map((c) => c.slug),
    );
    const slug = uniqueSlug(companyBase, taken);
    company = await prisma.company.create({
      data: {
        name: input.companyName,
        slug,
        website: null,
        description: `${input.companyName} hires robotics talent.`,
        seoIntro: `${input.companyName} jobs on Robot Jobs Board.`,
        sourceSystem: 'direct',
        sourceIdentifier: slug,
      },
    });
  }

  const jobBase = jobSlugFromTitle(input.title);
  const takenJobSlugs = new Set(
    (
      await prisma.job.findMany({
        where: { slug: { startsWith: jobBase } },
        select: { slug: true },
        take: 100,
      })
    ).map((j) => j.slug),
  );
  const jobSlug = uniqueSlug(jobBase, takenJobSlugs);
  const { now, featuredUntil } = featuredWindow();
  const plain = input.description;
  const html = descriptionHtmlFromPlain(plain);

  let job;
  try {
    job = await prisma.job.create({
      data: {
        externalId: listing.id,
        sourceSystem: 'direct',
        companyId: company.id,
        title: input.title,
        slug: jobSlug,
        descriptionHtml: html,
        descriptionPlain: plain,
        url: input.applyUrl,
        locationRaw: locationRawFromInput(input),
        country: input.country || null,
        city: input.isRemote ? null : input.city || null,
        isRemote: input.isRemote,
        workplaceType: workplaceFromInput(input),
        employmentType: input.employmentType,
        compensationText: input.compensationText || null,
        postedAt: now,
        expiresAt: featuredUntil,
        lastSeenAt: now,
        isActive: true,
        isHidden: false,
        featuredAt: now,
        featuredUntil,
      },
    });
  } catch {
    const recovered = await prisma.job.findUnique({
      where: {
        sourceSystem_externalId: { sourceSystem: 'direct', externalId: listing.id },
      },
      select: { id: true, slug: true, title: true },
    });
    if (!recovered) throw new Error(`Failed to create job for PaidListing ${listing.id}`);
    job = recovered;
  }

  await prisma.paidListing.update({
    where: { id: listing.id },
    data: {
      status: 'paid',
      jobId: job.id,
      paidAt: listing.paidAt ?? now,
    },
  });

  return { jobId: job.id, jobSlug: job.slug, title: job.title, extended: false };
}
