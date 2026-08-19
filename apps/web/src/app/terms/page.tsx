import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of use',
  description:
    'Terms for using Robot Jobs Board, including how listings are sourced and that we are not the employer.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="max-w-[680px] text-4xl font-semibold text-balance">Terms of use</h1>
      <p className="mt-3 font-mono text-sm text-muted">Updated August 18, 2026</p>
      <div className="mt-8 space-y-8 text-pretty text-muted">
        <p>
          These terms apply when you use Robot Jobs Board, including the{' '}
          <Link href="/" className="underline">
            job list
          </Link>
          ,{' '}
          <Link href="/companies" className="underline">
            company pages
          </Link>
          , and{' '}
          <Link href="/guides" className="underline">
            guides
          </Link>
          . If you do not agree, do not use the site.
        </p>

        <section>
          <h2 className="text-xl font-semibold text-foreground">What this site is</h2>
          <p className="mt-3">
            Robot Jobs Board indexes public robotics jobs from company career pages and applicant tracking systems. We
            are not the employer, recruiter, or staffing agency. We do not hire you, interview you, or make offers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">Listings</h2>
          <p className="mt-3">
            Job text, pay, location, and requirements come from the original posting. They can be incomplete, out of
            date, or wrong. Always confirm details on the company apply page before you spend time on an application.
            Apply links send you to the employer or their ATS. That process is between you and them.
          </p>
          <p className="mt-3">
            We may filter, classify, expire, hide, or remove listings, including jobs that leave the source board, jobs
            outside the United States, United Kingdom, Canada, Australia, and Europe, and jobs that are not robotics
            roles. Thin category pages may not be indexed.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">Your use of the site</h2>
          <p className="mt-3">
            Use the site to find robotics jobs and read the guides. Do not overload the service, try to break it, or
            scrape it in a way that harms other visitors. Saved jobs stay on your device. Guides are for general career
            information, not legal, immigration, or employment advice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">Employers</h2>
          <p className="mt-3">
            Direct posting is not a paid product yet. If you send a public board URL through{' '}
            <Link href="/post-a-job" className="underline">
              Post a job
            </Link>
            , we may ingest listings from that board. Candidates still apply on your ATS. You are responsible for the
            accuracy of your own postings.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">Content and liability</h2>
          <p className="mt-3">
            Job descriptions remain the content of the employer. The site, layout, taxonomy, and guides are provided by Robot
            Jobs Board. The service is offered as is. We do not promise that every robotics job is listed, that a
            listing is still open, or that the site will always be available. Use of the site is at your own risk. To
            the extent the law allows, we are not liable for hiring decisions, failed applications, or losses that come
            from relying on a listing.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">Changes</h2>
          <p className="mt-3">
            We may update these terms and the{' '}
            <Link href="/privacy" className="underline">
              privacy policy
            </Link>
            . The date at the top is the latest version. Continued use after a change means you accept the new terms.
          </p>
        </section>

        <p>
          Questions: hello@robotjobsboard.com
        </p>
      </div>
    </div>
  );
}
