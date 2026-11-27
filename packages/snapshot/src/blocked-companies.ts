/** Employers removed from ingest — still filter so stale CDN rows never surface on the board. */
export const BLOCKED_COMPANY_SLUGS = new Set<string>(['autostore']);

export function stripBlockedCompanies<T extends { company: { slug: string } }>(
  jobs: T[],
): T[] {
  return jobs.filter((job) => !BLOCKED_COMPANY_SLUGS.has(job.company.slug));
}

export function stripBlockedCompanyRows<T extends { slug: string }>(companies: T[]): T[] {
  return companies.filter((company) => !BLOCKED_COMPANY_SLUGS.has(company.slug));
}