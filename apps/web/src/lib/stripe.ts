import Stripe from 'stripe';

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  if (!stripe) {
    stripe = new Stripe(key);
  }
  return stripe;
}

export function getSiteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}
