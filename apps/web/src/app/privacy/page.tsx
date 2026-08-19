import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description:
    'How Robot Jobs Board collects, stores, and uses information when you browse robotics jobs or contact us.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="max-w-[680px] text-4xl font-semibold text-balance">Privacy policy</h1>
      <p className="mt-3 font-mono text-sm text-muted">Updated August 18, 2026</p>
      <div className="mt-8 space-y-8 text-pretty text-muted">
        <p>
          Robot Jobs Board is a public robotics job board. This page explains what information we handle when you use
          the site, including{' '}
          <Link href="/" className="underline">
            job listings
          </Link>
          ,{' '}
          <Link href="/companies" className="underline">
            company pages
          </Link>
          , and{' '}
          <Link href="/guides" className="underline">
            career guides
          </Link>
          .
        </p>

        <section>
          <h2 className="text-xl font-semibold text-foreground">What we collect</h2>
          <p className="mt-3">
            Job listings are copied from public company career pages and applicant tracking systems. That includes job
            titles, descriptions, locations, employment type, and company names. We are not the employer and we do not
            run the application.
          </p>
          <p className="mt-3">
            If you use Post a job, your mail app sends your name, work email, board URL, and message to
            hello@robotjobsboard.com. We only receive what you choose to send.
          </p>
          <p className="mt-3">
            Saved jobs are stored in your browser on your device. We do not see that list. Clearing site data in your
            browser removes it.
          </p>
          <p className="mt-3">
            Hosting and database providers may keep standard server logs, which can include IP address, browser type,
            and the pages requested. We use that for security and to keep the site running. We do not run advertising
            cookies or a third party analytics pixel on this site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">How we use it</h2>
          <p className="mt-3">
            We use listing data to show robotics jobs, company pages, filters, and search. We use messages you send to
            reply and, if you ask, to add a public company board to ingest. We do not sell candidate profiles. We do
            not build a résumé database.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">Cookies</h2>
          <p className="mt-3">
            Ordinary visitors do not need an account cookie. A signed in operator cookie is used only for the private
            admin tools. Your browser may also store saved job IDs locally, which is not a tracking cookie.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">How long we keep it</h2>
          <p className="mt-3">
            Open jobs stay listed while they still appear on the source board and pass our robotics and location
            filters. Jobs that disappear from the source, or that we mark inactive, drop off the public board. Emails
            you send are kept only as long as needed to handle the request.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">Who else sees it</h2>
          <p className="mt-3">
            The site is hosted on Vercel. Job data is stored in Postgres with Neon. Apply links go to the employer or
            their ATS. Those sites have their own privacy policies. We do not sell personal information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">Your choices</h2>
          <p className="mt-3">
            Email hello@robotjobsboard.com to ask what we hold from a message you sent, or to ask us to delete that
            email. You can stop saving jobs by clearing them in the browser. If you apply for a job, the employer
            controls that application, not Robot Jobs Board.
          </p>
        </section>

        <p>
          Using the site also means you agree to the{' '}
          <Link href="/terms" className="underline">
            terms of use
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
