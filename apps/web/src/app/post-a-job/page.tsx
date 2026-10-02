import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Post a robotics job',
  description:
    'Feature a robotics job on Robot Jobs Board for 30 days, or get listed for free via ATS ingest. Candidates apply on your career page.',
};

export default function PostAJobPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-semibold">Post a job</h1>
      <p className="mt-4 text-muted">
        Robot Jobs Board lists robotics jobs and links candidates straight to your ATS. We do not wrap apply flows or
        collect applications.
      </p>

      <p className="mt-8 text-sm font-semibold">Contact</p>
      <a
        href="mailto:hello@robotjobsboard.com"
        className="mt-2 inline-block text-lg font-semibold text-foreground underline underline-offset-4"
      >
        hello@robotjobsboard.com
      </a>

      <section className="mt-12 space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Featured listing — $149 / 30 days</h2>
          <p className="mt-2 text-muted">
            For employers who need this job seen. We pin one job near the top of the board for 30 days, mark it
            Featured, and link apply only to your career page. Include the job title, location, and public job URL when
            you email.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Free ATS ingest</h2>
          <p className="mt-2 text-muted">
            Send your public Greenhouse, Lever, Ashby, or Workday board URL. Eligible robotics jobs are added to the
            regular board (not pinned) and kept in sync when we ingest. Best if you already have a public board and do
            not need priority placement. Candidates still apply on your site.
          </p>
        </div>
      </section>
    </div>
  );
}
