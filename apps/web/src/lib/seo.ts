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
  const lead = `${employment} · ${workplace} · ${posted}. Part of ${job.company.name} jobs on Robot Jobs Board — apply on the original posting.`;
  const snippet = job.descriptionPlain.replace(/\s+/g, ' ').trim().slice(0, 80);
  return `${lead} ${snippet}`.slice(0, 160);
}

function companyOpeningsPhrase(total: number): string {
  if (total < 1) return 'no open roles right now';
  if (total === 1) return '1 open role';
  return `${total} open roles`;
}

/** Title/H1 aimed at "{company} jobs" and "{company} careers" queries. */
export function companyPageTitle(name: string, total = 1): string {
  if (total < 1) return `${name} Jobs & Careers`;
  return `${name} Jobs & Careers — ${companyOpeningsPhrase(total)}`;
}

export function companyPageDescription(
  name: string,
  total: number,
  description: string,
  seoIntro?: string | null,
): string {
  const source = (seoIntro?.trim() || description).replace(/\s+/g, ' ').trim();
  const openings = companyOpeningsPhrase(total);
  if (total < 1) {
    return `${name} jobs and careers on Robot Jobs Board. ${source}`.slice(0, 160);
  }
  return `${name} jobs and careers — ${openings} on Robot Jobs Board. Compare titles and locations, then apply on the original posting. ${source}`.slice(
    0,
    160,
  );
}

export function companyPageIntro(name: string, total: number, description: string, seoIntro?: string | null): string {
  const body = seoIntro?.trim() || description;
  const openings = companyOpeningsPhrase(total);
  if (seoIntro?.trim()) {
    if (total < 1) {
      return `${name} has no open robotics jobs on Robot Jobs Board right now. ${body}`;
    }
    return `${name} has ${openings} listed on Robot Jobs Board. ${body}`;
  }
  return `${name} posts robotics jobs on Greenhouse, Lever, Ashby, and other company boards. Robot Jobs Board aggregates ${openings} in one place so you can compare titles, locations, and stacks without checking each careers page separately. ${description}`;
}
