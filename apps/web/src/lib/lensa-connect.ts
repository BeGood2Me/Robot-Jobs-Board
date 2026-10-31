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

const NON_US_MARKERS =
  /\b(united kingdom|u\.k\.|england|scotland|wales|northern ireland|germany|france|spain|italy|netherlands|belgium|sweden|norway|denmark|finland|poland|portugal|ireland|switzerland|austria|canada|india|china|japan|singapore|australia|new zealand|mexico|brazil)\b/;

const US_STATE_ABBR = /,\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b/i;

/** Lensa Connect is US CPC — show widget on US-ish job pages only. */
export function isUsJobContext(job: LensaConnectJobContext): boolean {
  const hay = locationHaystack(job);
  if (NON_US_MARKERS.test(hay) && !/\b(united states|usa|u\.s\.|u\.s\.a\.)\b/.test(hay)) {
    return false;
  }
  if (/\b(united states|usa|u\.s\.|u\.s\.a\.)\b/.test(hay)) return true;
  if (US_STATE_ABBR.test(hay)) return true;
  if (/\b(california|texas|massachusetts|washington|new york|colorado|pennsylvania)\b/.test(hay)) {
    return true;
  }
  if (job.isRemote && /\bremote\b/.test(hay) && !NON_US_MARKERS.test(hay)) return true;
  if (job.isRemote && !job.country) return true;
  return false;
}

function sanFranciscoCampaignSrc(): string | null {
  if (process.env.DISABLE_LENSA_CONNECT === '1') return null;
  return (
    process.env.LENSA_CONNECT_WIDGET_SF?.trim() ||
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
