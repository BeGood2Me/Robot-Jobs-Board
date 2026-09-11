import { NextResponse } from 'next/server';
import { getGoneJobById, getJobById, relatedJobs } from '@/lib/jobs';
import { jobPagePath } from '@/lib/seo';
import { getSiteUrl } from '@/lib/site';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const job = await getJobById(id);
  if (!job) {
    const gone = await getGoneJobById(id);
    if (gone) {
      return NextResponse.json(
        {
          status: 'gone',
          job: gone,
          companyUrl: `${getSiteUrl()}/companies/${gone.company.slug}`,
        },
        { status: 410 },
      );
    }
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const related = await relatedJobs(job, 6);
  const site = getSiteUrl();
  return NextResponse.json({
    status: 'active',
    job,
    pageUrl: `${site}${jobPagePath(job)}`,
    related: related.map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      company: item.company.name,
      location: item.locationRaw,
      isRemote: item.isRemote,
      postedAt: item.postedAt,
      pageUrl: `${site}${jobPagePath(item)}`,
      applyUrl: item.url,
    })),
  });
}
