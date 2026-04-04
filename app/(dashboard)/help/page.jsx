'use client'

import { useState, useEffect } from 'react'
import {
  Mail, Search, Bot, Users, CheckCircle2, Circle,
  ExternalLink, AlertCircle, Info, Copy, Check,
  ChevronLeft, ChevronRight, ChevronRight as Arrow,
  Video,
} from 'lucide-react'

/* ─── primitives ─────────────────────────────────────── */

function ExtLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`${children} (opens in new tab)`}
      className="text-indigo-400 underline underline-offset-2 decoration-indigo-400/40
                 hover:text-indigo-300 hover:decoration-indigo-300
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded
                 inline-flex items-center gap-0.5"
    >
      {children}
      <ExternalLink className="w-3 h-3" aria-hidden="true" />
    </a>
  )
}

function Mono({ children }) {
  return (
    <code className="bg-slate-800 border border-slate-700/80 rounded px-1.5 py-0.5
                     text-[11px] text-indigo-300 font-mono">
      {children}
    </code>
  )
}

function Note({ type = 'info', children }) {
  const map = {
    info:    { cls: 'bg-blue-500/8 border-blue-500/20 text-blue-300',     Icon: Info         },
    warning: { cls: 'bg-yellow-500/8 border-yellow-500/20 text-yellow-300', Icon: AlertCircle },
    success: { cls: 'bg-green-500/8 border-green-500/20 text-green-300',  Icon: CheckCircle2 },
  }
  const { cls, Icon } = map[type]
  return (
    <div role="note" className={`flex gap-3 border rounded-xl px-4 py-3.5 text-sm leading-relaxed ${cls}`}>
      <Icon className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
      <span>{children}</span>
    </div>
  )
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200
                 bg-slate-700/60 hover:bg-slate-700 border border-slate-600/50 rounded-md
                 px-2.5 py-1.5 transition-colors
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      {copied
        ? <><Check className="w-3 h-3 text-green-400" aria-hidden="true" /> Copied</>
        : <><Copy className="w-3 h-3" aria-hidden="true" /> Copy</>}
    </button>
  )
}

/* ─── Step timeline ──────────────────────────────────── */

function Steps({ children }) {
  return <ol className="space-y-0" aria-label="Setup steps">{children}</ol>
}

function Step({ number, title, children, last = false }) {
  return (
    <li className="flex gap-5">
      {/* Spine */}
      <div className="flex flex-col items-center shrink-0">
        <div
          aria-label={`Step ${number}`}
          className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700
                     flex items-center justify-center text-sm font-bold text-slate-300 shrink-0"
        >
          {number}
        </div>
        {!last && <div className="w-px flex-1 min-h-[24px] bg-slate-800 my-1" aria-hidden="true" />}
      </div>
      {/* Content */}
      <div className={`flex-1 ${last ? 'pb-0' : 'pb-8'}`}>
        <p className="text-[15px] font-semibold text-slate-100 leading-snug mb-2 pt-1.5">
          {title}
        </p>
        <div className="text-sm text-slate-400 leading-relaxed space-y-3">
          {children}
        </div>
      </div>
    </li>
  )
}

/* ─── Section content components ─────────────────────── */

const EMBED = '<script src="https://your-nexus-domain.com/widget.js" data-bot-id="YOUR_BOT_ID"></script>'

function EmailSetupContent() {
  return (
    <div className="space-y-6">
      <p className="text-slate-400 text-sm leading-relaxed">
        NexusForge sends emails through <strong className="text-slate-200 font-medium">Resend</strong>.
        You need your own account so emails come from <em>your</em> domain — not a shared platform
        address. This is the most important step for deliverability.
      </p>
      <Steps>
        <Step number={1} title="Create a free Resend account">
          Go to <ExtLink href="https://resend.com">resend.com</ExtLink> and sign up. The free
          plan gives you <strong className="text-slate-300">3,000 emails/month</strong> and 100/day.
          No credit card needed to start.
        </Step>
        <Step number={2} title="Add your sending domain">
          In Resend, go to <ExtLink href="https://resend.com/domains">Domains</ExtLink> and click{' '}
          <strong className="text-slate-300">Add Domain</strong>. Enter your domain (e.g.{' '}
          <Mono>yourbusiness.com</Mono>). Resend will show you 2–3 DNS records to add.
        </Step>
        <Step number={3} title="Add DNS records at your registrar">
          Log into GoDaddy, Cloudflare, Namecheap, or wherever your domain is registered. Add the
          DNS records exactly as Resend shows. Propagation usually takes a few minutes — sometimes
          up to 24 hours. Once Resend shows{' '}
          <strong className="text-green-400">Verified</strong>, move on.
          <Note type="warning">
            If you skip domain verification, sending will fail. Your From Email address must belong
            to a verified domain — <Mono>gmail.com</Mono> and <Mono>outlook.com</Mono> will not work.
          </Note>
        </Step>
        <Step number={4} title="Generate an API key">
          Go to <ExtLink href="https://resend.com/api-keys">resend.com/api-keys</ExtLink> and
          click <strong className="text-slate-300">Create API Key</strong>.{' '}
          <strong className="text-slate-300">Copy it immediately</strong> — Resend only shows it once.
        </Step>
        <Step number={5} title="Save your key in Nexus" last>
          Open <strong className="text-slate-300">Settings → Email Sending</strong> and paste
          your API key. Also fill in:
          <ul className="mt-3 space-y-2" role="list">
            {[
              ['Default From Name', 'e.g. Sarah at Acme — what recipients see as the sender name'],
              ['Default From Email', 'e.g. sarah@yourdomain.com — must use your verified domain'],
            ].map(([term, desc]) => (
              <li key={term} className="flex gap-3">
                <span className="text-slate-300 font-medium shrink-0 w-40">{term}</span>
                <span>{desc}</span>
              </li>
            ))}
          </ul>
          <Note type="success">
            Once saved, all campaigns use these as the default sender. You can override them per campaign.
          </Note>
        </Step>
      </Steps>
    </div>
  )
}

function LeadFinderContent() {
  return (
    <div className="space-y-6">
      <p className="text-slate-400 text-sm leading-relaxed">
        Search for potential customers across LinkedIn, TikTok, Facebook, and X/Twitter.
        Each search uses lead credits from your monthly plan allowance — check your credit
        balance in <strong className="text-slate-300">Settings</strong>.
      </p>
      <Steps>
        <Step number={1} title="Open Lead Finder">
          Click <strong className="text-slate-300">Lead Finder</strong> in the sidebar under
          the GROW section.
        </Step>
        <Step number={2} title="Enter a search keyword">
          Type a phrase describing the type of person or business you want to find.
          <div className="mt-3 grid grid-cols-3 gap-2">
            {['marketing agency london', 'fitness coach', 'SaaS founder', 'restaurant owner', 'real estate agent', 'ecommerce store'].map(ex => (
              <span key={ex} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-400 text-center">
                {ex}
              </span>
            ))}
          </div>
        </Step>
        <Step number={3} title="Narrow with filters">
          Use the filter panel to refine by platform (LinkedIn, TikTok, Facebook, X),
          industry, location, and company size. Switching platforms changes the search entirely —
          each has its own result format.
        </Step>
        <Step number={4} title="Review your results">
          Each result shows the person's name, company, headline, and a direct link to their profile.
          Click the profile link to verify they're the right person before saving.
        </Step>
        <Step number={5} title="Save leads to CRM" last>
          Click <strong className="text-slate-300">Save to CRM</strong> on any result.
          NexusForge will automatically try to find their email address.
          <Note type="info">
            Email enrichment works for roughly 30–50% of leads. If no email is found, open the
            contact in CRM and add it manually from their profile page.
          </Note>
        </Step>
      </Steps>
    </div>
  )
}

function CrmContent() {
  return (
    <div className="space-y-6">
      <p className="text-slate-400 text-sm leading-relaxed">
        Your central contact database. Everyone you save from Lead Finder, capture via chatbot,
        or add manually lives here. You need contacts in CRM before you can run email campaigns.
      </p>
      <Steps>
        <Step number={1} title="Browse your contacts">
          Open <strong className="text-slate-300">CRM</strong> in the sidebar. Use the search
          bar to filter by name, email, or company. The table shows status, source (how they were
          added), and when they were created.
        </Step>
        <Step number={2} title="Add contacts manually">
          Click <strong className="text-slate-300">+ Add Contact</strong> to add someone directly.
          Fill in as much as you know — email address is required to enrol them in outreach campaigns.
        </Step>
        <Step number={3} title="Open a contact's profile">
          Click any row to see the full contact profile: all their details, your notes, and a
          complete activity timeline showing every email sent, status change, and note added.
        </Step>
        <Step number={4} title="Use the Pipeline" last>
          Open <strong className="text-slate-300">Pipeline</strong> in the sidebar. Contacts appear
          as cards in a Kanban board. Drag them between stages to track where each deal stands:
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {['Lead', 'Contacted', 'Interested', 'Negotiating', 'Won / Lost'].map((s, i, arr) => (
              <span key={s} className="flex items-center gap-2">
                <span className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium">
                  {s}
                </span>
                {i < arr.length - 1 && <Arrow className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />}
              </span>
            ))}
          </div>
        </Step>
      </Steps>
    </div>
  )
}

function OutreachContent() {
  return (
    <div className="space-y-6">
      <p className="text-slate-400 text-sm leading-relaxed">
        Build multi-step email sequences and send them to groups of contacts. Each campaign has
        steps that go out automatically based on the delay schedule you define.
      </p>
      <Note type="warning">
        You must complete <strong className="font-medium">Email Sending Setup</strong> before
        campaigns will work. Without a valid Resend API key, all sends will fail.
      </Note>
      <Steps>
        <Step number={1} title="Create a campaign">
          Open <strong className="text-slate-300">Email Outreach</strong> and click{' '}
          <strong className="text-slate-300">New Campaign</strong>. Give it a name. Optionally
          set a campaign-level From Name and From Email — these override your Settings defaults
          for this campaign only.
        </Step>
        <Step number={2} title="Write your email steps">
          Add steps to the sequence. Each step has three fields:
          <div className="mt-3 space-y-2">
            {[
              ['Delay', 'Days to wait after the previous step. Step 1 always sends immediately.'],
              ['Subject', 'The email subject line.'],
              ['Body', 'The email body in plain text.'],
            ].map(([term, desc]) => (
              <div key={term} className="flex gap-3 bg-slate-800/60 border border-slate-700/50 rounded-lg px-4 py-2.5">
                <span className="text-slate-200 font-medium text-sm shrink-0 w-16">{term}</span>
                <span className="text-slate-400 text-sm">{desc}</span>
              </div>
            ))}
          </div>
        </Step>
        <Step number={3} title="Personalise with merge tags">
          Use these tags in your subject or body — NexusForgeForge replaces them with each contact's real data:
          <ul className="mt-3 flex flex-wrap gap-2" role="list" aria-label="Available merge tags">
            {['{{first_name}}', '{{last_name}}', '{{full_name}}', '{{company}}', '{{email}}', '{{sender_name}}'].map(tag => (
              <li key={tag}>
                <Mono>{tag}</Mono>
              </li>
            ))}
          </ul>
        </Step>
        <Step number={4} title="Enrol contacts">
          Click <strong className="text-slate-300">Save Steps</strong> first, then click{' '}
          <strong className="text-slate-300">Enrol Contacts</strong>. Search your CRM, tick the
          people you want, and confirm. Contacts already enrolled are automatically excluded.
        </Step>
        <Step number={5} title="Activate and send" last>
          Set the campaign status to <strong className="text-slate-300">Active</strong>, then
          click <strong className="text-slate-300">Send Now</strong> to dispatch the current
          pending step for all enrolled contacts.
          <Note type="info">
            <strong className="font-medium">How timing works:</strong> after a step is sent, the
            next step is queued for the delay you set. Clicking Send Now only dispatches steps
            that are currently due — nothing goes out early.
          </Note>
        </Step>
      </Steps>
    </div>
  )
}

function ChatbotContent() {
  return (
    <div className="space-y-6">
      <p className="text-slate-400 text-sm leading-relaxed">
        Embed an AI assistant on any website. Visitors ask questions and get instant answers
        based on training content you write. No technical knowledge needed to install it.
      </p>
      <Steps>
        <Step number={1} title="Create a new bot">
          Open <strong className="text-slate-300">Chatbot</strong> in the sidebar and click{' '}
          <strong className="text-slate-300">New Bot</strong>. Give it a name that describes
          what it's for (e.g. "Website FAQ Bot").
        </Step>
        <Step number={2} title="Write your training content">
          Paste in your FAQs, service descriptions, pricing details, business hours, and anything
          else visitors commonly ask about.{' '}
          <strong className="text-slate-300">The more detail you provide, the better the answers.</strong>{' '}
          The bot only knows what you write here — it won't guess or make things up.
        </Step>
        <Step number={3} title="Copy the embed snippet">
          On the bot's page, copy the embed code:
          <div className="mt-3 rounded-xl overflow-hidden border border-slate-700">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                Embed code
              </span>
              <CopyButton text={EMBED} />
            </div>
            <pre
              aria-label="Embed code snippet"
              className="px-4 py-3.5 text-xs text-slate-300 font-mono whitespace-pre-wrap break-all bg-slate-900/80 leading-relaxed"
            >
              {EMBED}
            </pre>
          </div>
        </Step>
        <Step number={4} title="Paste it on your website">
          Add the snippet just before the closing <Mono>&lt;/body&gt;</Mono> tag. Works with
          every major website platform:
          <div className="mt-3 grid grid-cols-3 gap-2">
            {['Webflow', 'WordPress', 'Wix', 'Squarespace', 'Shopify', 'Custom HTML'].map(p => (
              <span key={p} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-400 text-center">
                {p}
              </span>
            ))}
          </div>
        </Step>
        <Step number={5} title="Test it live" last>
          Visit your website and look for the chat bubble in the bottom-right corner. Send a test
          message to confirm it responds correctly. If something looks off, update the training
          content in NexusForge and try again — changes are instant.
          <Note type="success">
            The chatbot responds in real time using AI. Keep your training content accurate and
            specific for the best experience.
          </Note>
        </Step>
      </Steps>
    </div>
  )
}

function RunwayContent() {
  return (
    <div className="space-y-6">
      <p className="text-slate-400 text-sm leading-relaxed">
        NexusForge uses <strong className="text-slate-200 font-medium">Runway</strong> to generate
        cinematic AI videos for any brand — restaurants, gyms, law firms, coaches, any industry.
        Upload a reference image and Runway animates it into a professional video.
        You pay Runway directly for the credits you use.
      </p>
      <Note type="info">
        You only need <strong className="font-medium">one API key</strong> — it unlocks all Runway models.
        We use <strong className="font-medium">Gen-4 Turbo</strong> by default (their fastest image-to-video model).
      </Note>
      <Steps>
        <Step number={1} title="Create a Runway account">
          Go to <ExtLink href="https://dev.runwayml.com">dev.runwayml.com</ExtLink> and sign up
          for a developer account. This is separate from the regular Runway app — it gives you
          API access.
        </Step>
        <Step number={2} title="Top up credits">
          Runway API requires credits — there is no free tier for API access.
          Once logged in, go to <strong className="text-slate-300">Billing</strong> and purchase
          a credit top-up. A small top-up is enough to test the feature. Each 10-second video
          costs roughly <strong className="text-slate-300">5–10 credits</strong> depending on
          the model.
        </Step>
        <Step number={3} title="Generate your API key">
          In the Runway developer dashboard, go to <strong className="text-slate-300">API Keys</strong>{' '}
          in the left sidebar. Click <strong className="text-slate-300">Create new key</strong>.
          Give it a name like <Mono>NexusForge</Mono>. Copy it immediately — you won&apos;t be
          able to see it again.
          <Note type="warning">
            Keep your API key private. Never share it or commit it to a public repository.
          </Note>
        </Step>
        <Step number={4} title="Add your key to NexusForge">
          Go to <strong className="text-slate-300">Content Studio → Brand Setup</strong> (top right
          button). Scroll to the <strong className="text-slate-300">AI Video — Runway</strong> section.
          Paste your API key and click <strong className="text-slate-300">Save</strong>.
          The AI Videos tab will unlock immediately.
        </Step>
        <Step number={5} title="Generate your first video" last>
          Go to <strong className="text-slate-300">Content Studio → Videos tab</strong> and click{' '}
          <strong className="text-slate-300">New Video</strong>. Then:
          <ul className="mt-3 space-y-2 list-none">
            {[
              ['Upload an image', 'Your product, storefront, logo on a background, team photo — anything visual that represents your brand'],
              ['Enter a topic', 'Describe what you want the video to show — e.g. "coffee shop morning atmosphere"'],
              ['Click AI Generate Prompt', 'Let NexusForge write the cinematic Runway prompt for you, or write your own'],
              ['Pick platform & duration', '9:16 for TikTok, 16:9 for LinkedIn. 5s or 10s.'],
              ['Hit Generate', 'Runway renders in 1–3 minutes. You\'ll see it appear in your video list when ready.'],
            ].map(([term, desc]) => (
              <li key={term} className="flex gap-3 bg-slate-800/60 border border-slate-700/50 rounded-lg px-4 py-2.5">
                <span className="text-slate-200 font-medium text-sm shrink-0 w-44">{term}</span>
                <span className="text-slate-400 text-sm">{desc}</span>
              </li>
            ))}
          </ul>
          <Note type="success">
            Once generated, download the video or push it straight to the Auto Scheduler
            to post it on TikTok or LinkedIn automatically.
          </Note>
        </Step>
      </Steps>
    </div>
  )
}

/* ─── Sections config ────────────────────────────────── */

const SECTIONS = [
  {
    id:      'email-setup',
    label:   'Email Sending',
    icon:    Mail,
    color:   { ring: 'ring-indigo-500/30', icon: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', dot: 'bg-indigo-500', active: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' },
    Content: EmailSetupContent,
  },
  {
    id:      'lead-finder',
    label:   'Lead Finder',
    icon:    Search,
    color:   { ring: 'ring-blue-500/30', icon: 'text-blue-400 bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-500', active: 'bg-blue-500/10 border-blue-500/20 text-blue-300' },
    Content: LeadFinderContent,
  },
  {
    id:      'crm',
    label:   'CRM & Pipeline',
    icon:    Users,
    color:   { ring: 'ring-green-500/30', icon: 'text-green-400 bg-green-500/10 border-green-500/20', dot: 'bg-green-500', active: 'bg-green-500/10 border-green-500/20 text-green-300' },
    Content: CrmContent,
  },
  {
    id:      'outreach',
    label:   'Email Outreach',
    icon:    Mail,
    color:   { ring: 'ring-purple-500/30', icon: 'text-purple-400 bg-purple-500/10 border-purple-500/20', dot: 'bg-purple-500', active: 'bg-purple-500/10 border-purple-500/20 text-purple-300' },
    Content: OutreachContent,
  },
  {
    id:      'chatbot',
    label:   'Chatbot',
    icon:    Bot,
    color:   { ring: 'ring-orange-500/30', icon: 'text-orange-400 bg-orange-500/10 border-orange-500/20', dot: 'bg-orange-500', active: 'bg-orange-500/10 border-orange-500/20 text-orange-300' },
    Content: ChatbotContent,
  },
  {
    id:      'runway',
    label:   'AI Videos (Runway)',
    icon:    Video,
    color:   { ring: 'ring-violet-500/30', icon: 'text-violet-400 bg-violet-500/10 border-violet-500/20', dot: 'bg-violet-500', active: 'bg-violet-500/10 border-violet-500/20 text-violet-300' },
    Content: RunwayContent,
  },
]

const STORAGE_KEY = 'nexus_help_done'

/* ─── Page ───────────────────────────────────────────── */

export default function HelpPage() {
  const [activeId, setActiveId] = useState(SECTIONS[0].id)
  const [done, setDone] = useState({})

  useEffect(() => {
    try { setDone(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')) } catch {}
  }, [])

  function toggleDone(id) {
    setDone(prev => {
      const next = { ...prev, [id]: !prev[id] }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  const activeIdx = SECTIONS.findIndex(s => s.id === activeId)
  const active    = SECTIONS[activeIdx]
  const prev      = SECTIONS[activeIdx - 1]
  const next      = SECTIONS[activeIdx + 1]
  const doneCount = SECTIONS.filter(s => done[s.id]).length

  return (
    <div className="flex flex-col sm:flex-row sm:h-screen sm:overflow-hidden">

      {/* ── Left panel ── */}
      <aside
        aria-label="Setup guide navigation"
        className="w-full sm:w-72 sm:shrink-0 bg-slate-900/60 border-b sm:border-b-0 sm:border-r border-slate-800 flex flex-col sm:overflow-y-auto no-scrollbar"
      >
        {/* Header */}
        <div className="px-6 pt-8 pb-6 border-b border-slate-800">
          <h1 className="text-lg font-bold text-slate-100">Setup Guide</h1>
          <p className="text-xs text-slate-500 mt-1">Get NexusForge ready in 5 steps</p>

          {/* Progress */}
          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Progress</span>
              <span
                aria-live="polite"
                aria-label={`${doneCount} of ${SECTIONS.length} sections completed`}
              >
                {doneCount}/{SECTIONS.length}
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={doneCount}
              aria-valuemin={0}
              aria-valuemax={SECTIONS.length}
              aria-label="Overall setup progress"
              className="h-1.5 bg-slate-800 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${(doneCount / SECTIONS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Section nav */}
        <nav aria-label="Sections" className="flex-1 px-3 py-4 space-y-1">
          {SECTIONS.map((section, i) => {
            const isActive = section.id === activeId
            const isDone   = !!done[section.id]
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveId(section.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm
                            text-left transition-all group
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                            ${isActive
                              ? `border ${section.color.active}`
                              : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            }`}
              >
                {/* Number */}
                <span
                  aria-hidden="true"
                  className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 transition-colors
                              ${isDone
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : isActive
                                  ? 'bg-slate-700 text-slate-300 border border-slate-600'
                                  : 'bg-slate-800 text-slate-500 border border-slate-700 group-hover:text-slate-400'
                              }`}
                >
                  {isDone ? '✓' : i + 1}
                </span>

                <span className="flex-1 font-medium">{section.label}</span>

                {/* Dot */}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${section.color.dot}`}
                  />
                )}
              </button>
            )
          })}
        </nav>

        {/* Mark done button */}
        <div className="px-5 py-5 border-t border-slate-800">
          <button
            type="button"
            onClick={() => toggleDone(activeId)}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium
                        border transition-all
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                        ${done[activeId]
                          ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/5'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                        }`}
          >
            {done[activeId]
              ? <><CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Marked complete</>
              : <><Circle className="w-4 h-4" aria-hidden="true" /> Mark as complete</>}
          </button>
        </div>
      </aside>

      {/* ── Right content panel ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:px-10 sm:py-10">

          {/* Section header */}
          <header className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div
                aria-hidden="true"
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${active.color.icon}`}
              >
                <active.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-0.5">
                  Step {activeIdx + 1} of {SECTIONS.length}
                </p>
                <h2 className="text-2xl font-bold text-slate-100">{active.label}</h2>
              </div>
              {done[activeId] && (
                <span className="ml-auto flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Complete
                </span>
              )}
            </div>
          </header>

          {/* Section content */}
          <article aria-label={`${active.label} instructions`}>
            <active.Content />
          </article>

          {/* Prev / Next navigation */}
          <nav
            aria-label="Section navigation"
            className="flex items-center justify-between mt-12 pt-6 border-t border-slate-800"
          >
            {prev ? (
              <button
                type="button"
                onClick={() => setActiveId(prev.id)}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200
                           border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-2.5
                           transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                {prev.label}
              </button>
            ) : <div />}

            {next ? (
              <button
                type="button"
                onClick={() => {
                  if (!done[activeId]) toggleDone(activeId)
                  setActiveId(next.id)
                }}
                className="flex items-center gap-2 text-sm font-medium
                           bg-indigo-600 hover:bg-indigo-500 text-white
                           rounded-xl px-5 py-2.5 transition-all
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Next: {next.label}
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => toggleDone(activeId)}
                className={`flex items-center gap-2 text-sm font-medium rounded-xl px-5 py-2.5
                            border transition-all
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                            ${done[activeId]
                              ? 'bg-green-500/10 border-green-500/20 text-green-400'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent'
                            }`}
              >
                {done[activeId]
                  ? <><CheckCircle2 className="w-4 h-4" aria-hidden="true" /> All done!</>
                  : <><Check className="w-4 h-4" aria-hidden="true" /> Finish setup</>}
              </button>
            )}
          </nav>
        </div>
      </div>
    </div>
  )
}
