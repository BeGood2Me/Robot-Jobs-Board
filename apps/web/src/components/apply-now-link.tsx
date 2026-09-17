'use client';

import { track } from '@vercel/analytics';

type ApplyNowLinkProps = {
  href: string;
  jobId: string;
  jobTitle: string;
  companySlug: string;
  companyName: string;
  className?: string;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function ApplyNowLink({
  href,
  jobId,
  jobTitle,
  companySlug,
  companyName,
  className,
}: ApplyNowLinkProps) {
  function handleClick() {
    track('Apply Click', {
      jobId,
      company: companySlug,
      companyName,
      title: jobTitle,
    });
    window.gtag?.('event', 'apply_click', {
      job_id: jobId,
      company: companySlug,
      company_name: companyName,
      job_title: jobTitle,
    });
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
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
