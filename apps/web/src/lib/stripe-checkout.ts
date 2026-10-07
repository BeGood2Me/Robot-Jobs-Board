import { FEATURED_PRICE_CENTS } from '@/lib/featured-listing';
import { getSiteOrigin, getStripe } from '@/lib/stripe';

export async function createFeaturedCheckoutSession(options: {
  paidListingId: string;
  buyerEmail: string;
  productDescription: string;
  successPath: string;
  cancelUrl: string;
}): Promise<{ url: string; sessionId: string }> {
  const origin = getSiteOrigin();
  const stripe = getStripe();
  const priceId = process.env.STRIPE_FEATURED_PRICE_ID?.trim();

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: options.buyerEmail,
    client_reference_id: options.paidListingId,
    metadata: { paidListingId: options.paidListingId },
    success_url: `${origin}${options.successPath}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: options.cancelUrl.startsWith('http')
      ? options.cancelUrl
      : `${origin}${options.cancelUrl}`,
    managed_payments: { enabled: true },
    billing_address_collection: 'required',
    line_items: priceId
      ? [{ price: priceId, quantity: 1 }]
      : [
          {
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: FEATURED_PRICE_CENTS,
              tax_behavior: 'inclusive',
              product_data: {
                name: 'Featured robotics job — 30 days',
                description: options.productDescription,
                tax_code: 'txcd_10000000',
              },
            },
          },
        ],
  } as Parameters<typeof stripe.checkout.sessions.create>[0]);

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL.');
  }

  return { url: session.url, sessionId: session.id };
}
