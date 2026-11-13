export type MarginReferralOffer = {
  href: string;
  title: string;
  description: string;
  cta: string;
  placement: string;
};

/** Homepage referral: hero right of title (lg+); below pagination on mobile. Not a job listing. */
function marginReferralEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_HOME_MARGIN_REFERRAL?.trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

export function getHomeMarginReferralOffer(): MarginReferralOffer | null {
  const href =
    process.env.NEXT_PUBLIC_HOME_MARGIN_REFERRAL_URL?.trim() ??
    process.env.HOME_MARGIN_REFERRAL_URL?.trim();
  if (!marginReferralEnabled() || !href?.startsWith('https://')) return null;

  return {
    href,
    placement: 'me-dataannotation',
    title: 'Flexible Remote Mechanical Engineering Work',
    description:
      'Paid AI training projects for mechanical engineering on DataAnnotation.',
    cta: 'Learn more',
  };
}
