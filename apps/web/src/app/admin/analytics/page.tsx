import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import { getJobById } from '@/lib/jobs';
import { fetchJobListingStats } from '@/lib/vercel-web-analytics-api';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Job listing stats',
  robots: { index: false, follow: false },
};

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const report = await fetchJobListingStats(30);

  const enriched = await Promise.all(
    report.applyByJob.slice(0, 40).map(async (row) => {
      const job = await getJobById(row.jobId);
      return {
        ...row,
        title: job?.title ?? '—',
        company: job?.company.name ?? '—',
        slug: job?.slug,
      };
    }),
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-4xl font-semibold">Job listing stats</h1>
      <p className="mt-4 max-w-3xl text-muted">
        Last 30 days, production only. <strong className="text-foreground">Job views</strong> use custom event{' '}
        <code className="text-sm">Job View</code>; <strong className="text-foreground">apply clicks</strong> use{' '}
        <code className="text-sm">Apply Click</code> (both grouped by <code className="text-sm">jobId</code> in Vercel).{' '}
        <strong className="text-foreground">Page visitors</strong> are Web Analytics visits on{' '}
        <code className="text-sm">/jobs/…</code> paths (top 100 job URLs; long tail rolls into Vercel Others).
      </p>

      <section className="mt-8 rounded-2xl border border-line bg-card p-6">
        <h2 className="text-xl font-semibold">Vercel dashboard</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>
            Open{' '}
            <a
              href="https://vercel.com"
              className="text-accent underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Vercel
            </a>{' '}
            → project <strong className="text-foreground">robot-jobs-board</strong> → <strong className="text-foreground">Analytics</strong>.
          </li>
          <li>
            Scroll to <strong className="text-foreground">Events</strong> — select <strong className="text-foreground">Apply Click</strong> or{' '}
            <strong className="text-foreground">Job View</strong>, then group by <code className="text-sm">jobId</code>,{' '}
            <code className="text-sm">company</code>, or <code className="text-sm">title</code>.
          </li>
          <li>Drill into <strong className="text-foreground">jobId</strong> to see per-listing counts.</li>
        </ol>
      </section>

      {!report.configured ? (
        <p className="mt-8 rounded-xl border border-line bg-chip p-4 text-sm text-muted">
          Set <code className="text-foreground">VERCEL_ACCESS_TOKEN</code> on this deployment (scoped read for the team) to
          load the table below. Until then, use the Events panel in Vercel or run{' '}
          <code className="text-foreground">pnpm job-stats</code> locally with the Vercel CLI linked.
        </p>
      ) : null}

      <JobStatsTable enriched={enriched} since={report.since} until={report.until} configured={report.configured} />

      <p className="mt-8">
        <Link href="/admin/jobs" className="text-sm underline hover:text-accent">
          ← Moderate jobs
        </Link>
      </p>
    </div>
  );
}

function JobStatsTable({
  enriched,
  since,
  until,
  configured,
}: {
  enriched: Array<{
    jobId: string;
    title: string;
    company: string;
    slug?: string;
    applyClicks: number;
    applyVisitors: number;
    jobViewEvents: number;
    jobViewVisitors: number;
    pageVisitors: number;
    pageViews: number;
  }>;
  since: string;
  until: string;
  configured: boolean;
}) {
  if (!configured || enriched.length === 0) {
    return (
      <p className="mt-8 text-sm text-muted">
        Range: {since.slice(0, 10)} → {until.slice(0, 10)}. No apply-click rows loaded.
      </p>
    );
  }

  return (
    <div className="mt-8 overflow-x-auto">
      <p className="mb-4 text-sm text-muted">
        Range: {since.slice(0, 10)} → {until.slice(0, 10)} · Sorted by Job View events, then apply clicks
      </p>
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="py-2 pr-4">Company</th>
            <th className="py-2 pr-4">Role</th>
            <th className="py-2 pr-4 text-right">Job views</th>
            <th className="py-2 pr-4 text-right">Apply clicks</th>
            <th className="py-2 pr-4 text-right">Page visitors</th>
          </tr>
        </thead>
        <tbody>
          {enriched.map((row) => (
            <tr key={row.jobId} className="border-b border-line/60">
              <td className="py-3 pr-4">{row.company}</td>
              <td className="py-3 pr-4">
                {row.slug ? (
                  <Link href={`/jobs/${row.jobId}/${row.slug}`} className="underline hover:text-accent">
                    {row.title}
                  </Link>
                ) : (
                  row.title
                )}
              </td>
              <td className="py-3 pr-4 text-right font-mono">{row.jobViewEvents}</td>
              <td className="py-3 pr-4 text-right font-mono">{row.applyClicks}</td>
              <td className="py-3 pr-4 text-right font-mono">{row.pageVisitors}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}