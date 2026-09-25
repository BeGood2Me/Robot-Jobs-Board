'use client';

import { useId, useState, type FormEvent } from 'react';

type Status = 'idle' | 'loading' | 'success' | 'error';

export function NewsletterSignup({
  source = 'website',
  variant = 'hero',
}: {
  source?: string;
  variant?: 'hero' | 'footer';
}) {
  const inputId = useId();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'loading') return;
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setStatus('error');
        setMessage(data.error ?? 'Could not subscribe. Try again.');
        return;
      }
      setStatus('success');
      setMessage('Check your inbox to confirm your email.');
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Network error. Try again.');
    }
  }

  const isHero = variant === 'hero';

  return (
    <section
      aria-labelledby={isHero ? 'newsletter-heading' : undefined}
      className={
        isHero
          ? 'mt-8 rounded-2xl border border-accent/40 bg-gradient-to-br from-accent/15 via-card to-card p-5 md:mt-10 md:p-6'
          : 'rounded-xl border border-line bg-card p-5'
      }
    >
      <div className={isHero ? 'md:flex md:items-center md:justify-between md:gap-8' : undefined}>
        <div className="min-w-0 md:max-w-md">
          {isHero ? (
            <h2 id="newsletter-heading" className="text-xl font-semibold text-balance md:text-2xl">
              Stay in the loop on robotics hiring
            </h2>
          ) : (
            <p className="text-sm font-semibold">Robotics hiring updates</p>
          )}
        </div>

        {status === 'success' ? (
          <p className={`text-sm font-semibold text-foreground ${isHero ? 'mt-5 md:mt-0 md:max-w-sm' : 'mt-4'}`} role="status">
            {message}
          </p>
        ) : (
          <form
            onSubmit={onSubmit}
            className={`flex w-full flex-col gap-3 sm:flex-row sm:items-stretch ${isHero ? 'mt-5 md:mt-0 md:max-w-md' : 'mt-4'}`}
          >
            <label className="sr-only" htmlFor={inputId}>
              Email address
            </label>
            <input
              id={inputId}
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (status === 'error') {
                  setStatus('idle');
                  setMessage('');
                }
              }}
              placeholder="you@email.com"
              disabled={status === 'loading'}
              className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-background px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-accent px-4 text-base font-semibold text-accent-fg transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98] disabled:opacity-60"
            >
              {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
        )}
      </div>
      {status === 'error' && message ? (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {message}
        </p>
      ) : null}
      {status !== 'success' ? (
        <p className={`text-xs text-muted ${isHero ? 'mt-3' : 'mt-3'}`}>
          By subscribing you agree we may email you about robotics hiring. See our{' '}
          <a href="/privacy" className="underline hover:text-foreground">
            privacy policy
          </a>
          .
        </p>
      ) : null}
    </section>
  );
}
