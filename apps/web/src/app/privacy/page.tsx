import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description:
    'How Robot Jobs Board collects, uses, and shares personal information when you browse robotics jobs or contact us.',
  alternates: { canonical: '/privacy' },
};

const UPDATED = 'August 20, 2026';

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="max-w-[680px] text-4xl font-semibold text-balance">Privacy policy</h1>
      <p className="mt-3 font-mono text-sm text-muted">Effective as of {UPDATED}</p>
      <p className="mt-2 text-sm text-muted">
        Based on the{' '}
        <a
          href="https://github.com/General-Legal/legal-templates/tree/main/templates/privacy-policy-gdpr"
          className="underline"
          rel="noopener noreferrer"
        >
          General Legal Privacy Policy (GDPR Enhanced)
        </a>{' '}
        template (CC0), customized for Robot Jobs Board.
      </p>

      <div className="mt-8 space-y-8 text-pretty text-muted">
        <p>
          <span className="font-semibold text-foreground">EEA / UK users:</span> see the{' '}
          <a href="#notice-to-european-users" className="underline">
            Notice to European users
          </a>
          . U.S. state residents: see the{' '}
          <a href="#state-privacy-rights" className="underline">
            State privacy rights notice
          </a>
          .
        </p>

        <p>
          Robot Jobs Board (&quot;Robot Jobs Board,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is operated
          from Ireland and runs a public robotics job board that indexes open roles from company career pages and
          applicant tracking systems. This Privacy Policy describes how we process personal information collected
          through our website at{' '}
          <Link href="https://www.robotjobsboard.com" className="underline">
            robotjobsboard.com
          </Link>{' '}
          and related pages that link to this policy (the &quot;Service&quot;).
        </p>

        <nav aria-label="Privacy policy sections">
          <h2 className="text-xl font-semibold text-foreground">Index</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            <li>
              <a href="#personal-information-we-collect" className="underline">
                Personal information we collect
              </a>
            </li>
            <li>
              <a href="#tracking" className="underline">
                Tracking and other technologies
              </a>
            </li>
            <li>
              <a href="#how-we-use" className="underline">
                How we use your personal information
              </a>
            </li>
            <li>
              <a href="#retention" className="underline">
                Retention
              </a>
            </li>
            <li>
              <a href="#how-we-share" className="underline">
                How we share your personal information
              </a>
            </li>
            <li>
              <a href="#your-choices" className="underline">
                Your choices
              </a>
            </li>
            <li>
              <a href="#other-sites" className="underline">
                Other sites and services
              </a>
            </li>
            <li>
              <a href="#security" className="underline">
                Security
              </a>
            </li>
            <li>
              <a href="#international" className="underline">
                International data transfer
              </a>
            </li>
            <li>
              <a href="#children" className="underline">
                Children
              </a>
            </li>
            <li>
              <a href="#changes" className="underline">
                Changes to this Privacy Policy
              </a>
            </li>
            <li>
              <a href="#contact" className="underline">
                How to contact us
              </a>
            </li>
            <li>
              <a href="#state-privacy-rights" className="underline">
                State privacy rights notice
              </a>
            </li>
            <li>
              <a href="#notice-to-european-users" className="underline">
                Notice to European users
              </a>
            </li>
          </ul>
        </nav>

        <section id="personal-information-we-collect" className="scroll-mt-28">
          <h2 className="text-xl font-semibold text-foreground">Personal information we collect</h2>

          <h3 className="mt-6 text-lg font-semibold text-foreground">Information you provide to us</h3>
          <p className="mt-3">Personal information you may provide through the Service includes:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <span className="font-semibold text-foreground">Contact data</span>, such as your name, work email, and
              message content when you use{' '}
              <Link href="/post-a-job" className="underline">
                Post a job
              </Link>{' '}
              or email hello@robotjobsboard.com.
            </li>
            <li>
              <span className="font-semibold text-foreground">Communications data</span> based on our exchanges with you
              by email or other channels you choose.
            </li>
            <li>
              <span className="font-semibold text-foreground">Other data</span> you voluntarily include in a message
              (for example a public ATS board URL), which we use only as described in this policy or at the time of
              collection.
            </li>
          </ul>
          <p className="mt-3">
            Ordinary browsing does not require an account. We do not ask visitors for payment card numbers, government
            IDs, résumés, or similar sensitive application materials. Applications are handled on employer ATS sites,
            not by us.
          </p>

          <h3 className="mt-6 text-lg font-semibold text-foreground">Third-party and public sources</h3>
          <p className="mt-3">
            We collect job listing content from public company career pages and applicant tracking systems (for example
            Greenhouse, Lever, Ashby, Workable, Workday). That typically includes job titles, descriptions, locations,
            employment type, and company names. Those listings describe roles, not individual candidates. We may also
            receive information from service providers that help us operate the Service.
          </p>

          <h3 className="mt-6 text-lg font-semibold text-foreground">Automatic data collection</h3>
          <p className="mt-3">
            We, our hosting provider, and our analytics providers may automatically log information about your device
            and how you use the Service, such as:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <span className="font-semibold text-foreground">Device data</span>, such as browser type, operating
              system, device type, IP address, language settings, and approximate location (for example city or
              country).
            </li>
            <li>
              <span className="font-semibold text-foreground">Online activity data</span>, such as pages viewed, referral
              sources, navigation paths, access times, and similar usage metrics.
            </li>
          </ul>
          <p className="mt-3">
            <span className="font-semibold text-foreground">Saved jobs</span> are stored in your browser (local storage)
            on your device. We do not receive that list on our servers.
          </p>
        </section>

        <section id="tracking" className="scroll-mt-28">
          <h2 className="text-xl font-semibold text-foreground">Tracking and other technologies</h2>
          <p className="mt-3">
            Some automatic collection uses cookies or similar technologies. We use{' '}
            <span className="font-semibold text-foreground">Vercel Analytics</span> and{' '}
            <span className="font-semibold text-foreground">Google Analytics 4</span> (measurement ID G-6H8HLRSJ6J) to
            understand traffic and improve the Service. We do not use these tools to sell advertising on the site or to
            build advertising profiles for third-party ad networks.
          </p>
          <p className="mt-3">
            An operator cookie is used only for signed-in access to private moderation tools. Ordinary visitors do not
            receive that cookie.
          </p>
          <p className="mt-3">
            You can block or clear cookies and similar storage with browser settings or extensions. See{' '}
            <a href="#your-choices" className="underline">
              Your choices
            </a>
            .
          </p>
        </section>

        <section id="how-we-use" className="scroll-mt-28">
          <h2 className="text-xl font-semibold text-foreground">How we use your personal information</h2>
          <p className="mt-3">We may use personal information for:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <span className="font-semibold text-foreground">Service delivery</span> — to show robotics jobs, company
              pages, filters, search, guides, sitemaps, and structured data; to respond to messages; and, if you ask, to
              ingest a public company board.
            </li>
            <li>
              <span className="font-semibold text-foreground">Service improvement and analytics</span> — to understand
              usage, fix issues, and improve the Service (including via Vercel Analytics and Google Analytics).
            </li>
            <li>
              <span className="font-semibold text-foreground">Compliance and protection</span> — to comply with law,
              protect rights and safety, enforce our{' '}
              <Link href="/terms" className="underline">
                Terms of Use
              </Link>
              , and prevent abuse, fraud, or security incidents.
            </li>
            <li>
              <span className="font-semibold text-foreground">Aggregated or de-identified data</span> — we may create
              non-identifying statistics about listings or traffic for lawful business purposes.
            </li>
          </ul>
          <p className="mt-3">
            We do not sell candidate profiles, do not run a résumé database, and do not use analytics data for
            interest-based advertising on this Service.
          </p>
        </section>

        <section id="retention" className="scroll-mt-28">
          <h2 className="text-xl font-semibold text-foreground">Retention</h2>
          <p className="mt-3">
            We retain personal information as needed for the purposes described above, including legal, security, and
            operational needs. Open jobs remain listed while they appear on the source board and pass our filters. When
            a job disappears from an employer ATS feed, we delete it from our database on the next successful sync and
            its page returns 404. Emails you send are kept only as long as needed to handle the request. Analytics and
            server logs follow each provider&apos;s retention settings. When we no longer need personal information, we
            delete, anonymize, or isolate it from further processing.
          </p>
        </section>

        <section id="how-we-share" className="scroll-mt-28">
          <h2 className="text-xl font-semibold text-foreground">How we share your personal information</h2>
          <p className="mt-3">We may share personal information with:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <span className="font-semibold text-foreground">Service providers</span> that help us operate the Service —
              including Vercel (hosting and analytics), Neon (database), and Google (Google Analytics).
            </li>
            <li>
              <span className="font-semibold text-foreground">Employers and ATS providers</span> when you follow an apply
              link — their sites collect information under their own policies; we do not control that process.
            </li>
            <li>
              <span className="font-semibold text-foreground">Professional advisors</span>, authorities, and others when
              required for compliance and protection purposes.
            </li>
            <li>
              <span className="font-semibold text-foreground">Business transferees</span> in connection with a merger,
              financing, sale of assets, or similar transaction.
            </li>
          </ul>
          <p className="mt-3">We do not sell personal information for money.</p>
        </section>

        <section id="your-choices" className="scroll-mt-28">
          <h2 className="text-xl font-semibold text-foreground">Your choices</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Email hello@robotjobsboard.com to ask about a message you sent, to correct it, or to request deletion of
              that email.
            </li>
            <li>Clear saved jobs by clearing site data in your browser.</li>
            <li>
              Limit analytics cookies with browser controls or extensions. Google provides additional information about
              Google Analytics at{' '}
              <a href="https://tools.google.com/dlpage/gaoptout" className="underline" rel="noopener noreferrer">
                tools.google.com/dlpage/gaoptout
              </a>
              .
            </li>
            <li>
              Some browsers send &quot;Do Not Track&quot; signals. We do not currently respond to Do Not Track signals
              as a uniform standard. See{' '}
              <a href="https://www.allaboutdnt.com" className="underline" rel="noopener noreferrer">
                allaboutdnt.com
              </a>
              .
            </li>
          </ul>
          <p className="mt-3">
            Residents of certain U.S. states and individuals in Europe have additional rights described below.
          </p>
        </section>

        <section id="other-sites" className="scroll-mt-28">
          <h2 className="text-xl font-semibold text-foreground">Other sites and services</h2>
          <p className="mt-3">
            The Service links to employer career sites, ATS pages, and other third-party services. We do not control
            those sites and are not responsible for their privacy practices. Read their policies before you apply or
            share information.
          </p>
        </section>

        <section id="security" className="scroll-mt-28">
          <h2 className="text-xl font-semibold text-foreground">Security</h2>
          <p className="mt-3">
            We use technical and organizational safeguards designed to protect personal information. Internet
            transmission and storage are not perfectly secure, and we cannot guarantee absolute security. Do not send
            résumés or sensitive application materials to hello@robotjobsboard.com unless we specifically ask; apply on
            the employer ATS instead.
          </p>
        </section>

        <section id="international" className="scroll-mt-28">
          <h2 className="text-xl font-semibold text-foreground">International data transfer</h2>
          <p className="mt-3">
            We are established in Ireland. Some of our service providers (including Vercel, Neon, and Google) process
            data in the United States or other countries outside Ireland and the EEA. Where we transfer personal data
            from the EEA or UK to countries without an adequacy decision, we use appropriate safeguards such as the
            European Commission&apos;s Standard Contractual Clauses (and the UK international data transfer addendum
            where required), or another lawful transfer mechanism. See also the{' '}
            <a href="#notice-to-european-users" className="underline">
              Notice to European users
            </a>
            .
          </p>
        </section>

        <section id="children" className="scroll-mt-28">
          <h2 className="text-xl font-semibold text-foreground">Children</h2>
          <p className="mt-3">
            The Service is not intended for anyone under 16. We do not knowingly collect personal information from
            children. If you believe a child provided personal information, contact hello@robotjobsboard.com and we
            will delete it as required by law.
          </p>
        </section>

        <section id="changes" className="scroll-mt-28">
          <h2 className="text-xl font-semibold text-foreground">Changes to this Privacy Policy</h2>
          <p className="mt-3">
            We may update this Privacy Policy. Material changes will be reflected by updating the effective date and
            posting the revised policy on the Service. Continued use after the effective date indicates that the updated
            policy applies to your interactions with the Service.
          </p>
        </section>

        <section id="contact" className="scroll-mt-28">
          <h2 className="text-xl font-semibold text-foreground">How to contact us</h2>
          <p className="mt-3">
            Controller (Ireland): Robot Jobs Board. Privacy questions and requests:{' '}
            <a href="mailto:hello@robotjobsboard.com" className="underline">
              hello@robotjobsboard.com
            </a>
            . Our lead supervisory authority in the EEA is the Data Protection Commission (Ireland) —{' '}
            <a href="https://www.dataprotection.ie" className="underline" rel="noopener noreferrer">
              dataprotection.ie
            </a>
            .
          </p>
        </section>

        <section id="state-privacy-rights" className="scroll-mt-28">
          <h2 className="text-xl font-semibold text-foreground">State privacy rights notice</h2>
          <p className="mt-3">
            This section applies to residents of U.S. states that have privacy laws granting the rights described below
            (&quot;State Privacy Laws&quot;), to the extent those laws apply to us. Rights are not absolute; we may
            decline requests as permitted by law. We may need information to verify your identity or residency before
            responding.
          </p>
          <p className="mt-3">Depending on your state, you may have rights to:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Know what personal information we collect and how we use and share it</li>
            <li>Access a copy of personal information we hold about you</li>
            <li>Correct inaccurate personal information</li>
            <li>Delete personal information we collected from you</li>
            <li>Appeal a denial of a request</li>
            <li>Opt out of certain sales, sharing, or targeted advertising (where applicable)</li>
          </ul>
          <p className="mt-3">
            <span className="font-semibold text-foreground">Sale / sharing / targeted advertising.</span> We do not sell
            personal information for money. We do not process personal information for targeted advertising on this
            Service. We use analytics tools as described above. We do not knowingly collect, sell, or share personal
            information of consumers under 16.
          </p>
          <p className="mt-3">
            <span className="font-semibold text-foreground">Sensitive personal information.</span> We do not
            intentionally collect sensitive personal information for the purpose of inferring characteristics about
            consumers.
          </p>
          <p className="mt-3">
            <span className="font-semibold text-foreground">Exercising rights.</span> Email{' '}
            <a href="mailto:hello@robotjobsboard.com" className="underline">
              hello@robotjobsboard.com
            </a>{' '}
            with your request and enough detail for us to understand and verify it. Authorized agents may contact us the
            same way; we may require proof of authority.
          </p>
          <p className="mt-3">
            <span className="font-semibold text-foreground">California Shine the Light.</span> California residents may
            request certain information about disclosure of personal information to third parties for their direct
            marketing purposes by emailing hello@robotjobsboard.com with the subject &quot;Shine the Light Request,&quot;
            your name, mailing address, and confirmation that you are a California resident. We do not disclose personal
            information to third parties for their own direct marketing in the manner covered by that law.
          </p>
          <p className="mt-3">
            <span className="font-semibold text-foreground">Nevada.</span> Nevada residents may email
            hello@robotjobsboard.com to request opt-out of any potential future sale of covered information under Nevada
            law. We do not currently sell covered information for monetary consideration.
          </p>
        </section>

        <section id="notice-to-european-users" className="scroll-mt-28">
          <h2 className="text-xl font-semibold text-foreground">Notice to European users</h2>
          <p className="mt-3">
            This section applies to individuals in the European Economic Area, the United Kingdom, and Switzerland.
            References to &quot;personal information&quot; include &quot;personal data&quot; under the GDPR / UK GDPR.
          </p>
          <p className="mt-3">
            <span className="font-semibold text-foreground">Controller.</span> Robot Jobs Board, operated from Ireland,
            is the controller for processing described in this policy. Contact: hello@robotjobsboard.com. Because we
            are established in Ireland, we do not appoint a separate EU Article 27 representative.
          </p>
          <p className="mt-3">
            <span className="font-semibold text-foreground">Legal bases.</span> We process personal information where
            necessary for our legitimate interests (operating and securing a public job board, analytics to improve the
            Service, responding to inquiries) where those interests are not overridden by your rights; where needed to
            take steps at your request before a contract or to perform a contract (for example handling an employer
            board submission you send us); where required by law; or with consent where consent is required (for example
            optional cookies, where applicable).
          </p>
          <p className="mt-3">
            <span className="font-semibold text-foreground">Your rights.</span> You may have rights to access, correct,
            delete, restrict, object, withdraw consent, and request portability. Email hello@robotjobsboard.com. You may
            also lodge a complaint with your local supervisory authority, including Ireland&apos;s Data Protection
            Commission (
            <a href="https://www.dataprotection.ie" className="underline" rel="noopener noreferrer">
              dataprotection.ie
            </a>
            ), other EEA authorities listed by the{' '}
            <a href="https://edpb.europa.eu/about-edpb/board/members_en" className="underline" rel="noopener noreferrer">
              EDPB
            </a>
            , or the UK ICO (
            <a href="https://ico.org.uk" className="underline" rel="noopener noreferrer">
              ico.org.uk
            </a>
            ).
          </p>
          <p className="mt-3">
            <span className="font-semibold text-foreground">Transfers outside Europe.</span> Using the Service involves
            processing by providers in the United States and possibly other countries. Where we transfer personal data
            from Europe, we rely on appropriate safeguards (such as Standard Contractual Clauses) or another lawful
            transfer mechanism, or a derogation where permitted. Contact us for more detail on the mechanism used for a
            specific transfer.
          </p>
          <p className="mt-3">
            <span className="font-semibold text-foreground">No automated decision-making</span> that produces legal or
            similarly significant effects. Please do not submit sensitive personal data through the Service.
          </p>
        </section>

        <p>
          Using the Service is also subject to our{' '}
          <Link href="/terms" className="underline">
            Terms of Use
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
