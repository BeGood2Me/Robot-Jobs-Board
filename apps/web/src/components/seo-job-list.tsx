import { JobCard } from '@/components/job-card';
import type { JobCardData } from '@/lib/jobs';

export function SeoJobList({
  h1,
  intro,
  jobs,
  indexable,
}: {
  h1: string;
  intro: string;
  jobs: JobCardData[];
  indexable: boolean;
}) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="max-w-[680px] text-4xl font-semibold">{h1}</h1>
      <p className="mt-6 max-w-[680px] text-muted">{intro}</p>
      {!indexable ? (
        <p className="mt-4 font-mono text-xs text-muted">Fewer than five live jobs. This page is not indexed yet.</p>
      ) : null}
      <div className="mt-10 grid gap-4">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
        {!jobs.length ? <p className="text-muted">No live jobs for this page right now.</p> : null}
      </div>
    </div>
  );
}
