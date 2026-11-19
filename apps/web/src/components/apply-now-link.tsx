'use client';

import { PARTNER_APPLY_LINK_REL } from '@/lib/partner-listing';
import { trackApplyClick } from '@/lib/vercel-job-analytics';

type ApplyNowLinkProps = {
  href: string;
  jobId: string;
  jobTitle: string;
  companySlug: string;
  companyName: string;
  className?: string;
  /** Partner/referral listings — `rel="sponsored"`; does not change the apply URL. */
  sponsored?: boolean;
};

export function ApplyNowLink({
  href,
  jobId,
  jobTitle,
  companySlug,
  companyName,
  className,
  sponsored = false,
}: ApplyNowLinkProps) {
  function handleClick() {
    trackApplyClick({
      jobId,
      company: companySlug,
      companyName,
      title: jobTitle,
    });
  }

  return (
    <a
      href={href}
      target="_blank"
      rel={sponsored ? PARTNER_APPLY_LINK_REL : 'noopener noreferrer'}
      onClick={handleClick}
      className={
        className ??
        'inline-flex h-10 items-center rounded-lg bg-accent px-3 text-base font-semibold text-accent-fg transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98]'
      }
    >
      Apply now
    </a>
  );
}
