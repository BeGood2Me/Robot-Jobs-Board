type JobLike = {
  id: string;
  slug: string;
  title: string;
  descriptionPlain?: string | null;
  url?: string | null;
  locationRaw?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  isRemote?: boolean;
  workplaceType?: string | null;
  employmentType?: string | null;
  department?: string | null;
  compensationText?: string | null;
  postedAt?: string | Date | null;
  company?: {
    name: string;
    slug: string;
    website?: string | null;
  };
  robotDomains?: Array<{ domain: { slug: string; name: string } }>;
  techTags?: Array<{ techTag: { slug: string; label: string } }>;
  seniorities?: Array<{ seniority: { slug: string; label: string } }>;
};

function asIso(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function truncate(text: string | null | undefined, max = 600): string | null {
  if (!text) return null;
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1)}…`;
}

export function summarizeJob(
  job: JobLike,
  options: { pageUrl?: string; includeDescription?: boolean; maxDescription?: number } = {},
) {
  const includeDescription = options.includeDescription ?? false;
  return {
    id: job.id,
    title: job.title,
    company: job.company?.name ?? null,
    companySlug: job.company?.slug ?? null,
    location: job.locationRaw ?? null,
    country: job.country ?? null,
    isRemote: Boolean(job.isRemote),
    workplaceType: job.workplaceType ?? null,
    employmentType: job.employmentType ?? null,
    department: job.department ?? null,
    compensation: job.compensationText ?? null,
    postedAt: asIso(job.postedAt),
    domains: (job.robotDomains ?? []).map((item) => item.domain.slug),
    tags: (job.techTags ?? []).map((item) => item.techTag.slug),
    seniorities: (job.seniorities ?? []).map((item) => item.seniority.slug),
    pageUrl: options.pageUrl ?? null,
    applyUrl: job.url ?? null,
    ...(includeDescription
      ? { description: truncate(job.descriptionPlain, options.maxDescription ?? 2500) }
      : {}),
  };
}

export function jsonResult(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  };
}

export function errorResult(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    isError: true as const,
    content: [{ type: 'text' as const, text: message }],
  };
}
