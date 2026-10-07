import { NextResponse } from 'next/server';
import { prisma } from '@robot-jobs-board/db';
import { apiRateLimitResponse } from '@/lib/api-rate-limit';
import {
  locationRawFromInput,
  validateFeaturedListing,
  workplaceFromInput,
} from '@/lib/featured-listing';
import { createFeaturedCheckoutSession } from '@/lib/stripe-checkout';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const limited = apiRateLimitResponse(request, { name: 'checkout-featured', limit: 20 });
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { data, errors } = validateFeaturedListing(body);
  if (!data || errors) {
    return NextResponse.json(
      { error: 'Fix the highlighted fields.', errors: errors ?? {} },
      { status: 400 },
    );
  }

  const listing = await prisma.paidListing.create({
    data: {
      status: 'draft',
      title: data.title,
      companyName: data.companyName,
      applyUrl: data.applyUrl,
      description: data.description,
      locationRaw: locationRawFromInput(data),
      city: data.city || null,
      country: data.country || null,
      isRemote: data.isRemote,
      workplaceType: workplaceFromInput(data),
      employmentType: data.employmentType,
      compensationText: data.compensationText || null,
      buyerEmail: data.buyerEmail,
    },
  });

  try {
    const session = await createFeaturedCheckoutSession({
      paidListingId: listing.id,
      buyerEmail: data.buyerEmail,
      productDescription: `${data.title} at ${data.companyName}`,
      successPath: '/post-a-job/success',
      cancelUrl: '/post-a-job?canceled=1',
    });

    await prisma.paidListing.update({
      where: { id: listing.id },
      data: { stripeSessionId: session.sessionId },
    });

    return NextResponse.json({ url: session.url, sessionId: session.sessionId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Stripe checkout failed.';
    console.error('Stripe checkout.sessions.create failed', error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
