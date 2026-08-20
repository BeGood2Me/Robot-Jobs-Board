import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of use',
  description:
    'Terms for using Robot Jobs Board, including access rights, listing disclaimers, liability limits, and Irish governing law.',
  alternates: { canonical: '/terms' },
};

const UPDATED = 'August 20, 2026';

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="max-w-[680px] text-4xl font-semibold text-balance">Terms of use</h1>
      <p className="mt-3 font-mono text-sm text-muted">Version 1.1 · Last revised {UPDATED}</p>
      <p className="mt-2 text-sm text-muted">
        Based on the{' '}
        <a
          href="https://github.com/General-Legal/legal-templates/tree/main/templates/terms-of-use"
          className="underline"
          rel="noopener noreferrer"
        >
          General Legal Terms of Use
        </a>{' '}
        template (CC0), customized for Robot Jobs Board (Ireland).
      </p>

      <div className="mt-8 space-y-8 text-pretty text-muted">
        <p>
          The website located at{' '}
          <Link href="https://www.robotjobsboard.com" className="underline">
            robotjobsboard.com
          </Link>{' '}
          (the &quot;Site&quot;) is operated from Ireland by Robot Jobs Board (&quot;Company,&quot; &quot;us,&quot;
          &quot;our,&quot; or &quot;we&quot;). Certain features of the Site may be subject to additional guidelines or
          rules posted on the Site, which are incorporated by reference into these Terms.
        </p>
        <p>
          These Terms of Use (&quot;Terms&quot;) govern your use of the Site. By accessing or using the Site, you agree
          to these Terms. You must be at least 18 years old to use the Site (or the age of majority in your place of
          residence, if higher). If you do not agree, do not use the Site.
        </p>

        <section>
          <h2 className="text-xl font-semibold text-foreground">1. Accounts</h2>
          <p className="mt-3">
            Ordinary visitors do not create accounts on the Site. Private moderation tools may require operator
            credentials. If you are given access credentials, you must keep them confidential and notify us of any
            unauthorized use. We are not liable for losses resulting from failure to keep credentials secure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">2. Access to the Site</h2>
          <h3 className="mt-4 text-lg font-semibold text-foreground">2.1 License</h3>
          <p className="mt-3">
            Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to
            access and use the Site for your own personal, non-commercial purposes (including job search and reading
            career guides).
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">2.2 Restrictions</h3>
          <p className="mt-3">You may not:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>license, sell, rent, lease, transfer, assign, distribute, or commercially exploit the Site or its content;</li>
            <li>modify, create derivative works from, disassemble, reverse-compile, or reverse-engineer any part of the Site;</li>
            <li>access the Site in order to build a similar or competing product or service;</li>
            <li>
              scrape, harvest, or bulk-download listings in a way that harms the Service or violates an employer&apos;s
              terms (ordinary search-engine crawling is permitted);
            </li>
            <li>
              copy, reproduce, distribute, republish, download, display, post, or transmit any part of the Site except
              as expressly permitted by these Terms.
            </li>
          </ul>
          <h3 className="mt-4 text-lg font-semibold text-foreground">2.3 Changes to the Site</h3>
          <p className="mt-3">
            We may modify, suspend, or discontinue the Site (or any part of it) at any time, with or without notice. We
            are not liable to you or any third party for any such change, except where liability cannot be excluded under
            Irish or EU law.
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">2.4 No support obligation</h3>
          <p className="mt-3">We have no obligation to provide support or maintenance for the Site.</p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">2.5 Ownership</h3>
          <p className="mt-3">
            Job descriptions remain the content of the employer. The Site design, taxonomy, filters, and guides are
            provided by Robot Jobs Board or its suppliers. These Terms do not transfer ownership rights to you except
            for the limited access rights in Section 2.1. Company names and trademarks on listings belong to their
            owners; listing a job does not mean we are affiliated with or endorsed by that company.
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">2.6 Feedback</h3>
          <p className="mt-3">
            If you share feedback or suggestions about the Site, you grant us a perpetual, irrevocable, worldwide,
            non-exclusive, royalty-free license to use that feedback freely, without attribution. Do not submit feedback
            you consider proprietary or confidential.
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">2.7 Listings</h3>
          <p className="mt-3">
            Robot Jobs Board indexes public robotics jobs from company career pages and applicant tracking systems. We
            are not the employer, recruiter, or staffing agency. Job text, pay, location, and requirements come from the
            original posting and may be incomplete, out of date, or wrong. Always confirm details on the company apply
            page. Apply links send you to the employer or their ATS. When a job disappears from an employer feed, we
            delete it from our database on the next successful sync. We may filter, classify, hide, or remove listings.
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">2.8 Employers</h3>
          <p className="mt-3">
            Direct posting is not a paid product yet. If you send a public board URL through{' '}
            <Link href="/post-a-job" className="underline">
              Post a job
            </Link>
            , we may ingest listings from that board. Candidates still apply on your ATS. You are responsible for the
            accuracy and legality of your own postings and confirm you have the right to make those public postings
            available for indexing.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">3. Privacy</h2>
          <p className="mt-3">
            Your use of the Site is also governed by our{' '}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
            , which is incorporated into these Terms by reference. If there is a conflict between these Terms and the
            Privacy Policy with respect to personal data, the Privacy Policy controls.
          </p>
          <p className="mt-3">
            The Site may use cookies and similar tracking technologies. Details are in the Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">4. Indemnification</h2>
          <p className="mt-3">
            To the extent permitted by law, you agree to defend, indemnify, and hold harmless Company and its officers,
            employees, and agents from claims and reasonable costs arising out of (i) your use of the Site, (ii) your
            violation of these Terms, or (iii) your violation of applicable law. This does not limit any non-excludable
            rights you have as a consumer under Irish or EU law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">5. Third-party services</h2>
          <p className="mt-3">
            The Site includes links to employer ATS pages and other third-party websites or services
            (&quot;Third-Party Services&quot;). We do not control, endorse, or take responsibility for Third-Party
            Services. You use them at your own risk under the third party&apos;s terms and privacy practices.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">6. Disclaimers</h2>
          <p className="mt-3">
            The Site is provided &quot;as is&quot; and &quot;as available,&quot; to the fullest extent permitted by law.
            We do not warrant that every robotics job is listed, that a listing is still open, that pay or location is
            correct, or that the Site will be uninterrupted, error-free, or secure. Nothing in these Terms excludes or
            limits liability for death or personal injury caused by negligence, fraud, or any other liability that
            cannot be excluded or limited under Irish or EU law. If you are a consumer in the EEA or UK, your mandatory
            statutory rights are not affected.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">7. Limitation of liability</h2>
          <p className="mt-3">
            To the maximum extent permitted by law, and subject to Section 6: (a) Company will not be liable for any
            lost profits, lost data, or any indirect or consequential loss arising from these Terms or your use of (or
            inability to use) the Site; and (b) our total liability to you for any claim arising under these Terms is
            capped at €100 (one hundred euro), or the minimum amount that cannot be limited by law if higher. Multiple
            claims do not increase this cap. This section does not affect mandatory consumer rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">8. Term and termination</h2>
          <p className="mt-3">
            These Terms remain in effect while you use the Site. We may suspend or terminate your access at any time and
            for any reason, including if we believe you have violated these Terms. Upon termination, Sections 2.2
            through 2.8 and Sections 3 through 11 survive.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">9. Notices for users outside Ireland</h2>
          <p className="mt-3">
            If you are a consumer habitually resident in the EEA or UK, you may benefit from mandatory local consumer
            protections that cannot be waived by contract. Those rights prevail over conflicting terms here.
          </p>
          <p className="mt-3">
            U.S. residents may have additional privacy rights under state law, described in our{' '}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
            . California residents may contact the California Department of Consumer Affairs, Complaint Assistance Unit,
            1625 N. Market Blvd. Suite N112, Sacramento, CA 95834, or (800) 952-5210, and may contact us at
            hello@robotjobsboard.com.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">10. General</h2>
          <h3 className="mt-4 text-lg font-semibold text-foreground">10.1 Changes to Terms</h3>
          <p className="mt-3">
            We may update these Terms from time to time. If we make material changes, we may notify you by a prominent
            notice on the Site. Your continued use after notice means you accept the updated Terms, except where
            applicable consumer law requires additional consent or notice.
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">10.2 Governing law and courts</h3>
          <p className="mt-3">
            These Terms and any dispute arising out of or related to these Terms or the Site are governed by the laws of
            Ireland, without regard to conflict-of-law rules that would apply another law. Subject to Section 11, the
            courts of Ireland have exclusive jurisdiction, except that if you are a consumer habitually resident in the
            EEA or UK, you may bring proceedings in the courts of your country of residence, and you cannot be deprived
            of mandatory consumer protections of that country.
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">10.3 Electronic communications</h3>
          <p className="mt-3">
            By using the Site, you consent to receiving communications from us electronically (by email or notices
            posted on the Site). Electronic communications satisfy any legal requirement for written notice where
            permitted by law.
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">10.4 Accessibility</h3>
          <p className="mt-3">
            We endeavor to make the Site accessible and to conform to WCAG 2.1 Level AA where practicable. If you have
            difficulty accessing the Site, contact hello@robotjobsboard.com.
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">10.5 Entire agreement</h3>
          <p className="mt-3">
            These Terms (together with the Privacy Policy and any other policies referenced herein) are the entire
            agreement between you and Company regarding your use of the Site. If any provision is invalid, it will be
            modified to the minimum extent necessary, and the remaining provisions continue. Our failure to enforce a
            provision is not a waiver. &quot;Including&quot; means &quot;including without limitation.&quot; You may not
            assign these Terms without our consent; we may assign them freely.
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">10.6 Copyright / trademark</h3>
          <p className="mt-3">
            Copyright © {new Date().getFullYear()} Robot Jobs Board. All rights reserved. Trademarks on the Site belong
            to Robot Jobs Board or third parties and may not be used without prior written consent from the owner.
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">10.7 Contact</h3>
          <p className="mt-3">
            Robot Jobs Board (Ireland) ·{' '}
            <a href="mailto:hello@robotjobsboard.com" className="underline">
              hello@robotjobsboard.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">11. Dispute resolution</h2>
          <h3 className="mt-4 text-lg font-semibold text-foreground">11.1 Informal resolution</h3>
          <p className="mt-3">
            Before filing a claim, please email hello@robotjobsboard.com with a description of the dispute. We will try
            in good faith to resolve it within 30 days.
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">11.2 Courts</h3>
          <p className="mt-3">
            If informal resolution fails, disputes may be brought in accordance with Section 10.2. We do not require
            mandatory arbitration for consumers. Either party may seek interim or injunctive relief in any court of
            competent jurisdiction to protect intellectual property or confidential information.
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">11.3 Online dispute resolution (EU)</h3>
          <p className="mt-3">
            If you are an EU consumer, the European Commission provides an online dispute resolution platform at{' '}
            <a href="https://ec.europa.eu/consumers/odr" className="underline" rel="noopener noreferrer">
              ec.europa.eu/consumers/odr
            </a>
            . We are not obliged to use a specific ADR entity unless required by law.
          </p>
        </section>
      </div>
    </div>
  );
}
