import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@robot-jobs-board/db';
import { requireAdmin } from '@/lib/admin';
import { hideJob, restoreJob } from './actions';
import { SyncNowButton } from './sync-button';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Moderate jobs',
  robots: { index: false, follow: false },
};

export default async function AdminJobsPage({ searchParams }: PageProps<'/admin/jobs'>) {
  await requireAdmin();
  const params = await searchParams;
  const view = params.view === 'hidden' ? 'hidden' : params.view === 'all' ? 'all' : 'live';
  const q = typeof params.q === 'string' ? params.q : '';

  const jobs = await prisma.job.findMany({
    where: {
      ...(view === 'hidden' ? { isHidden: true } : {}),
      ...(view === 'live' ? { isHidden: false, isActive: true } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { company: { name: { contains: q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      title: true,
      slug: true,
      isActive: true,
      isHidden: true,
      hiddenNote: true,
      postedAt: true,
      locationRaw: true,
      company: { select: { name: true } },
    },
    orderBy: [{ isHidden: 'desc' }, { postedAt: 'desc' }],
    take: 100,
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-4xl font-semibold">Moderate jobs</h1>
      <p className="mt-4 max-w-[680px] text-muted">
        Boards sync on a schedule. New robotics jobs appear without pasting them. Hide a listing if it is recruiting,
        facilities, or otherwise off topic. Hidden jobs stay off the site even after the next sync.
      </p>
      <div className="mt-8">
        <SyncNowButton />
      </div>
      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link href="/admin/jobs" className={view === 'live' ? 'font-semibold underline' : 'text-muted'}>
          Live
        </Link>
        <Link href="/admin/jobs?view=hidden" className={view === 'hidden' ? 'font-semibold underline' : 'text-muted'}>
          Hidden
        </Link>
        <Link href="/admin/jobs?view=all" className={view === 'all' ? 'font-semibold underline' : 'text-muted'}>
          All
        </Link>
        <form action="/api/admin/logout" method="post">
          <button type="submit" className="text-muted underline">
            Sign out
          </button>
        </form>
      </div>
      <form method="get" className="mt-6 flex gap-2">
        {view !== 'live' ? <input type="hidden" name="view" value={view} /> : null}
        <input
          name="q"
          defaultValue={q}
          placeholder="Search title or company"
          className="h-10 flex-1 rounded-lg border border-line bg-card px-3 text-sm"
        />
        <button type="submit" className="h-10 rounded-lg bg-chip px-3 text-sm font-semibold">
          Search
        </button>
      </form>
      <div className="mt-8 space-y-4">
        {jobs.map((job) => (
          <article key={job.id} className="rounded-2xl border border-line bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted">{job.company.name}</p>
                <h2 className="mt-1 text-xl font-semibold">{job.title}</h2>
                <p className="mt-2 text-sm text-muted">{job.locationRaw}</p>
                {job.isHidden ? (
                  <p className="mt-2 text-sm">
                    Hidden{job.hiddenNote ? `: ${job.hiddenNote}` : ''}
                  </p>
                ) : null}
              </div>
              {job.isHidden ? (
                <form action={restoreJob}>
                  <input type="hidden" name="id" value={job.id} />
                  <button
                    type="submit"
                    className="h-10 rounded-lg bg-foreground px-3 text-sm font-semibold text-background active:scale-[0.98]"
                  >
                    Restore
                  </button>
                </form>
              ) : (
                <form action={hideJob} className="flex flex-col items-end gap-2">
                  <input type="hidden" name="id" value={job.id} />
                  <input
                    name="note"
                    placeholder="Why hide this"
                    className="h-10 w-56 rounded-lg border border-line bg-background px-3 text-sm"
                  />
                  <button
                    type="submit"
                    className="h-10 rounded-lg border border-line px-3 text-sm font-semibold active:scale-[0.98]"
                  >
                    Remove from site
                  </button>
                </form>
              )}
            </div>
          </article>
        ))}
        {!jobs.length ? <p className="text-muted">No jobs in this view.</p> : null}
      </div>
    </div>
  );
}
