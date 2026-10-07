import { slugify } from '@/lib/site';

export const FEATURED_PRICE_CENTS = 14900;
export const FEATURED_DURATION_DAYS = 30;

/** Stack another 30 days from now, or from the current end if still Featured. */
export function extendFeaturedUntil(currentEnd: Date | string | null | undefined, from = new Date()): Date {
  const currentMs =
    currentEnd == null
      ? 0
      : typeof currentEnd === 'string'
        ? Date.parse(currentEnd)
        : currentEnd.getTime();
  const baseMs = Number.isFinite(currentMs) && currentMs > from.getTime() ? currentMs : from.getTime();
  return new Date(baseMs + FEATURED_DURATION_DAYS * 86_400_000);
}

export type FeaturedEmploymentType =
  | 'FULL_TIME'
  | 'PART_TIME'
  | 'CONTRACT'
  | 'INTERN'
  | 'TEMPORARY';

export type FeaturedWorkplaceType = 'ONSITE' | 'REMOTE' | 'HYBRID';

const EMPLOYMENTS = new Set<FeaturedEmploymentType>([
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERN',
  'TEMPORARY',
]);

const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Ireland',
  'Germany',
  'France',
  'Switzerland',
  'Netherlands',
  'Other',
] as const;

export const FEATURED_COUNTRIES = COUNTRIES;

export type FeaturedListingInput = {
  title: string;
  companyName: string;
  applyUrl: string;
  description: string;
  city: string;
  country: string;
  isRemote: boolean;
  employmentType: FeaturedEmploymentType;
  compensationText: string;
  buyerEmail: string;
};

export type FeaturedListingErrors = Partial<Record<keyof FeaturedListingInput, string>>;

function looksLikeUrlOrEmail(value: string): boolean {
  const v = value.trim().toLowerCase();
  return (
    /https?:\/\//.test(v) ||
    /^www\./.test(v) ||
    /\.(com|io|ai|org|net|co|dev|jobs)\b/.test(v) ||
    /@/.test(v)
  );
}

function plainToHtml(plain: string): string {
  const escaped = plain
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return escaped
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, '<br />')}</p>`)
    .join('');
}

export function validateFeaturedListing(raw: unknown): {
  data?: FeaturedListingInput;
  errors?: FeaturedListingErrors;
} {
  const body = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const errors: FeaturedListingErrors = {};

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : '';
  const applyUrl = typeof body.applyUrl === 'string' ? body.applyUrl.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const city = typeof body.city === 'string' ? body.city.trim() : '';
  const country = typeof body.country === 'string' ? body.country.trim() : '';
  const isRemote = Boolean(body.isRemote);
  const compensationText =
    typeof body.compensationText === 'string' ? body.compensationText.trim() : '';
  const buyerEmail = typeof body.buyerEmail === 'string' ? body.buyerEmail.trim().toLowerCase() : '';
  const employmentRaw = typeof body.employmentType === 'string' ? body.employmentType : 'FULL_TIME';

  if (!title) errors.title = 'Enter the job title.';
  else if (title.length > 120) errors.title = 'Keep the title under 120 characters.';
  else if (looksLikeUrlOrEmail(title)) errors.title = 'Use the job title here — not a link or email.';

  if (!companyName) errors.companyName = 'Enter the company name.';
  else if (companyName.length > 100) errors.companyName = 'Keep the company name under 100 characters.';
  else if (looksLikeUrlOrEmail(companyName)) {
    errors.companyName = 'Use the company name here — not a website or email.';
  }

  if (!applyUrl) errors.applyUrl = 'Paste the link where candidates apply.';
  else {
    try {
      const url = new URL(applyUrl);
      if (url.protocol !== 'https:') errors.applyUrl = 'Apply link must start with https://';
    } catch {
      errors.applyUrl = 'Enter a full https:// apply link (Greenhouse, Lever, Ashby, or careers page).';
    }
  }

  if (!description) errors.description = 'Paste or write the job description.';
  else if (description.length < 80) errors.description = 'Add a bit more detail (at least ~80 characters).';
  else if (description.length > 50_000) errors.description = 'Description is too long.';

  if (!isRemote) {
    if (!city) errors.city = 'Enter a city, or check Remote.';
    else if (looksLikeUrlOrEmail(city)) errors.city = 'Enter a city name — not a link.';
    if (!country || country === 'Other') errors.country = 'Enter or select a country, or check Remote.';
    else if (looksLikeUrlOrEmail(country)) errors.country = 'Enter a country name — not a link.';
  } else if (country === 'Other') {
    errors.country = 'Type the country or region, or leave blank for Worldwide.';
  } else if (country && looksLikeUrlOrEmail(country)) {
    errors.country = 'Enter a country name — not a link.';
  }

  if (!EMPLOYMENTS.has(employmentRaw as FeaturedEmploymentType)) {
    errors.employmentType = 'Pick an employment type.';
  }

  if (!buyerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
    errors.buyerEmail = 'Enter a valid email for your receipt.';
  }

  if (compensationText && looksLikeUrlOrEmail(compensationText)) {
    errors.compensationText = 'Use pay text here (e.g. $120k–$150k) — not a link.';
  }

  if (Object.keys(errors).length) return { errors };

  return {
    data: {
      title,
      companyName,
      applyUrl,
      description,
      city: isRemote ? '' : city,
      country: isRemote ? country || '' : country,
      isRemote,
      employmentType: employmentRaw as FeaturedEmploymentType,
      compensationText,
      buyerEmail,
    },
  };
}

/** Re-export workplace for publish; validateFeaturedListing stores isRemote only. */
export function workplaceFromInput(input: FeaturedListingInput): FeaturedWorkplaceType {
  return input.isRemote ? 'REMOTE' : 'ONSITE';
}

export function locationRawFromInput(input: FeaturedListingInput): string {
  if (input.isRemote) {
    return input.country && input.country !== 'Other' ? `Remote · ${input.country}` : 'Remote';
  }
  return [input.city, input.country].filter(Boolean).join(', ');
}

export function descriptionHtmlFromPlain(plain: string): string {
  return plainToHtml(plain);
}

export function companySlugFromName(name: string): string {
  return slugify(name);
}

export function jobSlugFromTitle(title: string): string {
  return slugify(title);
}
