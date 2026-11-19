'use client';

import { useEffect } from 'react';
import { trackJobView, type JobAnalyticsPayload } from '@/lib/vercel-job-analytics';

/** Fires a Vercel `Job View` custom event once per mount. */
export function JobViewTracker({ jobId, company, companyName, title }: JobAnalyticsPayload) {
  useEffect(() => {
    trackJobView({ jobId, company, companyName, title });
  }, [jobId, company, companyName, title]);

  return null;
}