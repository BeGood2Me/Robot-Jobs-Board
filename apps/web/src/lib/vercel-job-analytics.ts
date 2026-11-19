import { track } from '@vercel/analytics';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** Vercel Web Analytics custom events — grouped in dashboard by these names. */
export const VERCEL_EVENT_JOB_VIEW = 'Job View';
export const VERCEL_EVENT_APPLY_CLICK = 'Apply Click';

export type JobAnalyticsPayload = {
  jobId: string;
  company: string;
  companyName: string;
  title: string;
};

/** Vercel limits custom property values to 255 characters. */
function clampAnalyticsString(value: string, max = 255): string {
  const trimmed = value.trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`;
}

function jobEventData(payload: JobAnalyticsPayload) {
  return {
    jobId: clampAnalyticsString(payload.jobId),
    company: clampAnalyticsString(payload.company),
    companyName: clampAnalyticsString(payload.companyName),
    title: clampAnalyticsString(payload.title),
  };
}

/** Once per job detail page load (client). */
export function trackJobView(payload: JobAnalyticsPayload) {
  track(VERCEL_EVENT_JOB_VIEW, jobEventData(payload));
  window.gtag?.('event', 'job_view', {
    job_id: payload.jobId,
    company: payload.company,
    company_name: payload.companyName,
    job_title: payload.title,
  });
}

/** Outbound apply / careers click (client). */
export function trackApplyClick(payload: JobAnalyticsPayload) {
  track(VERCEL_EVENT_APPLY_CLICK, jobEventData(payload));
  window.gtag?.('event', 'apply_click', {
    job_id: payload.jobId,
    company: payload.company,
    company_name: payload.companyName,
    job_title: payload.title,
  });
}