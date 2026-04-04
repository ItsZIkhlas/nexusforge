export const metadata = {
  title: 'Terms of Service — NexusForge',
  description: 'Terms governing your use of NexusForge.',
}

const EFFECTIVE_DATE = 'January 1, 2025'
const CONTACT_EMAIL  = 'legal@usenexus.app'
const APP_NAME       = 'NexusForge'
const COMPANY_NAME   = 'NexusForge'

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-10">Effective date: {EFFECTIVE_DATE}</p>

      <div className="prose prose-gray max-w-none space-y-8 text-[15px] leading-relaxed text-gray-700">

        <section>
          <p>
            These Terms of Service ("Terms") govern your access to and use of {APP_NAME}
            ("Service"), operated by {COMPANY_NAME}. By creating an account or using the
            Service you agree to be bound by these Terms. If you do not agree, do not use
            the Service.
          </p>
        </section>

        <Section title="1. Accounts">
          <p>
            You must provide accurate information when creating an account. You are responsible
            for maintaining the security of your account credentials and for all activity that
            occurs under your account. Notify us immediately at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 underline">{CONTACT_EMAIL}</a>{' '}
            if you suspect unauthorized access.
          </p>
          <p className="mt-3">
            You must be at least 18 years old to use the Service. By agreeing to these Terms
            you represent that you are 18 or older.
          </p>
        </Section>

        <Section title="2. Subscription and Billing">
          <p>
            The Service is offered on a subscription basis. Subscription fees are charged in
            advance on a monthly or annual cycle depending on the plan you select. All fees are
            displayed in USD and are non-refundable except as required by applicable law or as
            stated in our refund policy.
          </p>
          <p className="mt-3">
            You may cancel your subscription at any time through your account settings. Cancellation
            takes effect at the end of the current billing period. You will retain access to
            paid features until that date.
          </p>
          <p className="mt-3">
            We reserve the right to change pricing with 30 days' notice. Continued use after a
            price change takes effect constitutes acceptance of the new pricing.
          </p>
        </Section>

        <Section title="3. Acceptable Use">
          <p>
            You agree to use the Service only for lawful purposes and in compliance with all
            applicable laws and regulations. You agree that you will <strong>not</strong>:
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5">
            <li>Send unsolicited commercial email (spam) to individuals who have not given consent</li>
            <li>Use the email outreach tools to violate the CAN-SPAM Act, GDPR, CASL, or any other
                applicable email law</li>
            <li>Use the Lead Finder to build or resell bulk contact databases</li>
            <li>Scrape, crawl, or use automated means to access any third-party platform in
                violation of that platform's terms of service</li>
            <li>Harvest or collect personal data about individuals without a lawful basis</li>
            <li>Impersonate any person or entity or misrepresent your affiliation with any person
                or entity in outreach emails or chatbot communications</li>
            <li>Use the AI tools to generate false, defamatory, or deceptive content</li>
            <li>Attempt to gain unauthorized access to any part of the Service or its
                infrastructure</li>
            <li>Resell, sublicense, or commercially exploit the Service without our prior written
                consent</li>
            <li>Violate any applicable export control, sanctions, or trade laws</li>
          </ul>
        </Section>

        <Section title="4. Email Outreach — User Responsibility">
          <p>
            {APP_NAME} provides email outreach infrastructure. You are the sender of record for
            all emails dispatched through the Service and bear sole legal responsibility for
            compliance with:
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5">
            <li>The CAN-SPAM Act (United States)</li>
            <li>GDPR (European Union)</li>
            <li>CASL (Canada)</li>
            <li>Any other applicable email or anti-spam regulations in your jurisdiction</li>
          </ul>
          <p className="mt-3">
            This includes — but is not limited to — obtaining appropriate consent before
            sending, including a valid physical mailing address, honoring unsubscribe requests
            promptly, and not using deceptive subject lines or sender information.
          </p>
          <p className="mt-3">
            We reserve the right to suspend or terminate accounts that generate abuse
            complaints, spam reports, or that we determine are using the email tools in
            violation of applicable law.
          </p>
        </Section>

        <Section title="5. AI-Generated Content">
          <p>
            The Service includes AI-powered features (AI Advisor, content generation, email
            writing) powered by third-party models including Google Gemini and Groq.
            AI-generated content may be inaccurate, incomplete, or inappropriate for your
            specific situation. You are solely responsible for reviewing, editing, and approving
            any AI-generated content before using, publishing, or sending it. We make no
            warranty regarding the accuracy or fitness of AI outputs.
          </p>
        </Section>

        <Section title="6. Intellectual Property">
          <p>
            All content, software, trademarks, and technology comprising the Service are owned
            by {COMPANY_NAME} and protected by applicable intellectual property laws. You are
            granted a limited, non-exclusive, non-transferable license to access and use the
            Service for your internal business purposes during the term of your subscription.
          </p>
          <p className="mt-3">
            You retain ownership of all data and content you upload to or create within the
            Service. By using the Service you grant us a limited license to process and store
            your data solely for the purpose of providing the Service.
          </p>
        </Section>

        <Section title="7. Termination">
          <p>
            We may suspend or terminate your account immediately, without prior notice, if you
            breach these Terms or if we are required to do so by law. Upon termination your
            right to access the Service ceases and we may delete your account data in accordance
            with our data retention policy.
          </p>
          <p className="mt-3">
            You may terminate your account at any time by contacting us or through your account
            settings. Termination does not entitle you to a refund of any prepaid fees.
          </p>
        </Section>

        <Section title="8. Disclaimers">
          <p>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
            EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY,
            FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE
            SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL
            COMPONENTS.
          </p>
        </Section>

        <Section title="9. Limitation of Liability">
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, {COMPANY_NAME.toUpperCase()} AND ITS
            OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED
            TO YOUR USE OF THE SERVICE. OUR TOTAL CUMULATIVE LIABILITY SHALL NOT EXCEED THE
            GREATER OF (A) THE FEES YOU PAID IN THE 12 MONTHS PRECEDING THE CLAIM OR (B)
            ONE HUNDRED US DOLLARS ($100).
          </p>
        </Section>

        <Section title="10. Indemnification">
          <p>
            You agree to indemnify, defend, and hold harmless {COMPANY_NAME} and its officers,
            directors, employees, and agents from any claims, liabilities, damages, and expenses
            (including reasonable legal fees) arising out of or related to your use of the
            Service, your violation of these Terms, or your violation of any third-party rights,
            including without limitation any email laws or platform terms of service.
          </p>
        </Section>

        <Section title="11. Governing Law">
          <p>
            These Terms are governed by the laws of the State of Delaware, United States, without
            regard to its conflict-of-law provisions. Any dispute arising under these Terms shall
            be resolved in the courts located in Delaware.
          </p>
        </Section>

        <Section title="12. Changes to These Terms">
          <p>
            We may modify these Terms at any time. We will provide notice of material changes by
            updating the effective date and, where appropriate, by email. Continued use of the
            Service after changes take effect constitutes acceptance of the revised Terms.
          </p>
        </Section>

        <Section title="13. Contact">
          <p>
            Questions about these Terms? Contact us at:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 underline">{CONTACT_EMAIL}</a>
          </p>
        </Section>

      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
      {children}
    </section>
  )
}
