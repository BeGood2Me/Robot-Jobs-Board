'use client';

import { track } from '@vercel/analytics';
import { PARTNER_APPLY_LINK_REL } from '@/lib/partner-listing';
import type { MarginReferralOffer } from '@/lib/margin-referral';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function MarginReferralAd({
  offer,
  layout,
}: {
  offer: MarginReferralOffer;
  layout: 'hero' | 'mobileFooter';
}) {
  function handleClick() {
    track('Margin Referral Click', { placement: offer.placement, variant: layout });
    window.gtag?.('event', 'margin_referral_click', { placement: offer.placement, variant: layout });
  }

  const isHero = layout === 'hero';

  return (
    <aside
      aria-labelledby={`margin-referral-heading-${layout}`}
      className={
        isHero
          ? 'hidden w-full max-w-[28.5625rem] shrink-0 rounded-2xl border border-line bg-card p-4 lg:block'
          : 'mt-4 rounded-xl border border-line bg-card p-4 lg:hidden'
      }
    >
      <p className="text-[10px] font-semibold tracking-wide text-muted uppercase">Sponsored</p>
      <h2
        id={`margin-referral-heading-${layout}`}
        className="mt-1.5 text-sm font-semibold text-balance leading-snug"
      >
        {offer.title}
      </h2>
      <p className="mt-2 text-xs leading-snug text-muted">
        Remote paid mechanical engineering projects on DataAnnotation.
      </p>
      <a
        href={offer.href}
        rel={PARTNER_APPLY_LINK_REL}
        target="_blank"
        onClick={handleClick}
        className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-lg border border-accent/50 bg-accent/10 px-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent/20 focus-visible:ring-2 focus-visible:ring-accent"
      >
        {offer.cta}
      </a>
    </aside>
  );
}
