export const LENSA_SPONSORED_HEADING = 'Sponsored job opportunities (US)';

export const LENSA_SPONSORED_DISCLOSURE =
  'Listings provided by Lensa. We may earn a fee when you click.';

export type LensaConnectJobContext = {
  isRemote: boolean;
  workplaceType?: string | null;
  city: string | null;
  country: string | null;
  region: string | null;
  locationRaw: string | null;
};

function locationHaystack(job: LensaConnectJobContext): string {
  return [job.locationRaw, job.city, job.region, job.country].filter(Boolean).join(' ').toLowerCase();
}

/** Lensa Connect is US CPC — show widget on US-ish job pages only. */
export function isUsJobContext(job: LensaConnectJobContext): boolean {
  const hay = locationHaystack(job);
  if (/\b(united states|usa|u\.s\.|u\.s\.a\.)\b/.test(hay)) return true;
  if (/\b(us|usa)\b/.test(hay) && job.isRemote) return true;
  if (
    /\b(california|ca|texas|tx|massachusetts|ma|washington|wa|new york|ny|colorado|co|pennsylvania|pa)\b/.test(hay)
  ) {
    return true;
  }
  if (job.isRemote && /\bremote\b/.test(hay)) return true;
  return false;
}

function sanFranciscoCampaignSrc(): string | null {
  if (process.env.DISABLE_LENSA_CONNECT === '1') return null;
  return (
    process.env.NEXT_PUBLIC_LENSA_CONNECT_WIDGET_SF?.trim() ||
    process.env.NEXT_PUBLIC_LENSA_CONNECT_WIDGET_SRC?.trim() ||
    null
  );
}

/** San Francisco Connect campaign only (single iframe per job page). */
export function lensaConnectForJob(job: LensaConnectJobContext): { heading: string; src: string } | null {
  if (!isUsJobContext(job)) return null;
  const src = sanFranciscoCampaignSrc();
  if (!src) return null;
  return { heading: LENSA_SPONSORED_HEADING, src };
}
