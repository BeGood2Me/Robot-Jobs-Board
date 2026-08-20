import type { JobWithRelations } from './jobs';
import { PAGE_SIZE, getSiteUrl } from './site';

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function normalizeMoneyNumber(raw: string): number | null {
  // Supports:
  // - 120000
  // - 120,000
  // - 120k / 120 K
  // - 120.5k
  const trimmed = raw.trim().toLowerCase();
  const isK = trimmed.endsWith('k');
  const num = trimmed.replace(/,/g, '').replace(/k$/, '').trim();
  const parsed = Number(num);
  if (!Number.isFinite(parsed)) return null;
  return isK ? parsed * 1000 : parsed;
}

function parseCompensationBaseSalary(text?: string | null): {
  currency: string;
  value: number;
  unitText?: string;
} | null {
  if (!text) return null;

  const lower = text.toLowerCase();

  const currency =
    lower.includes('usd') || text.includes('$')
      ? 'USD'
      : lower.includes('gbp') || text.includes('£')
        ? 'GBP'
        : lower.includes('eur') || text.includes('€')
          ? 'EUR'
          : 'USD';

  // Infer whether it's annual/monthly/hourly-ish.
  let unitText: string | undefined;
  if (/(hour|hr)\b/.test(lower)) unitText = 'HOUR';
  else if (/(month|mo)\b/.test(lower)) unitText = 'MONTH';
  else if (/\bweek\b/.test(lower)) unitText = 'WEEK';
  else unitText = 'YEAR';

  // Range first: "100k - 130k", "100000–130000", "100000 to 130000"
  const rangeMatch = lower.match(
    /([$£€]?\s*\d+(?:[.,]\d+)?\s*k?)\s*(?:-|–|to)\s*([$£€]?\s*\d+(?:[.,]\d+)?\s*k?)/i,
  );

  const singleMatch = !rangeMatch ? lower.match(/([$£€]?\s*\d+(?:[.,]\d+)?\s*k?)/i) : null;

  const numberMatch = rangeMatch ? rangeMatch[1] : singleMatch?.[1];
  if (!numberMatch) return null;

  // Strip any currency symbols from the captured value.
  const cleaned = numberMatch.replace(/[$£€]/g, '').trim();
  const value = normalizeMoneyNumber(cleaned);
  if (value == null) return null;

  return { currency, value, unitText };
}

function extractPostalCode(locationRaw?: string | null): string | undefined {
  if (!locationRaw) return undefined;
  // US ZIP / ZIP+4
  const usMatch = locationRaw.match(/\b(\d{5})(?:-\d{4})?\b/);
  if (usMatch?.[1]) return usMatch[1];

  // UK postcode (very common pattern)
  // Examples: SW1A 1AA, M1 1AE, W1A 0AX
  const ukMatch = locationRaw.match(/\b([A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})\b/i);
  if (ukMatch?.[1]) return ukMatch[1].replace(/\s+/g, '').toUpperCase();

  // Canada postal code
  // Examples: K1A0B1, K1A 0B1
  const caMatch = locationRaw.match(/\b([ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTVXY]\s?\d[ABCEGHJ-NPRSTVXY]\d?)\b/i);
  if (caMatch?.[1]) return caMatch[1].replace(/\s+/g, '').toUpperCase();

  // Best-effort: last token with at least one digit
  const tokens = locationRaw
    .split(/[,|]/g)
    .map((t) => t.trim())
    .filter(Boolean);
  const last = tokens[tokens.length - 1];
  if (last && /\d/.test(last) && last.length <= 12) return last;

  return undefined;
}

function extractStreetAddress(locationRaw?: string | null): string | undefined {
  if (!locationRaw) return undefined;
  const raw = locationRaw.trim();
  if (!raw) return undefined;

  // Best-effort: take the first comma-separated segment.
  const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
  const first = parts[0] ?? '';
  if (!first) return undefined;

  // Avoid "Remote" / "United States" as "street address".
  if (/remote/i.test(first)) return undefined;
  if (/^(united\s+states|usa|canada)$/i.test(first)) return undefined;
  if (first.length < 3) return undefined;
  return first;
}

function employmentSchema(type: string): string {
  switch (type) {
    case 'FULL_TIME':
      return 'FULL_TIME';
    case 'PART_TIME':
      return 'PART_TIME';
    case 'CONTRACT':
      return 'CONTRACTOR';
    case 'INTERN':
      return 'INTERN';
    case 'TEMPORARY':
      return 'TEMPORARY';
    default:
      return 'FULL_TIME';
  }
}

export function jobPostingJsonLd(job: JobWithRelations) {
  const site = getSiteUrl();
  const description = job.descriptionPlain.slice(0, 5000);
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: job.title,
    description,
    datePosted: job.postedAt?.toISOString() ?? job.createdAt.toISOString(),
    employmentType: employmentSchema(job.employmentType),
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company.name,
      sameAs: job.company.website ?? undefined,
      logo: job.company.logoUrl ?? undefined,
    },
    identifier: {
      '@type': 'PropertyValue',
      name: job.sourceSystem,
      value: job.externalId,
    },
    directApply: false,
    url: `${site}/jobs/${job.id}/${job.slug}`,
    applicationContact: undefined,
  };

  // Google expects `validThrough` for JobPosting rich results.
  // If the feed doesn't provide an expiresAt, infer a conservative deadline.
  const validThrough = job.expiresAt ?? addDays(job.postedAt ?? job.createdAt, 30);
  data.validThrough = validThrough.toISOString();

  let baseSalary = parseCompensationBaseSalary(job.compensationText);
  if (!baseSalary && job.compensationText) {
    // Fallback: if we see any digits at all, still emit a baseSalary so GSC
    // doesn't flag missing fields for feeds that use non-standard wording.
    const lower = job.compensationText.toLowerCase();
    const currency =
      lower.includes('usd') || job.compensationText.includes('$')
        ? 'USD'
        : lower.includes('gbp') || job.compensationText.includes('£')
          ? 'GBP'
          : lower.includes('eur') || job.compensationText.includes('€')
            ? 'EUR'
            : 'USD';
    const unitText = /(hour|hr)\b/.test(lower) ? 'HOUR' : /(month|mo)\b/.test(lower) ? 'MONTH' : 'YEAR';
    const numericMatch = lower.match(/(\d[\d,]*(?:\.\d+)?\s*k?)/i);
    const numeric = numericMatch ? normalizeMoneyNumber(numericMatch[1].replace(/[$£€]/g, '').trim()) : null;
    baseSalary = numeric == null ? { currency, value: 0, unitText } : { currency, value: numeric, unitText };
  }

  if (baseSalary) {
    data.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: baseSalary.currency,
      value: {
        '@type': 'QuantitativeValue',
        value: baseSalary.value,
        unitText: baseSalary.unitText,
      },
    };
  }

  if (job.isRemote || job.workplaceType === 'REMOTE') {
    data.jobLocationType = 'TELECOMMUTE';
    data.applicantLocationRequirements = job.country
      ? { '@type': 'Country', name: job.country }
      : { '@type': 'Country', name: 'United States' };
  }

  if (job.workplaceType !== 'REMOTE') {
    data.jobLocation = {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        streetAddress: extractStreetAddress(job.locationRaw) ?? undefined,
        postalCode: extractPostalCode(job.locationRaw) ?? undefined,
        addressLocality: job.city ?? undefined,
        addressRegion: job.region ?? undefined,
        addressCountry: job.country ?? 'US',
      },
    };
  }

  return data;
}

export function blogArticleJsonLd(post: {
  title: string;
  slug: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  faqs?: Array<{ question: string; answer: string }>;
}) {
  const site = getSiteUrl();
  const url = `${site}/guides/${post.slug}`;
  const publisher = {
    '@type': 'Organization',
    name: 'Robot Jobs Board',
    url: site,
  };
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Article',
      headline: post.title,
      description: post.description,
      datePublished: `${post.publishedAt}T00:00:00.000Z`,
      dateModified: `${post.updatedAt ?? post.publishedAt}T00:00:00.000Z`,
      mainEntityOfPage: url,
      url,
      author: publisher,
      publisher,
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: site },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: `${site}/guides` },
        { '@type': 'ListItem', position: 3, name: post.title, item: url },
      ],
    },
  ];
  if (post.faqs?.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: post.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    });
  }
  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

export function homePageJsonLd() {
  const site = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'Robot Jobs Board',
        url: site,
        description:
          'Robotics jobs in the United States, United Kingdom, Canada, Australia, and Europe, sourced from company career pages.',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${site}/?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'CollectionPage',
        name: 'Robotics jobs',
        description:
          'Open robotics jobs for engineers, technicians, and operators. Filter by location, robot type, and experience.',
        url: site,
        isPartOf: { '@id': site },
      },
    ],
  };
}

export function blogIndexJsonLd(posts: Array<{ title: string; slug: string; description: string }>) {
  const site = getSiteUrl();
  const url = `${site}/guides`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: 'Robotics career guides',
        description:
          'Guides on how to become a robotics engineer, choosing AMR or humanoid work, and reading the skills in live robotics job posts.',
        url,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: posts.length,
          itemListElement: posts.map((post, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `${site}/guides/${post.slug}`,
            name: post.title,
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Robotics jobs', item: site },
          { '@type': 'ListItem', position: 2, name: 'Robotics career guides', item: url },
        ],
      },
    ],
  };
}

export function companyPageJsonLd(company: {
  name: string;
  slug: string;
  description: string;
  website: string | null;
  logoUrl: string | null;
  jobs: Array<{ id: string; slug: string; title: string }>;
  total: number;
  page: number;
}) {
  const site = getSiteUrl();
  const url = `${site}/companies/${company.slug}`;
  const offset = (company.page - 1) * PAGE_SIZE;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: company.name,
        url: company.website || url,
        logo: company.logoUrl || undefined,
        description: company.description,
      },
      {
        '@type': 'CollectionPage',
        name: `${company.name} robotics jobs`,
        description: company.description,
        url,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: company.total,
          itemListElement: company.jobs.map((job, index) => ({
            '@type': 'ListItem',
            position: offset + index + 1,
            url: `${site}/jobs/${job.id}/${job.slug}`,
            name: job.title,
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Robotics jobs', item: site },
          { '@type': 'ListItem', position: 2, name: 'Companies', item: `${site}/companies` },
          { '@type': 'ListItem', position: 3, name: company.name, item: url },
        ],
      },
    ],
  };
}
