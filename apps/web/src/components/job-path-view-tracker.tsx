'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { VERCEL_EVENT_JOB_VIEW } from '@/lib/vercel-job-analytics';
import { track } from '@vercel/analytics';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const JOB_PATH = /^\/jobs\/([^/]+)\/([^/]+)\/?$/;

/**
 * Fires Vercel `Job View` on job detail URLs from the client bundle so ISR-cached
 * job HTML still records views after new analytics code ships.
 */
export function JobPathViewTracker() {
  const pathname = usePathname();
  const lastJobId = useRef<string | null>(null);

  useEffect(() => {
    const match = pathname?.match(JOB_PATH);
    if (!match) {
      lastJobId.current = null;
      return;
    }
    const jobId = match[1];
    const slug = match[2];
    if (lastJobId.current === jobId) return;
    lastJobId.current = jobId;

    track(VERCEL_EVENT_JOB_VIEW, {
      jobId,
      slug,
      path: pathname ?? '',
    });
    window.gtag?.('event', 'job_view', { job_id: jobId, job_slug: slug });
  }, [pathname]);

  return null;
}