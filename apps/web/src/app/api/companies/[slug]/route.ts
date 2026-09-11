import { NextResponse } from 'next/server';
import { getCompanyBySlug, getCompanyJobsPage } from '@/lib/jobs';
import { jobPagePath } from '@/lib/seo';
import { getSiteUrl } from '@/lib/site';

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const company = await getCompanyBySlug(slug);
  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
  const { total, jobs } = await getCompanyJobsPage(company.id, page);
  const site = getSiteUrl();
  const pageSize = 10;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pages);

  return NextResponse.json({
    company: {
      ...company,
      pageUrl: `${site}/companies/${company.slug}`,
    },
    total,
    page: currentPage,
    pageSize,
    jobs: jobs.map((job) => ({
      id: job.id,
      slug: job.slug,
      title: job.title,
      location: job.locationRaw,
      country: job.country,
      isRemote: job.isRemote,
      workplaceType: job.workplaceType,
      employmentType: job.employmentType,
      postedAt: job.postedAt,
      pageUrl: `${site}${jobPagePath(job)}`,
      applyUrl: job.url,
    })),
  });
}
