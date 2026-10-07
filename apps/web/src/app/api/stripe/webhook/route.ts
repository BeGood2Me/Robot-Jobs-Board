import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { prisma } from '@robot-jobs-board/db';
import { publishPaidListing } from '@/lib/publish-paid-listing';
import { revalidateFeaturedSurfaces } from '@/lib/revalidate-featured';
import { getStripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
    return { skipped: 'unpaid' as const };
  }

  const paidListingId = session.metadata?.paidListingId ?? session.client_reference_id ?? undefined;
  if (!paidListingId) {
    throw new Error('Missing paidListingId');
  }

  await prisma.paidListing.updateMany({
    where: { id: paidListingId, status: 'draft' },
    data: {
      status: 'paid',
      paidAt: new Date(),
      stripeSessionId: session.id,
    },
  });

  const published = await publishPaidListing(paidListingId);
  revalidateFeaturedSurfaces(published);
  return { received: true as const, ...published };
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid signature';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'checkout.session.async_payment_succeeded'
  ) {
    try {
      const session = event.data.object as Stripe.Checkout.Session;
      const result = await fulfillCheckoutSession(session);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Stripe fulfill failed', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Publish failed' },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ received: true });
}
