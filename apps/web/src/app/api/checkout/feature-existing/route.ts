import { NextResponse } from 'next/server';
import { prisma } from '@robot-jobs-board/db';
import { apiRateLimitResponse } from '@/lib/api-rate-limit';
import { createFeaturedCheckoutSession } from '@/lib/stripe-checkout';
import { getJobById } from '@/lib/jobs';
import { isJobFeatured } from '@/lib/is-featured';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const limited = apiRateLimitResponse(request, { name: 'checkout-feature-existing', limit: 20 });
  if (limited) return limited;

  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    return NextResponse.json(
      { error: 'Checkout is not configured yet. Email hello@robotjobsboard.com.' },
      { status: 503 },
    );
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
  }

  let body: { jobId?: string; buyerEmail?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const jobId = typeof body.jobId === 'string' ? body.jobId.trim() : '';
  const buyerEmail =
    typeof body.buyerEmail === 'string' ? body.buyerEmail.trim().toLowerCase() : '';

  if (!jobId) {
    return NextResponse.json({ error: 'Missing job.' }, { status: 400 });
  }
  if (!buyerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
    return NextResponse.json({ error: 'Enter a valid email for your receipt.' }, { status: 400 });
  }

  const job = await getJobById(jobId);
  if (!job || !job.isActive || job.isHidden) {
    return NextResponse.json({ error: 'That job is not available to Feature.' }, { status: 404 });
  }

  const extending = isJobFeatured(job);

  const listing = await prisma.paidListing.create({
    data: {
      status: 'draft',
      title: job.title,
      companyName: job.company.name,
      applyUrl: job.url,
      description: job.descriptionPlain || job.title,
      locationRaw: job.locationRaw || '',
      city: job.city,
      country: job.country,
      isRemote: job.isRemote,
      workplaceType: job.workplaceType,
      employmentType: job.employmentType,
      compensationText: job.compensationText,
      buyerEmail,
      targetJobId: job.id,
      targetJobSlug: job.slug,
      isExtension: extending,
    },
  });

  const cancelPath = `/jobs/${job.id}/${job.slug}?canceled=1`;
  const label = extending ? 'Extend Featured' : 'Feature';

  try {
    const session = await createFeaturedCheckoutSession({
      paidListingId: listing.id,
      buyerEmail,
      productDescription: `${label}: ${job.title} at ${job.company.name}`,
      successPath: '/post-a-job/success',
      cancelUrl: cancelPath,
    });

    await prisma.paidListing.update({
      where: { id: listing.id },
      data: { stripeSessionId: session.sessionId },
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.sessionId,
      extending,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Stripe checkout failed.';
    console.error('feature-existing checkout failed', error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
