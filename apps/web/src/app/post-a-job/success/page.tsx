import Link from 'next/link';
import { publishPaidListing } from '@/lib/publish-paid-listing';
import { revalidateFeaturedSurfaces } from '@/lib/revalidate-featured';
import { getStripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ session_id?: string }> };

export default async function PostAJobSuccessPage({ searchParams }: Props) {
  const { session_id: sessionId } = await searchParams;

  let jobHref: string | null = null;
  let title: string | null = null;
  let extended = false;
  let error: string | null = null;

  if (!sessionId) {
    error = 'Missing checkout session.';
  } else if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    error = 'Stripe is not configured.';
  } else {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      const paidListingId =
        session.metadata?.paidListingId ?? session.client_reference_id ?? undefined;

      if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
        error = 'Payment is not complete yet. Refresh in a moment.';
      } else if (!paidListingId) {
        error = 'Could not find your listing for this payment.';
      } else {
        const published = await publishPaidListing(paidListingId);
        revalidateFeaturedSurfaces(published);
        jobHref = `/jobs/${published.jobId}/${published.jobSlug}`;
        title = published.title;
        extended = published.extended;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Could not confirm payment.';
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      {jobHref && title ? (
        <>
          <h1 className="text-4xl font-semibold">
            {extended ? 'Featured extended' : 'Your job is Featured'}
          </h1>
          <p className="mt-4 text-lg text-muted">
            <span className="text-foreground">{title}</span>
            {extended
              ? ' stays near the top of the board for another 30 days.'
              : ' is near the top of the board for 30 days.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={jobHref}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-accent px-5 text-base font-semibold text-accent-fg hover:opacity-90"
            >
              View your listing
            </Link>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-line px-5 text-base font-semibold hover:border-accent/40"
            >
              Back to board
            </Link>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-4xl font-semibold">Almost there</h1>
          <p className="mt-4 text-lg text-muted">{error ?? 'Confirming your payment…'}</p>
          <p className="mt-6 text-sm text-muted">
            If you were charged, email{' '}
            <a href="mailto:hello@robotjobsboard.com" className="underline">
              hello@robotjobsboard.com
            </a>{' '}
            with your Stripe receipt.
          </p>
          <Link href="/post-a-job" className="mt-8 inline-block text-sm underline">
            Back to post a job
          </Link>
        </>
      )}
    </div>
  );
}
