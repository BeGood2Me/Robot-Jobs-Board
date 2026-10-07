'use client';

import { useState, useTransition } from 'react';

type Props = {
  jobId: string;
  jobTitle: string;
  companyName: string;
  alreadyFeatured?: boolean;
};

export function FeatureJobButton({ jobId, jobTitle, companyName, alreadyFeatured }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const actionLabel = alreadyFeatured ? 'Extend Featured' : 'Feature this job';
  const payLabel = alreadyFeatured
    ? 'Pay $149 — extend 30 days'
    : 'Pay $149 — Feature for 30 days';

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/checkout/feature-existing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId, buyerEmail: email }),
        });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok) {
          setError(data.error ?? 'Could not start checkout.');
          return;
        }
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        setError('Checkout did not return a payment URL.');
      } catch {
        setError('Network error. Try again.');
      }
    });
  }

  return (
    <div className="rounded-2xl border border-line bg-card/50 p-5">
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">Employers</p>
      <p className="mt-2 text-sm text-muted">
        {alreadyFeatured ? (
          <>
            <span className="text-foreground">{jobTitle}</span> is Featured. Add another 30 days near
            the top of the board.
          </>
        ) : (
          <>
            Feature <span className="text-foreground">{jobTitle}</span> at{' '}
            <span className="text-foreground">{companyName}</span> near the top of the board for 30
            days.
          </>
        )}
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-lg border border-line px-4 text-sm font-semibold transition-opacity hover:border-accent/40 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent"
        >
          {actionLabel} — $149
        </button>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 space-y-3" noValidate>
          <div>
            <label htmlFor={`feature-email-${jobId}`} className="block text-sm font-semibold">
              Your email
            </label>
            <p className="mt-1 text-xs text-muted">For the Stripe receipt. Not shown publicly.</p>
            <input
              id={`feature-email-${jobId}`}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="mt-2 w-full max-w-md rounded-lg border border-line bg-card px-3 py-2.5 text-base outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg hover:opacity-90 disabled:opacity-60"
            >
              {pending ? 'Starting checkout…' : payLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              className="inline-flex h-10 items-center justify-center rounded-lg px-3 text-sm text-muted underline-offset-4 hover:underline"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
