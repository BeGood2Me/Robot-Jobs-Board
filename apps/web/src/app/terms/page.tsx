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
      <p className="mt-3 font-mono text-sm text-muted">Updated August 20, 2026</p>
      <div className="mt-8 space-y-8 text-pretty text-muted">
        <p>
          These terms apply when you use Robot Jobs Board at robotjobsboard.com, including the{' '}
          <Link href="/" className="underline">
            job list
          </Link>
          ,{' '}
          <Link href="/companies" className="underline">
            company pages
          </Link>
          ,{' '}
          <Link href="/guides" className="underline">
            guides
          </Link>
          , and related pages. If you do not agree, do not use the site. Our{' '}
          <Link href="/privacy" className="underline">
            privacy policy
          </Link>{' '}
          explains how we handle information.
        </p>

        <section>
          <h2 className="text-xl font-semibold text-foreground">What this site is</h2>
          <p className="mt-3">
            Robot Jobs Board indexes public robotics jobs from company career pages and applicant tracking systems. We
            are not the employer, recruiter, or staffing agency. We do not hire you, interview you, sponsor visas, or
            make offers. Company names and trademarks belong to their owners; listing a job does not mean we are
            affiliated with or endorsed by that company.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">Listings</h2>
          <p className="mt-3">
            Job text, pay, location, and requirements come from the original posting. They can be incomplete, out of
            date, mistranslated by our filters, or wrong. Always confirm details on the company apply page before you
            spend time on an application. Apply links send you to the employer or their ATS. That process is between
            you and them.
          </p>
          <p className="mt-3">
            We may filter, classify, expire, hide, or remove listings, including jobs that leave the source board, jobs
            outside the United States, United Kingdom, Canada, Australia, and Europe, and jobs that are not robotics
            roles. Thin category pages may not be indexed. Structured data and search snippets may summarize a listing;
            the employer page remains the source of truth.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">Your use of the site</h2>
          <p className="mt-3">
            Use the site to find robotics jobs and read the guides. Do not overload the service, attempt unauthorized
            access, interfere with other visitors, or scrape, harvest, or bulk-download listings in a way that harms the
            service or violates an employer&apos;s terms. Automated access for ordinary search engines is fine; abusive
            crawling is not. Saved jobs stay on your device. Guides are for general career information, not legal,
            immigration, tax, or employment advice.
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
            accuracy, legality, and equal-opportunity compliance of your own postings. You confirm you have the right
            to make those public postings available and that our indexing of them does not violate your agreements with
            your ATS or candidates.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">Our content</h2>
          <p className="mt-3">
            Job descriptions remain the content of the employer. The site design, taxonomy, filters, and guides are
            provided by Robot Jobs Board. You may not copy the guides or site framing for a competing commercial job
            board without permission. Short quotations with credit for personal or editorial use are fine.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">Disclaimer and liability</h2>
          <p className="mt-3">
            The service is offered as is and as available. We do not promise that every robotics job is listed, that a
            listing is still open, that pay or location is correct, or that the site will always be available. Use of
            the site is at your own risk. To the fullest extent the law allows, we are not liable for hiring decisions,
            failed applications, lost data, or other losses that come from relying on a listing or from downtime. If
            liability cannot be excluded, it is limited to £100 (or the minimum amount the law requires).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">Changes and contact</h2>
          <p className="mt-3">
            We may update these terms and the privacy policy. The date at the top is the latest version. Continued use
            after a change means you accept the new terms. Questions: hello@robotjobsboard.com.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">Governing law</h2>
          <p className="mt-3">
            These terms are governed by the laws of England and Wales, without regard to conflict-of-law rules. Courts
            in England and Wales have exclusive jurisdiction, except where consumer protection law in your country
            gives you a mandatory right to sue elsewhere.
          </p>
        </section>
      </div>
    </div>
  );
}
