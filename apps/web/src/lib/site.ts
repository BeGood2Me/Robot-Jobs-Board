export const INDEX_JOB_THRESHOLD = 5;
export const PAGE_SIZE = 10;

/** Public board freshness (seconds). Aggregation only needs daily updates; 15 minutes is conservative.
 *  Page `export const revalidate` must use the literal `900` — Next cannot analyze imported values. */
export const PUBLIC_REVALIDATE_SECONDS = 900;

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

export function slugify(input: string, maxLength = 80): string {
  const slug = input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/g, '');
  return slug || 'item';
}

export function formatPosted(date: Date | string | null | undefined): string {
  if (!date) return 'Date not listed';
  const value = typeof date === 'string' ? new Date(date) : date;
  const delta = Date.now() - value.getTime();
  const days = Math.floor(delta / 86_400_000);
  if (days <= 0) return 'Posted today';
  if (days === 1) return 'Posted yesterday';
  if (days < 30) return `Posted ${days} days ago`;
  return `Posted ${value.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export function sourceLabel(source: string): string {
  switch (source) {
    case 'greenhouse':
      return 'Greenhouse';
    case 'lever':
      return 'Lever';
    case 'ashby':
      return 'Ashby';
    case 'workday':
      return 'Workday';
    case 'workable':
      return 'Workable';
    default:
      return 'the company site';
  }
}

export function workplaceLabel(type: string, isRemote: boolean): string {
  if (type === 'REMOTE' || isRemote) return 'Remote';
  if (type === 'HYBRID') return 'Hybrid';
  return 'On site';
}

export function seniorityLabel(slug: string, fallback = slug): string {
  switch (slug) {
    case 'junior':
    case 'entry':
      return 'Entry level';
    case 'mid':
      return 'Mid level';
    case 'senior':
      return 'Senior';
    case 'lead':
      return 'Lead';
    case 'principal':
      return 'Staff';
    default:
      return fallback;
  }
}

export function employmentLabel(type: string): string {
  switch (type) {
    case 'FULL_TIME':
      return 'Full time';
    case 'PART_TIME':
      return 'Part time';
    case 'CONTRACT':
      return 'Contract';
    case 'INTERN':
      return 'Intern';
    case 'TEMPORARY':
      return 'Temporary';
    default:
      return type;
  }
}
