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
      <p className="mt-3 font-mono text-sm text-muted">Updated August 20, 2026</p>
      <div className="mt-8 space-y-8 text-pretty text-muted">
        <p>
          Robot Jobs Board (&quot;we&quot;, &quot;us&quot;) is a public robotics job board operated at{' '}
          <Link href="https://www.robotjobsboard.com" className="underline">
            robotjobsboard.com
          </Link>
          . This page explains what information we handle when you use the site, including{' '}
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
          . Contact for privacy questions: hello@robotjobsboard.com.
        </p>

        <section>
          <h2 className="text-xl font-semibold text-foreground">Who this applies to</h2>
          <p className="mt-3">
            The site is aimed at people looking for robotics work and employers who want their public boards listed.
            We do not knowingly collect information from children under 16. If you believe a child sent us personal
            information, email hello@robotjobsboard.com and we will delete it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">What we collect</h2>
          <p className="mt-3">
            <span className="font-semibold text-foreground">Job listing data.</span> We copy public postings from company
            career pages and applicant tracking systems (for example Greenhouse, Lever, Ashby, Workable). That can
            include titles, descriptions, locations, employment type, pay text when the source shows it, and company
            names. We are not the employer and we do not run the application.
          </p>
          <p className="mt-3">
            <span className="font-semibold text-foreground">Messages you send.</span> If you use{' '}
            <Link href="/post-a-job" className="underline">
              Post a job
            </Link>
            , your mail app can send your name, work email, board URL, and message to hello@robotjobsboard.com. We only
            receive what you choose to send.
          </p>
          <p className="mt-3">
            <span className="font-semibold text-foreground">Saved jobs.</span> Saved job IDs are stored in your browser
            (local storage) on your device. We do not receive that list on our servers. Clearing site data removes it.
          </p>
          <p className="mt-3">
            <span className="font-semibold text-foreground">Technical and usage data.</span> Hosting and database
            providers may keep standard server logs (IP address, browser type, pages requested, timestamps). We also
            use:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <span className="font-semibold text-foreground">Vercel Analytics</span> for high-level traffic on our
              hosting platform (
              <a href="https://vercel.com/legal/privacy-policy" className="underline" rel="noopener noreferrer">
                Vercel privacy policy
              </a>
              ).
            </li>
            <li>
              <span className="font-semibold text-foreground">Google Analytics 4</span> for pages viewed, approximate
              location, device, and browser (
              <a href="https://policies.google.com/privacy" className="underline" rel="noopener noreferrer">
                Google privacy policy
              </a>
              ). Measurement ID: G-6H8HLRSJ6J.
            </li>
          </ul>
          <p className="mt-3">
            We use analytics to understand how the site is used and to keep it working. We do not use analytics data to
            build advertising profiles or to sell ads on this site.
          </p>
          <p className="mt-3">
            <span className="font-semibold text-foreground">Admin access.</span> A signed-in operator cookie is used only
            for private moderation tools. Ordinary visitors do not get an account on Robot Jobs Board.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">How we use it</h2>
          <p className="mt-3">
            We use listing data to show robotics jobs, company pages, filters, search, sitemaps, and structured data for
            search engines. We use messages you send to reply and, if you ask, to add a public company board to ingest.
            We use logs and analytics for security, reliability, and product decisions. We do not sell candidate
            profiles. We do not build a résumé or application database.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">Cookies and similar storage</h2>
          <p className="mt-3">
            Ordinary browsing does not require an account cookie. Google Analytics may set cookies or use similar
            browser storage for measurement. You can block or clear them with browser settings or extensions; some
            measurement may still happen in a limited way depending on your tools. Saved jobs use local storage, not a
            tracking cookie. The admin cookie is only for signed-in operators.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">How long we keep it</h2>
          <p className="mt-3">
            Open jobs stay listed while they still appear on the source board and pass our robotics and location
            filters. When a job disappears from the employer feed, we delete it from our database on the next sync
            and it returns 404 on the site. Emails you send are kept only as long as needed to handle the request. Analytics and server logs are kept
            according to each provider&apos;s retention settings, typically for operational and security periods rather
            than indefinitely for marketing.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">Who else sees it</h2>
          <p className="mt-3">
            The site is hosted on Vercel. Job data is stored in Postgres with Neon. Usage measurement is processed by
            Vercel and Google. Apply links send you to the employer or their ATS; those sites have their own privacy
            policies and we do not control what they collect after you leave. We do not sell personal information.
          </p>
          <p className="mt-3">
            Providers may process data in the United States or other countries. If you browse from the UK, EU, or
            elsewhere, that means your technical and analytics data may be processed outside your country.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">Your choices and rights</h2>
          <p className="mt-3">
            Email hello@robotjobsboard.com to ask what we hold from a message you sent, to correct it, or to ask us to
            delete that email. You can stop saving jobs by clearing them in the browser. You can limit analytics with
            browser controls or Google&apos;s tools where available. If you apply for a job, the employer controls that
            application, not Robot Jobs Board.
          </p>
          <p className="mt-3">
            Depending on where you live, you may have additional rights under local law (for example access, deletion,
            or objection to certain processing). Tell us which right you want to exercise and we will respond as the
            law requires. If we refuse a request where the law allows, we will say why.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">Security</h2>
          <p className="mt-3">
            We use standard hosting security practices and limit admin access. No internet service is perfectly secure.
            Do not send résumés or sensitive application materials to hello@robotjobsboard.com unless we ask for them;
            applications belong on the employer ATS.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">Changes</h2>
          <p className="mt-3">
            We may update this policy. The date at the top is the latest version. Material changes will be reflected
            here. Continued use after a change means you accept the updated policy.
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
