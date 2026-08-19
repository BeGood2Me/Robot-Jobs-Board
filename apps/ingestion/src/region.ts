import type { NormalizedJob } from './types';

/** Canonical country names we publish. USA, UK, EU, Canada, and Australia. */
export const ALLOWED_COUNTRIES = new Set([
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Ireland',
  'France',
  'Germany',
  'Spain',
  'Italy',
  'Netherlands',
  'Belgium',
  'Portugal',
  'Sweden',
  'Denmark',
  'Finland',
  'Norway',
  'Switzerland',
  'Austria',
  'Poland',
  'Czech Republic',
  'Czechia',
  'Hungary',
  'Romania',
  'Greece',
  'Slovakia',
  'Slovenia',
  'Croatia',
  'Bulgaria',
  'Estonia',
  'Latvia',
  'Lithuania',
  'Luxembourg',
  'Malta',
  'Cyprus',
  'Iceland',
  'Liechtenstein',
  'Monaco',
  'Andorra',
]);

const ALLOWED_LOCATION_TERMS = [
  'united states',
  'united states of america',
  'usa',
  'u.s.',
  'u.s.a.',
  'united kingdom',
  'great britain',
  'britain',
  'england',
  'scotland',
  'wales',
  'northern ireland',
  'uk&i',
  'uki',
  'european union',
  'european union (eu)',
  'eea',
  'schengen',
  'eurozone',
  'ireland',
  'republic of ireland',
  'france',
  'germany',
  'deutschland',
  'spain',
  'espana',
  'españa',
  'italy',
  'italia',
  'netherlands',
  'holland',
  'belgium',
  'portugal',
  'sweden',
  'denmark',
  'finland',
  'norway',
  'switzerland',
  'schweiz',
  'suisse',
  'austria',
  'österreich',
  'osterreich',
  'poland',
  'polska',
  'czech',
  'czechia',
  'hungary',
  'romania',
  'greece',
  'slovakia',
  'slovenia',
  'croatia',
  'bulgaria',
  'estonia',
  'latvia',
  'lithuania',
  'luxembourg',
  'malta',
  'cyprus',
  'iceland',
  'liechtenstein',
  'monaco',
  'andorra',
  'catalonia',
  'catalunya',
  'bavaria',
  'bayern',
  'ile-de-france',
  'île-de-france',
  'hauts-de-france',
  'north holland',
  'south holland',
  'canada',
  'ontario',
  'quebec',
  'british columbia',
  'alberta',
  'manitoba',
  'nova scotia',
  'new brunswick',
  'saskatchewan',
  'australia',
  'new south wales',
  'victoria',
  'queensland',
  'western australia',
  'south australia',
  'tasmania',
];

const DENIED_LOCATION_TERMS = [
  'mexico',
  'méxico',
  'brazil',
  'brasil',
  'india',
  'japan',
  'singapore',
  'china',
  'hong kong',
  'taiwan',
  'korea',
  'seoul',
  'tokyo',
  'osaka',
  'israel',
  'united arab emirates',
  'uae',
  'dubai',
  'saudi',
  'qatar',
  'vietnam',
  'philippines',
  'thailand',
  'malaysia',
  'indonesia',
  'south africa',
  'nigeria',
  'egypt',
  'chile',
  'argentina',
  'colombia',
  'peru',
  'costa rica',
  'new zealand',
  'hyderabad',
  'bengaluru',
  'bangalore',
  'mumbai',
  'tel aviv',
  'apac',
];

const EUROPEAN_CITIES = new Set([
  'london',
  'cambridge',
  'oxford',
  'manchester',
  'birmingham',
  'edinburgh',
  'bristol',
  'dublin',
  'cork',
  'paris',
  'lyon',
  'lille',
  'toulouse',
  'wasquehal',
  'munich',
  'münchen',
  'berlin',
  'hamburg',
  'stuttgart',
  'augsburg',
  'zurich',
  'zürich',
  'geneva',
  'basel',
  'barcelona',
  'madrid',
  'amsterdam',
  'rotterdam',
  'eindhoven',
  'delft',
  'stockholm',
  'oslo',
  'copenhagen',
  'helsinki',
  'vienna',
  'wien',
  'milan',
  'milano',
  'turin',
  'bologna',
  'rome',
  'warsaw',
  'prague',
  'budapest',
  'lisbon',
  'porto',
  'brussels',
  'bruxelles',
  'antwerp',
  'paudex',
  'lausanne',
]);

const CANADIAN_CITIES = new Set([
  'toronto',
  'vancouver',
  'montreal',
  'montréal',
  'ottawa',
  'calgary',
  'edmonton',
  'waterloo',
  'kitchener',
  'mississauga',
  'hamilton',
  'winnipeg',
  'halifax',
  'victoria',
  'quebec city',
  'québec',
  'yellowknife',
]);

const AUSTRALIAN_CITIES = new Set([
  'sydney',
  'melbourne',
  'brisbane',
  'perth',
  'adelaide',
  'canberra',
  'hobart',
  'newcastle',
  'darwin',
]);

const US_PLACE_TERMS = [
  'california',
  'texas',
  'ohio',
  'oregon',
  'washington',
  'massachusetts',
  'colorado',
  'minnesota',
  'georgia',
  'florida',
  'illinois',
  'pennsylvania',
  'new york',
  'new jersey',
  'north carolina',
  'south carolina',
  'virginia',
  'arizona',
  'michigan',
  'wisconsin',
  'indiana',
  'tennessee',
  'missouri',
  'maryland',
  'connecticut',
  'utah',
  'nevada',
  'alabama',
  'louisiana',
  'kentucky',
  'oklahoma',
  'iowa',
  'kansas',
  'arkansas',
  'mississippi',
  'nebraska',
  'idaho',
  'new mexico',
  'new hampshire',
  'rhode island',
  'west virginia',
  'delaware',
  'montana',
  'wyoming',
  'north dakota',
  'south dakota',
  'alaska',
  'hawaii',
  'district of columbia',
  'san francisco',
  'bay area',
  'new york city',
  'nyc',
  'sf',
  'fremont',
  'boston',
  'somerville',
  'san mateo',
  'mountain view',
  'palo alto',
  'sunnyvale',
  'redwood city',
  'waltham',
  'austin',
  'seattle',
  'pittsburgh',
  'chicago',
  'atlanta',
  'columbus',
  'salem',
];

const CATCH_ALL_TITLE =
  /\b(general resume|resume submittal|talent (community|network|hub|pool)|don'?t see a (role|position)|open application|speculative application|join our talent|expression of interest)\b/i;

function wordBoundaryTerm(term: string): RegExp {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
}

const ALLOWED_PATTERNS = [...ALLOWED_LOCATION_TERMS, ...US_PLACE_TERMS].map(wordBoundaryTerm);
const DENIED_PATTERNS = DENIED_LOCATION_TERMS.map(wordBoundaryTerm);

function haystack(parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(' , ').toLowerCase();
}

function hasAllowedSignal(text: string): boolean {
  if (/\b(uk|eu|gb|ie)\b/i.test(text)) return true;
  if (/\beurope\b/i.test(text) && !/\bmiddle east\b/i.test(text)) return true;
  return ALLOWED_PATTERNS.some((pattern) => pattern.test(text));
}

function hasDeniedSignal(text: string): boolean {
  return DENIED_PATTERNS.some((pattern) => pattern.test(text));
}

export function isCatchAllTitle(title: string): boolean {
  return CATCH_ALL_TITLE.test(title);
}

export function isAllowedJobLocation(job: {
  country?: string | null;
  region?: string | null;
  city?: string | null;
  locationRaw?: string | null;
  isRemote?: boolean;
}): boolean {
  const text = haystack([job.locationRaw, job.country, job.region, job.city]);
  const allowed = hasAllowedSignal(text) || (job.country ? ALLOWED_COUNTRIES.has(job.country) : false);
  const denied = hasDeniedSignal(text);

  if (allowed) return true;
  if (denied) return false;

  const city = (job.city ?? '').trim().toLowerCase();
  if (city && EUROPEAN_CITIES.has(city)) return true;
  if (city && CANADIAN_CITIES.has(city)) return true;
  if (city && AUSTRALIAN_CITIES.has(city)) return true;

  return false;
}

export function shouldIngestJob(job: Pick<NormalizedJob, 'title' | 'country' | 'region' | 'city' | 'locationRaw' | 'isRemote'>): boolean {
  if (isCatchAllTitle(job.title)) return false;
  return isAllowedJobLocation(job);
}
