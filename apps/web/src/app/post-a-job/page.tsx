import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Post a robotics job',
  description:
    'List and feature a robotics job on Robot Jobs Board for $149 / 30 days, or feature a job already on the board. Candidates apply on your career page.',
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
      <p className="mt-2 text-sm text-muted">$149 for one job / 30 days. Same price either way.</p>

      <section className="mt-12 space-y-6">
        <div>
          <h2 className="text-xl font-semibold">List and feature — $149 / 30 days</h2>
          <p className="mt-2 text-muted">
            For a job that is not on the board yet. We add it, pin it near the top for 30 days, mark it Featured, and
            link apply only to your career page. Email the job title, location, and public job URL.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Feature an existing job — $149 / 30 days</h2>
          <p className="mt-2 text-muted">
            For a job already on Robot Jobs Board. We pin it near the top for 30 days and mark it Featured. Email the
            job page URL (or title + company) so we feature the right listing.
          </p>
        </div>
      </section>
    </div>
  );
}
