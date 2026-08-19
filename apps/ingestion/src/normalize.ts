export function slugify(input: string, maxLength = 80): string {
  const slug = input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/g, '');
  return slug || 'role';
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/gi, (_, dec: string) => String.fromCodePoint(Number(dec)));
}

function looksLikeEscapedHtml(value: string): boolean {
  return /&lt;\s*\/?\s*[a-z]|&amp;lt;/i.test(value.slice(0, 4000));
}

/** Greenhouse and others often store job HTML as `&lt;p&gt;...` instead of real tags. */
export function decodeJobHtml(html: string): string {
  let current = html ?? '';
  for (let i = 0; i < 3; i++) {
    if (!looksLikeEscapedHtml(current)) break;
    current = decodeHtmlEntities(current);
  }
  return current;
}

export function htmlToPlain(html: string): string {
  return decodeJobHtml(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

const US_STATES: Record<string, string> = {
  al: 'Alabama',
  ak: 'Alaska',
  az: 'Arizona',
  ar: 'Arkansas',
  ca: 'California',
  co: 'Colorado',
  ct: 'Connecticut',
  de: 'Delaware',
  fl: 'Florida',
  ga: 'Georgia',
  hi: 'Hawaii',
  id: 'Idaho',
  il: 'Illinois',
  in: 'Indiana',
  ia: 'Iowa',
  ks: 'Kansas',
  ky: 'Kentucky',
  la: 'Louisiana',
  me: 'Maine',
  md: 'Maryland',
  ma: 'Massachusetts',
  mi: 'Michigan',
  mn: 'Minnesota',
  ms: 'Mississippi',
  mo: 'Missouri',
  mt: 'Montana',
  ne: 'Nebraska',
  nv: 'Nevada',
  nh: 'New Hampshire',
  nj: 'New Jersey',
  nm: 'New Mexico',
  ny: 'New York',
  nc: 'North Carolina',
  nd: 'North Dakota',
  oh: 'Ohio',
  ok: 'Oklahoma',
  or: 'Oregon',
  pa: 'Pennsylvania',
  ri: 'Rhode Island',
  sc: 'South Carolina',
  sd: 'South Dakota',
  tn: 'Tennessee',
  tx: 'Texas',
  ut: 'Utah',
  vt: 'Vermont',
  va: 'Virginia',
  wa: 'Washington',
  wv: 'West Virginia',
  wi: 'Wisconsin',
  wy: 'Wyoming',
  dc: 'District of Columbia',
};

const US_STATE_BY_NAME: Record<string, string> = Object.fromEntries(
  Object.values(US_STATES).map((name) => [name.toLowerCase(), name]),
);

const CA_PROVINCES: Record<string, string> = {
  on: 'Ontario',
  bc: 'British Columbia',
  qc: 'Quebec',
  ab: 'Alberta',
  mb: 'Manitoba',
  ns: 'Nova Scotia',
  nb: 'New Brunswick',
  pe: 'Prince Edward Island',
  yt: 'Yukon',
  nt: 'Northwest Territories',
  nu: 'Nunavut',
  ontario: 'Ontario',
  'british columbia': 'British Columbia',
  quebec: 'Quebec',
  québec: 'Quebec',
  alberta: 'Alberta',
  manitoba: 'Manitoba',
  'nova scotia': 'Nova Scotia',
  'new brunswick': 'New Brunswick',
  saskatchewan: 'Saskatchewan',
  'prince edward island': 'Prince Edward Island',
  yukon: 'Yukon',
  'northwest territories': 'Northwest Territories',
  nunavut: 'Nunavut',
  'newfoundland and labrador': 'Newfoundland and Labrador',
};

const AU_STATES: Record<string, string> = {
  nsw: 'New South Wales',
  vic: 'Victoria',
  qld: 'Queensland',
  tas: 'Tasmania',
  act: 'Australian Capital Territory',
  'new south wales': 'New South Wales',
  victoria: 'Victoria',
  queensland: 'Queensland',
  'western australia': 'Western Australia',
  'south australia': 'South Australia',
  tasmania: 'Tasmania',
  'australian capital territory': 'Australian Capital Territory',
  'northern territory': 'Northern Territory',
};

const CANADA_CITIES_AMBIGUOUS_CA = new Set([
  'vancouver',
  'toronto',
  'montreal',
  'montréal',
  'ottawa',
  'calgary',
  'edmonton',
  'waterloo',
  'kitchener',
  'winnipeg',
  'halifax',
]);

function stripOfficeNotes(value: string): string {
  return value
    .replace(/\((?:hq|hybrid|remote|on-?site|office|post)\)/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isUsStateToken(value: string): boolean {
  const key = stripOfficeNotes(value).toLowerCase();
  return Boolean(US_STATES[key] || US_STATE_BY_NAME[key]);
}

function isCaProvinceToken(value: string): boolean {
  return Boolean(CA_PROVINCES[stripOfficeNotes(value).toLowerCase()]);
}

function isAuStateToken(value: string): boolean {
  return Boolean(AU_STATES[stripOfficeNotes(value).toLowerCase()]);
}

function isCanadaCaAmbiguous(city: string | undefined, region: string): boolean {
  const cityKey = stripOfficeNotes(city ?? '').toLowerCase();
  const regionKey = stripOfficeNotes(region).toLowerCase();
  return regionKey === 'ca' && CANADA_CITIES_AMBIGUOUS_CA.has(cityKey);
}

function isAuNorthernTerritory(city: string | undefined, region: string): boolean {
  const cityKey = stripOfficeNotes(city ?? '').toLowerCase();
  const regionKey = stripOfficeNotes(region).toLowerCase();
  return regionKey === 'nt' && ['darwin', 'palmerston', 'alice springs'].includes(cityKey);
}

function assignPlaceFromParts(
  cityPart: string | undefined,
  regionPart: string,
  countryPart?: string,
): { city: string | null; region: string | null; country: string | null } {
  const city = cleanPlace(cityPart);
  const tailCountry = countryPart ? expandCountry(countryPart) : null;
  if (isAuNorthernTerritory(cityPart, regionPart)) {
    return { city, region: 'Northern Territory', country: tailCountry ?? 'Australia' };
  }
  if (isCanadaCaAmbiguous(cityPart, regionPart) || isCaProvinceToken(regionPart)) {
    return { city, region: expandCaRegion(regionPart), country: tailCountry ?? 'Canada' };
  }
  if (isAuStateToken(regionPart)) {
    return { city, region: expandAuRegion(regionPart), country: tailCountry ?? 'Australia' };
  }
  if (isUsStateToken(regionPart)) {
    return { city, region: expandRegion(regionPart), country: tailCountry ?? 'United States' };
  }
  if (!countryPart) {
    const asCountry = expandCountry(regionPart);
    if (asCountry) return { city, region: null, country: asCountry };
  }
  return {
    city,
    region: expandRegion(regionPart),
    country: tailCountry,
  };
}

const COUNTRY_ALIASES: Record<string, string> = {
  usa: 'United States',
  us: 'United States',
  'u.s.': 'United States',
  'u.s.a.': 'United States',
  'united states': 'United States',
  'united states of america': 'United States',
  uk: 'United Kingdom',
  gb: 'United Kingdom',
  'united kingdom': 'United Kingdom',
  'great britain': 'United Kingdom',
  britain: 'United Kingdom',
  england: 'United Kingdom',
  scotland: 'United Kingdom',
  wales: 'United Kingdom',
  'northern ireland': 'United Kingdom',
  ireland: 'Ireland',
  ie: 'Ireland',
  'republic of ireland': 'Ireland',
  germany: 'Germany',
  de: 'Germany',
  deutschland: 'Germany',
  france: 'France',
  fr: 'France',
  spain: 'Spain',
  es: 'Spain',
  espana: 'Spain',
  españa: 'Spain',
  catalonia: 'Spain',
  catalunya: 'Spain',
  italy: 'Italy',
  it: 'Italy',
  italia: 'Italy',
  netherlands: 'Netherlands',
  nl: 'Netherlands',
  holland: 'Netherlands',
  belgium: 'Belgium',
  be: 'Belgium',
  portugal: 'Portugal',
  pt: 'Portugal',
  sweden: 'Sweden',
  se: 'Sweden',
  denmark: 'Denmark',
  dk: 'Denmark',
  finland: 'Finland',
  fi: 'Finland',
  norway: 'Norway',
  switzerland: 'Switzerland',
  ch: 'Switzerland',
  schweiz: 'Switzerland',
  suisse: 'Switzerland',
  austria: 'Austria',
  at: 'Austria',
  poland: 'Poland',
  pl: 'Poland',
  'czech republic': 'Czech Republic',
  czechia: 'Czech Republic',
  cz: 'Czech Republic',
  hungary: 'Hungary',
  hu: 'Hungary',
  romania: 'Romania',
  ro: 'Romania',
  greece: 'Greece',
  gr: 'Greece',
  slovakia: 'Slovakia',
  sk: 'Slovakia',
  slovenia: 'Slovenia',
  si: 'Slovenia',
  croatia: 'Croatia',
  hr: 'Croatia',
  bulgaria: 'Bulgaria',
  bg: 'Bulgaria',
  estonia: 'Estonia',
  ee: 'Estonia',
  latvia: 'Latvia',
  lv: 'Latvia',
  lithuania: 'Lithuania',
  lt: 'Lithuania',
  luxembourg: 'Luxembourg',
  lu: 'Luxembourg',
  malta: 'Malta',
  mt: 'Malta',
  cyprus: 'Cyprus',
  cy: 'Cyprus',
  iceland: 'Iceland',
  liechtenstein: 'Liechtenstein',
  monaco: 'Monaco',
  andorra: 'Andorra',
  canada: 'Canada',
  mexico: 'Mexico',
  mx: 'Mexico',
  brazil: 'Brazil',
  br: 'Brazil',
  brasil: 'Brazil',
  japan: 'Japan',
  jp: 'Japan',
  australia: 'Australia',
  au: 'Australia',
  singapore: 'Singapore',
  sg: 'Singapore',
  india: 'India',
  israel: 'Israel',
  il: 'Israel',
  china: 'China',
  cn: 'China',
  'south korea': 'South Korea',
  kr: 'South Korea',
  korea: 'South Korea',
  'united arab emirates': 'United Arab Emirates',
  uae: 'United Arab Emirates',
};

export type ParsedLocation = {
  locationRaw: string;
  country: string | null;
  region: string | null;
  city: string | null;
  isRemote: boolean;
  workplaceType: 'ONSITE' | 'REMOTE' | 'HYBRID';
};

export function parseLocation(raw: string | null | undefined): ParsedLocation {
  const locationRaw = (raw ?? '').trim() || 'Unspecified';
  const lower = locationRaw.toLowerCase();
  const isRemote = /\bremote\b|\banywhere\b|\bdistributed\b|\bwork from home\b|\bwfh\b/.test(lower);
  const isHybrid = /\bhybrid\b/.test(lower);

  let workplaceType: ParsedLocation['workplaceType'] = 'ONSITE';
  if (isRemote && isHybrid) workplaceType = 'HYBRID';
  else if (isRemote && !/[a-z]{3,}/.test(lower.replace(/remote|united states|usa|uk/g, ''))) {
    workplaceType = 'REMOTE';
  } else if (isRemote) workplaceType = 'HYBRID';
  if (isHybrid) workplaceType = 'HYBRID';
  if (isRemote && !isHybrid && /^(remote)([,\s]|$)/i.test(locationRaw)) workplaceType = 'REMOTE';

  const parts = locationRaw
    .split(',')
    .map((part) => stripOfficeNotes(part))
    .filter(Boolean);

  let city: string | null = null;
  let region: string | null = null;
  let country: string | null = null;

  if (parts.length >= 3) {
    const parsed = assignPlaceFromParts(parts[0], parts[1] ?? '', parts.slice(2).join(', '));
    city = parsed.city;
    region = parsed.region;
    country = parsed.country;
  } else if (parts.length === 2) {
    const parsed = assignPlaceFromParts(parts[0], parts[1] ?? '');
    city = parsed.city;
    region = parsed.region;
    country = parsed.country;
  } else if (parts.length === 1) {
    const single = parts[0] ?? '';
    if (isRemote && /^remote/i.test(single)) {
      const remainder = single.replace(/remote/gi, '').trim();
      country = remainder ? expandCountry(remainder) : null;
    } else {
      const asCountry = expandCountry(single);
      if (asCountry && single.length > 3) country = asCountry;
      else city = cleanPlace(single);
    }
  }

  if (!country) {
    const hay = locationRaw;
    for (const name of Object.values(US_STATES)) {
      if (new RegExp(`\\b${name}\\b`, 'i').test(hay)) {
        country = 'United States';
        region = region ?? name;
        break;
      }
    }
  }

  if (!country) {
    for (const name of new Set(Object.values(CA_PROVINCES))) {
      if (new RegExp(`\\b${name}\\b`, 'i').test(locationRaw)) {
        country = 'Canada';
        region = region ?? name;
        break;
      }
    }
  }

  if (!country) {
    for (const name of new Set(Object.values(AU_STATES))) {
      if (name === 'Victoria') continue;
      if (new RegExp(`\\b${name}\\b`, 'i').test(locationRaw)) {
        country = 'Australia';
        region = region ?? name;
        break;
      }
    }
  }

  if (city && /^remote$/i.test(city)) city = 'Remote';

  return { locationRaw, country, region, city, isRemote, workplaceType };
}

function cleanPlace(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.replace(/\((?:hybrid|remote|on-?site)\)/gi, '').trim();
  if (!trimmed || /^remote$/i.test(trimmed)) return trimmed ? 'Remote' : null;
  return trimmed;
}

function expandRegion(value: string): string | null {
  const key = stripOfficeNotes(value).toLowerCase();
  return US_STATES[key] ?? US_STATE_BY_NAME[key] ?? (stripOfficeNotes(value) || null);
}

function expandCaRegion(value: string): string | null {
  const key = stripOfficeNotes(value).toLowerCase();
  if (key === 'ca') return null;
  return CA_PROVINCES[key] ?? null;
}

function expandAuRegion(value: string): string | null {
  return AU_STATES[stripOfficeNotes(value).toLowerCase()] ?? null;
}

function expandCountry(value: string): string | null {
  const key = stripOfficeNotes(value).toLowerCase();
  if (!key || isUsStateToken(key)) return null;
  return COUNTRY_ALIASES[key] ?? null;
}

export function mapEmployment(raw: string | null | undefined): import('./types').NormalizedEmployment {
  const value = (raw ?? '').toLowerCase();
  if (/(^|[^a-z])(intern(s|ship)?|co-op|apprentice)([^a-z]|$)/i.test(value)) return 'INTERN';
  if (value.includes('part')) return 'PART_TIME';
  if (value.includes('temporary')) return 'TEMPORARY';
  if (value.includes('contract') || /\btemp\b/.test(value)) return 'CONTRACT';
  return 'FULL_TIME';
}
