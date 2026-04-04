export const metadata = {
  title: 'Privacy Policy — NexusForge',
  description: 'How NexusForge collects, uses, and protects your data.',
}

const EFFECTIVE_DATE = 'January 1, 2025'
const CONTACT_EMAIL  = 'privacy@usenexus.app'
const APP_NAME       = 'NexusForge'
const COMPANY_NAME   = 'NexusForge'

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-10">Effective date: {EFFECTIVE_DATE}</p>

      <div className="prose prose-gray max-w-none space-y-8 text-[15px] leading-relaxed text-gray-700">

        <section>
          <p>
            {COMPANY_NAME} ("we", "us", or "our") operates {APP_NAME}, a business growth
            platform accessible at usenexus.app. This Privacy Policy explains what information we
            collect, how we use it, with whom we share it, and your rights regarding your data.
          </p>
          <p className="mt-3">
            By using {APP_NAME} you agree to the collection and use of information in accordance
            with this policy. If you do not agree, please discontinue use of the platform.
          </p>
        </section>

        <Section title="1. Information We Collect">
          <Sub title="Account Information">
            When you register we collect your name, email address, and billing information
            (processed by Stripe — we do not store raw card numbers).
          </Sub>
          <Sub title="Business & CRM Data">
            You may input or import contact records (names, email addresses, phone numbers,
            company names, LinkedIn profiles, social handles, and notes). This data is stored
            solely for your use and is never shared with other customers.
          </Sub>
          <Sub title="Usage Data">
            We collect logs of actions taken within the platform (pages visited, features used,
            API calls made) to operate and improve the service.
          </Sub>
          <Sub title="Lead Finder Data">
            The Lead Finder surfaces publicly indexed profiles via Google Search (through
            Serper.dev) and uses Snov.io to attempt email enrichment. We store only the
            structured fields you choose to save to your CRM (name, title, company, email,
            profile URL). We do not store raw search result HTML.
          </Sub>
          <Sub title="AI Conversation Data">
            Messages you send to the AI Advisor are transmitted to Google (Gemini) and/or Groq
            for processing. Conversations are stored locally in your browser; we do not
            persistently store conversation content on our servers beyond the current session.
          </Sub>
          <Sub title="Chatbot Conversation Logs">
            When a visitor interacts with a chatbot you deploy, the conversation transcript is
            stored in your account so you can review leads and activity.
          </Sub>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>To provide, operate, and maintain the {APP_NAME} platform</li>
            <li>To process payments and manage your subscription via Stripe</li>
            <li>To send transactional emails (account confirmations, billing receipts) via Resend</li>
            <li>To generate AI-powered content and advice on your behalf via Google Gemini and Groq</li>
            <li>To produce video content on your behalf via HeyGen</li>
            <li>To publish social media content to connected accounts via Meta and TikTok APIs</li>
            <li>To improve the platform through aggregated, anonymized usage analytics</li>
            <li>To comply with legal obligations</li>
          </ul>
          <p className="mt-3">
            We do not sell your personal data or your CRM contacts to any third party.
          </p>
        </Section>

        <Section title="3. Third-Party Services We Use">
          <p>
            We share data with the following processors solely to deliver the service. Each has
            its own privacy policy and data processing agreement.
          </p>
          <table className="w-full mt-4 text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-3 py-2 border border-gray-200 font-semibold text-gray-700">Service</th>
                <th className="px-3 py-2 border border-gray-200 font-semibold text-gray-700">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Supabase',    'Database hosting and authentication'],
                ['Stripe',      'Payment processing and subscription management'],
                ['Resend',      'Transactional and outreach email delivery'],
                ['Google (Gemini)', 'AI advisor and content generation'],
                ['Groq',        'Fast AI inference'],
                ['HeyGen',      'AI video generation'],
                ['Serper.dev',  'Google Search API for Lead Finder'],
                ['Snov.io',     'B2B email enrichment for Lead Finder'],
                ['Meta',        'Instagram and Facebook content publishing'],
                ['TikTok',      'TikTok content publishing'],
              ].map(([svc, purpose]) => (
                <tr key={svc}>
                  <td className="px-3 py-2 border border-gray-200 font-medium text-gray-800">{svc}</td>
                  <td className="px-3 py-2 border border-gray-200 text-gray-600">{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="4. Data Retention">
          <p>
            We retain your account data for as long as your account is active or as needed to
            provide the service. If you delete your account, we will delete your data within
            30 days, except where we are legally required to retain it (e.g., financial records).
          </p>
          <p className="mt-3">
            CRM contact data, email logs, and chatbot transcripts are retained until you delete
            them or close your account.
          </p>
        </Section>

        <Section title="5. Your Rights">
          <p>
            Depending on your location you may have the following rights under applicable law
            (including GDPR and CCPA):
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5">
            <li><strong>Access</strong> — request a copy of the data we hold about you</li>
            <li><strong>Correction</strong> — request that inaccurate data be corrected</li>
            <li><strong>Deletion</strong> — request that your data be deleted ("right to be forgotten")</li>
            <li><strong>Portability</strong> — receive your data in a machine-readable format</li>
            <li><strong>Opt-out</strong> — opt out of any marketing communications at any time</li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, email us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 underline">{CONTACT_EMAIL}</a>.
            We will respond within 30 days.
          </p>
        </Section>

        <Section title="6. Email Outreach Compliance">
          <p>
            {APP_NAME} provides tools for email outreach. All outreach emails sent through the
            platform automatically include an unsubscribe link and, when configured, a physical
            mailing address. Users are solely responsible for ensuring their outreach complies
            with applicable laws, including the CAN-SPAM Act, GDPR, and CASL. We enforce rate
            limits and maintain suppression lists to help prevent abuse.
          </p>
        </Section>

        <Section title="7. Cookies">
          <p>
            We use essential session cookies required to operate the platform (authentication
            and security). We do not use third-party advertising or tracking cookies.
          </p>
        </Section>

        <Section title="8. Security">
          <p>
            We use industry-standard measures to protect your data, including encryption in
            transit (TLS) and at rest, row-level security policies in our database, and access
            controls. No method of transmission over the internet is 100% secure and we cannot
            guarantee absolute security.
          </p>
        </Section>

        <Section title="9. Children">
          <p>
            {APP_NAME} is not directed at individuals under the age of 18. We do not knowingly
            collect personal information from minors. If you believe a minor has provided us
            with their information, contact us and we will delete it promptly.
          </p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material
            changes by updating the effective date at the top of this page and, where appropriate,
            by email. Continued use of the platform after changes constitutes your acceptance of
            the updated policy.
          </p>
        </Section>

        <Section title="11. Contact Us">
          <p>
            Questions about this Privacy Policy? Contact us at:{' '}
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

function Sub({ title, children }) {
  return (
    <div className="mt-3">
      <h3 className="text-[14px] font-semibold text-gray-800 mb-1">{title}</h3>
      <p>{children}</p>
    </div>
  )
}
