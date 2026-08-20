import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of use',
  description:
    'Terms for using Robot Jobs Board, including access rights, listing disclaimers, liability limits, and dispute resolution.',
  alternates: { canonical: '/terms' },
};

const UPDATED = 'August 20, 2026';

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="max-w-[680px] text-4xl font-semibold text-balance">Terms of use</h1>
      <p className="mt-3 font-mono text-sm text-muted">Version 1.0 · Last revised {UPDATED}</p>
      <p className="mt-2 text-sm text-muted">
        Based on the{' '}
        <a
          href="https://github.com/General-Legal/legal-templates/tree/main/templates/terms-of-use"
          className="underline"
          rel="noopener noreferrer"
        >
          General Legal Terms of Use
        </a>{' '}
        template (CC0), customized for Robot Jobs Board.
      </p>

      <div className="mt-8 space-y-8 text-pretty text-muted">
        <p>
          The website located at{' '}
          <Link href="https://www.robotjobsboard.com" className="underline">
            robotjobsboard.com
          </Link>{' '}
          (the &quot;Site&quot;) is operated by Robot Jobs Board (&quot;Company,&quot; &quot;us,&quot; &quot;our,&quot;
          or &quot;we&quot;). Certain features of the Site may be subject to additional guidelines or rules posted on
          the Site, which are incorporated by reference into these Terms.
        </p>
        <p>
          These Terms of Use (&quot;Terms&quot;) govern your use of the Site. By accessing or using the Site, you agree
          to these Terms. You must be at least 18 years old to use the Site. If you do not agree, do not use the Site.
        </p>
        <p className="rounded-lg border border-line bg-chip p-4 text-sm text-foreground">
          <span className="font-semibold">Important — please read Section 11 carefully.</span> It contains an agreement
          to resolve disputes through binding individual arbitration instead of in court, and includes a waiver of
          class action rights and jury trial rights. You have 30 days to opt out of the arbitration agreement, as
          described in Section 11.
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
            are not liable to you or any third party for any such change.
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
            You agree to defend, indemnify, and hold harmless Company and its officers, employees, and agents from any
            claims and reasonable costs or attorneys&apos; fees arising out of (i) your use of the Site, (ii) your
            violation of these Terms, or (iii) your violation of applicable law. We may assume control of the defense at
            your expense, and you agree to cooperate. You agree not to settle any such claim without our prior written
            consent.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">5. Third-party services and other users</h2>
          <p className="mt-3">
            The Site includes links to employer ATS pages and other third-party websites or services
            (&quot;Third-Party Services&quot;). We do not control, endorse, or take responsibility for Third-Party
            Services. You use them at your own risk under the third party&apos;s terms and privacy practices.
          </p>
          <p className="mt-3">
            To the fullest extent permitted by law, you release Company and its officers, employees, agents, successors,
            and assigns from claims arising out of or related to the Site or Third-Party Services. If you are a
            California resident, you waive California Civil Code Section 1542.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">6. Disclaimers</h2>
          <p className="mt-3 uppercase text-sm leading-relaxed">
            The Site is provided &quot;as is&quot; and &quot;as available.&quot; To the fullest extent permitted by law,
            Company and its suppliers disclaim all warranties, express or implied, including warranties of
            merchantability, fitness for a particular purpose, title, and non-infringement. We do not warrant that every
            robotics job is listed, that a listing is still open, that pay or location is correct, or that the Site will
            be uninterrupted, error-free, or secure. Where applicable law requires warranties, they are limited to 90
            days from your first use.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">7. Limitation of liability</h2>
          <p className="mt-3 uppercase text-sm leading-relaxed">
            To the maximum extent permitted by law: (a) Company and its suppliers will not be liable for any lost
            profits, lost data, costs of substitute products, or any indirect, consequential, incidental, special,
            exemplary, or punitive damages arising from or related to these Terms or your use of (or inability to use)
            the Site; and (b) our total liability to you for any claim arising under these Terms is capped at the
            greater of (i) $50 USD and (ii) the amount paid to Company by you under these Terms in the six months prior
            to the incident giving rise to the claim. Multiple claims do not increase this cap.
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
          <h2 className="text-xl font-semibold text-foreground">9. State-specific legal notices</h2>
          <p className="mt-3">
            The provisions in this Section 9 apply only to users subject to the laws of the applicable states identified
            below. If a provision in this section conflicts with another provision of these Terms, the state-specific
            provision controls for users subject to that state&apos;s laws.
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">9.1 California</h3>
          <p className="mt-3">
            California residents may report complaints to the Complaint Assistance Unit of the Division of Consumer
            Services of the California Department of Consumer Affairs, at 1625 N. Market Blvd. Suite N112, Sacramento,
            CA 95834, or by phone at (800) 952-5210. Under California Civil Code Section 1789.3, the provider of the Site
            is Robot Jobs Board; contact hello@robotjobsboard.com. Additional privacy rights under the CCPA/CPRA are
            described in our{' '}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
            .
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">9.2 Other states</h3>
          <p className="mt-3">
            Residents of Colorado, Connecticut, Virginia, Nevada, Texas, and other states with consumer privacy laws may
            have additional rights described in our Privacy Policy. Nevada residents may contact
            hello@robotjobsboard.com regarding opt-out of covered sales under Nevada law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">10. General</h2>
          <h3 className="mt-4 text-lg font-semibold text-foreground">10.1 Changes to Terms</h3>
          <p className="mt-3">
            We may update these Terms from time to time. If we make material changes, we may notify you by a prominent
            notice on the Site. Your continued use after notice means you accept the updated Terms.
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">10.2 Governing law</h3>
          <p className="mt-3">
            These Terms and any dispute arising out of or related to these Terms or the Site will be governed by the
            laws of the State of California, without regard to conflict-of-law principles. For any claim not subject to
            arbitration in Section 11, you and Company irrevocably consent to the exclusive jurisdiction and venue of
            the state and federal courts located in San Francisco County, California, except that either party may seek
            injunctive relief for intellectual property claims in any court of competent jurisdiction, and either party
            may bring an individual action in small claims court for claims within that court&apos;s limits.
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">10.3 Export</h3>
          <p className="mt-3">
            You agree not to export, re-export, or transfer any technical data or products acquired from the Site in
            violation of U.S. export control laws or applicable regulations.
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">10.4 Electronic communications</h3>
          <p className="mt-3">
            By using the Site, you consent to receiving communications from us electronically (by email or notices
            posted on the Site). Electronic communications satisfy any legal requirement for written notice.
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">10.5 Accessibility</h3>
          <p className="mt-3">
            We endeavor to make the Site accessible and to conform to WCAG 2.1 Level AA where practicable. If you have
            difficulty accessing the Site, contact hello@robotjobsboard.com.
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">10.6 Entire agreement</h3>
          <p className="mt-3">
            These Terms (together with the Privacy Policy and any other policies referenced herein) are the entire
            agreement between you and Company regarding your use of the Site. If any provision is invalid, it will be
            modified to the minimum extent necessary, and the remaining provisions continue. Our failure to enforce a
            provision is not a waiver. &quot;Including&quot; means &quot;including without limitation.&quot; You may not
            assign these Terms without our consent; we may assign them freely.
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">10.7 Copyright / trademark</h3>
          <p className="mt-3">
            Copyright © {new Date().getFullYear()} Robot Jobs Board. All rights reserved. Trademarks on the Site belong
            to Robot Jobs Board or third parties and may not be used without prior written consent from the owner.
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">10.8 Contact</h3>
          <p className="mt-3">
            <a href="mailto:hello@robotjobsboard.com" className="underline">
              hello@robotjobsboard.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">11. Dispute resolution</h2>
          <p className="mt-3 font-semibold text-foreground">
            Please read this section carefully. It affects your legal rights, including your right to sue in court and
            your right to a jury trial.
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">11.1 Applicability</h3>
          <p className="mt-3">
            Except as described below, you and Company agree to resolve all disputes arising out of or relating to the
            Site or these Terms through binding individual arbitration — not in court. Exceptions include: (i) claims
            that qualify for small claims court, brought on an individual basis; and (ii) requests for equitable relief
            related to intellectual property. This arbitration agreement applies to claims that arose before you agreed
            to these Terms.
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">11.2 Try to resolve first</h3>
          <p className="mt-3">
            Before starting arbitration, the parties will try to resolve the dispute informally. Send written notice to
            hello@robotjobsboard.com. Within 45 days of receiving that notice, the parties will meet by phone or video
            in good faith. If the dispute is not resolved within 60 days, either party may start arbitration.
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">11.3 Arbitration rules</h3>
          <p className="mt-3">
            Arbitrations will be administered by JAMS (www.jamsadr.com). Claims under $250,000 (excluding fees and
            interest) will use JAMS Streamlined Arbitration Rules; larger claims will use JAMS Comprehensive Arbitration
            Rules. Unless the parties agree otherwise, arbitration will be conducted in the county where you live. All
            arbitration materials are confidential.
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">11.4 Waiver of jury trial</h3>
          <p className="mt-3 uppercase text-sm">
            By agreeing to arbitration, you and Company waive the right to a trial by judge or jury for all covered
            claims.
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">11.5 Waiver of class actions</h3>
          <p className="mt-3 uppercase text-sm">
            All disputes must be brought on an individual basis. Neither you nor Company may bring claims as a plaintiff
            or class member in any class, representative, or collective proceeding. The arbitrator may only award relief
            on an individual basis. If a court finds this class action waiver unenforceable as to a specific claim, that
            claim may be litigated in state or federal court in California; all other claims remain subject to
            arbitration.
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">11.6 Attorneys&apos; fees</h3>
          <p className="mt-3">
            Each party bears its own attorneys&apos; fees unless the arbitrator finds a claim was frivolous or brought
            for an improper purpose.
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">11.7 Opt-out</h3>
          <p className="mt-3">
            You may opt out of this arbitration agreement within 30 days of first accepting these Terms by emailing
            hello@robotjobsboard.com with your name, address, and a clear statement that you wish to opt out. Opting out
            does not affect any other part of these Terms.
          </p>
          <h3 className="mt-4 text-lg font-semibold text-foreground">11.8 Severability</h3>
          <p className="mt-3">
            If any part of this arbitration agreement is found invalid, it will be modified to the minimum extent
            necessary to make it enforceable; the rest remains in effect.
          </p>
        </section>
      </div>
    </div>
  );
}
