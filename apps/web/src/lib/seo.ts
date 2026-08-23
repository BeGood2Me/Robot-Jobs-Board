import { employmentLabel, formatPosted, workplaceLabel } from './site';

type JobSeoFields = {
  id: string;
  slug: string;
  title: string;
  descriptionPlain: string;
  locationRaw?: string | null;
  workplaceType: string;
  isRemote: boolean;
  employmentType: string;
  postedAt?: Date | string | null;
  company: { name: string };
};

export function jobPagePath(job: Pick<JobSeoFields, 'id' | 'slug'>): string {
  return `/jobs/${job.id}/${job.slug}`;
}

export function jobPageTitle(job: JobSeoFields): string {
  const workplace = workplaceLabel(job.workplaceType, job.isRemote);
  const location = job.locationRaw?.split(',')[0]?.trim();
  const suffix = location ?? (workplace === 'Remote' ? 'Remote' : workplace);
  return `${job.title} at ${job.company.name} – ${suffix}`;
}

export function jobPageDescription(job: JobSeoFields): string {
  const workplace = workplaceLabel(job.workplaceType, job.isRemote);
  const employment = employmentLabel(job.employmentType);
  const posted = formatPosted(job.postedAt);
  const lead = `${employment} · ${workplace} · ${posted}. Apply on ${job.company.name}'s original posting.`;
  const snippet = job.descriptionPlain.replace(/\s+/g, ' ').trim().slice(0, 100);
  return `${lead} ${snippet}`.slice(0, 160);
}

export function companyPageTitle(name: string, total: number): string {
  const roles = total === 1 ? '1 open role' : `${total} open roles`;
  return `${name} robotics jobs (${roles})`;
}

export function companyPageDescription(name: string, total: number, description: string): string {
  const roles = total === 1 ? '1 live robotics job' : `${total} live robotics jobs`;
  const lead = `Browse ${roles} at ${name}. Filter by role, location, and stack, then apply on the company's original posting.`;
  const tail = description.replace(/\s+/g, ' ').trim();
  return `${lead} ${tail}`.slice(0, 160);
}

export function companyPageIntro(name: string, total: number, description: string, seoIntro?: string | null): string {
  if (seoIntro?.trim()) return seoIntro;
  const roles = total === 1 ? '1 open role' : `${total} open roles`;
  return `${name} posts robotics roles on Greenhouse, Lever, Ashby, and other company boards. Robot Jobs Board aggregates ${roles} in one place so you can compare titles, locations, and stacks without checking each careers page separately. ${description}`;
}
