'use client'

import { useState } from 'react'
import {
  Building2, CreditCard, Plug, AlertTriangle, Check,
  Loader2, ExternalLink, Linkedin, Video, Save,
  Users, Mail, Bot, Search, Zap, ChevronRight,
  ShieldAlert, CheckCircle2, XCircle, Camera, Download,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const NAV = [
  { id: 'general',      label: 'General',       icon: Building2    },
  { id: 'billing',      label: 'Plan & Billing', icon: CreditCard   },
  { id: 'integrations', label: 'Integrations',   icon: Plug         },
  { id: 'danger',       label: 'Danger Zone',    icon: AlertTriangle },
]

const PLAN_FEATURES = [
  { key: 'maxBots',      label: 'Chatbots',      icon: Bot,    fmt: v => v === -1 ? 'Unlimited' : v },
  { key: 'maxContacts',  label: 'CRM Contacts',  icon: Users,  fmt: v => v === -1 ? 'Unlimited' : v.toLocaleString() },
  { key: 'leadCredits',  label: 'Lead Credits',  icon: Search, fmt: v => v === -1 ? 'Unlimited' : v.toLocaleString() },
  { key: 'emailSends',   label: 'Emails / mo',   icon: Mail,   fmt: v => v === -1 ? 'Unlimited' : v.toLocaleString() },
]

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI primitives
// ─────────────────────────────────────────────────────────────────────────────

const INPUT = `w-full bg-slate-900 border border-slate-800/60 rounded-lg px-3.5 py-2.5
  text-sm text-white placeholder:text-slate-600
  focus:outline-none focus:ring-1 focus:ring-indigo-500/60 focus:border-indigo-500/40
  transition`

function SectionHeader({ title, description }) {
  return (
    <div className="mb-6">
      <h2 className="text-[15px] font-semibold text-slate-100 tracking-tight">{title}</h2>
      {description && <p className="text-[13px] text-slate-500 mt-0.5">{description}</p>}
    </div>
  )
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-[#0d1117] border border-slate-800/60 rounded-xl overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

function CardRow({ label, description, children }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-800/60 last:border-0">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-slate-200">{label}</p>
        {description && <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function UsageBar({ used, total, color = 'bg-indigo-500' }) {
  const pct = total === -1 ? 0 : Math.min(100, (used / total) * 100)
  const warn = pct > 80
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${warn ? 'bg-amber-500' : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] text-slate-500 tabular-nums w-20 text-right shrink-0">
        {used.toLocaleString()} / {total === -1 ? '∞' : total.toLocaleString()}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// General section
// ─────────────────────────────────────────────────────────────────────────────

function GeneralSection({ org, user }) {
  const [name,         setName]         = useState(org.name)
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [error,        setError]        = useState('')

  // Sender details state
  const [fromName,     setFromName]     = useState(org.resend_from_name  ?? '')
  const [fromEmail,    setFromEmail]    = useState(org.resend_from_email ?? '')
  const [address,      setAddress]      = useState(org.physical_address  ?? '')
  const [senderSaving, setSenderSaving] = useState(false)
  const [senderSaved,  setSenderSaved]  = useState(false)
  const [senderError,  setSenderError]  = useState('')

  async function handleSave(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true); setError(''); setSaved(false)
    const res  = await fetch('/api/settings/org', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: name.trim() }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500) }
    else setError(data.error ?? 'Failed to save')
  }

  async function handleSenderSave(e) {
    e.preventDefault()
    setSenderSaving(true); setSenderError(''); setSenderSaved(false)
    const res = await fetch('/api/settings/org', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        resend_from_name:  fromName.trim(),
        resend_from_email: fromEmail.trim(),
        physical_address:  address.trim(),
      }),
    })
    const data = await res.json()
    setSenderSaving(false)
    if (res.ok) { setSenderSaved(true); setTimeout(() => setSenderSaved(false), 2500) }
    else setSenderError(data.error ?? 'Failed to save')
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="General" description="Manage your organisation and account details." />

      {/* Org details */}
      <Card>
        <div className="px-5 py-3.5 border-b border-slate-800/60">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Organisation</p>
        </div>
        <div className="p-5 space-y-4">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Organisation Name</label>
              <input
                className={INPUT}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Acme Corp"
                required
              />
            </div>
            {error && <p className="text-[12px] text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={saving || name.trim() === org.name}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500
                         text-white text-[13px] font-semibold rounded-lg transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </form>
        </div>
      </Card>

      {/* Sender details (used in all outreach email footers) */}
      <Card>
        <div className="px-5 py-3.5 border-b border-slate-800/60">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Email Sender Details</p>
            <span className="text-[10px] text-slate-700 bg-slate-800/60 px-2 py-0.5 rounded-full">Required for outreach</span>
          </div>
        </div>
        <div className="p-5">
          <p className="text-[12px] text-slate-500 mb-4 leading-relaxed">
            Used in the From field and footer of every outreach email. Required by CAN-SPAM — a physical address must appear in all commercial emails.
          </p>
          <form onSubmit={handleSenderSave} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Sender Name</label>
                <input
                  className={INPUT}
                  value={fromName}
                  onChange={e => setFromName(e.target.value)}
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Sender Email</label>
                <input
                  className={INPUT}
                  type="email"
                  value={fromEmail}
                  onChange={e => setFromEmail(e.target.value)}
                  placeholder="jane@yourcompany.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Physical Address</label>
              <input
                className={INPUT}
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="123 Main St, New York, NY 10001, USA"
              />
              <p className="text-[11px] text-slate-600 mt-1.5">Appears in the footer of every outreach email you send.</p>
            </div>
            {senderError && <p className="text-[12px] text-red-400">{senderError}</p>}
            <button
              type="submit"
              disabled={senderSaving}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500
                         text-white text-[13px] font-semibold rounded-lg transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {senderSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : senderSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {senderSaved ? 'Saved!' : 'Save Sender Details'}
            </button>
          </form>
        </div>
      </Card>

      {/* Account */}
      <Card>
        <div className="px-5 py-3.5 border-b border-slate-800/60">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Account</p>
        </div>
        <CardRow label="Email address" description="Your login email. Managed through Supabase auth.">
          <span className="text-[13px] text-slate-400 font-mono">{user.email}</span>
        </CardRow>
        <CardRow label="Password" description="Update your account password.">
          <ChangePasswordButton />
        </CardRow>
      </Card>
    </div>
  )
}

function ChangePasswordButton() {
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleReset() {
    setLoading(true)
    await fetch('/api/settings/reset-password', { method: 'POST' })
    setLoading(false)
    setSent(true)
  }

  if (sent) return (
    <span className="flex items-center gap-1.5 text-[12px] text-emerald-400">
      <CheckCircle2 className="w-3.5 h-3.5" /> Reset email sent
    </span>
  )

  return (
    <button
      onClick={handleReset}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-700/60 bg-slate-800/60
                 hover:bg-slate-800 text-slate-300 text-[12px] font-medium rounded-lg transition-all
                 disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
      Send reset link
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Billing section
// ─────────────────────────────────────────────────────────────────────────────

function BillingSection({ org, plan, plans, counts }) {
  const [showPlans, setShowPlans] = useState(false)
  const status       = org.subscription_status ?? 'inactive'
  const isSubscribed = status === 'active'   // actually paying — excludes trialing
  const isTrialing   = status === 'trialing'
  const isPastDue    = status === 'past_due'

  const statusMeta = {
    trialing: { label: 'Free trial',    color: 'text-sky-400',    bg: 'bg-sky-500/10 border-sky-500/20'       },
    active:   { label: 'Active',        color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    past_due: { label: 'Past due',      color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20'   },
    canceled: { label: 'Cancelled',     color: 'text-slate-500',  bg: 'bg-slate-500/10 border-slate-500/20'   },
    inactive: { label: 'No plan',       color: 'text-slate-500',  bg: 'bg-slate-500/10 border-slate-500/20'   },
  }[status] ?? { label: status, color: 'text-slate-400', bg: 'bg-slate-700/30 border-slate-700' }

  return (
    <div className="space-y-4">
      <SectionHeader title="Plan & Billing" description="Manage your subscription and view usage across all features." />

      {/* Status banners */}
      {isTrialing && org.trial_ends_at && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border border-sky-500/20 bg-sky-500/5">
          <Zap className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-sky-300 font-medium">
              Free trial — ends <strong>{new Date(org.trial_ends_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
            </p>
            <p className="text-[12px] text-sky-400/70 mt-0.5">
              Trial includes limited access: 10 lead credits, 100 contacts, and 1 chatbot. Choose a plan to unlock full features.
            </p>
          </div>
          <button
            onClick={() => setShowPlans(true)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500
                       text-white text-[12px] font-semibold rounded-lg transition-colors"
          >
            Choose plan
          </button>
        </div>
      )}
      {isPastDue && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-[13px] text-amber-300 flex-1">Your last payment failed. Update your payment method to avoid losing access.</p>
          <button
            onClick={() => setShowPlans(true)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 border border-slate-700/60
                       bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-[12px] font-medium rounded-lg transition-all"
          >
            <CreditCard className="w-3 h-3" /> Choose plan
          </button>
        </div>
      )}

      {/* Current plan + status */}
      <Card>
        <div className="px-5 py-3.5 border-b border-slate-800/60 flex items-center justify-between">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Current Plan</p>
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusMeta.bg} ${statusMeta.color}`}>
            {statusMeta.label}
          </span>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-bold text-white">{plan.name}</p>
              <p className="text-[13px] text-slate-500 mt-0.5">{plan.price === 0 ? 'Free' : `$${plan.price}/month`}</p>
            </div>
            <button
              onClick={() => setShowPlans(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-700/60 bg-slate-800/60
                         hover:bg-slate-800 text-slate-300 text-[12px] font-medium rounded-lg transition-all"
            >
              <CreditCard className="w-3 h-3" /> Manage plan
            </button>
          </div>

          {/* Usage bars */}
          <div className="space-y-3 pt-2 border-t border-slate-800/60">
            <UsageRow label="Lead Credits"  used={counts.leadCreditsUsed}  total={plan.leadCredits}  icon={Search} />
            <UsageRow label="CRM Contacts"  used={counts.contacts}         total={plan.maxContacts}  icon={Users}  />
            <UsageRow label="Chatbots"       used={counts.bots}             total={plan.maxBots}      icon={Bot}    />
          </div>
        </div>
      </Card>

      {/* Plans modal */}
      {showPlans && (
        <PlansModal
          plans={plans}
          orgPlanId={org.plan_id}
          status={status}
          isSubscribed={isSubscribed}
          onClose={() => setShowPlans(false)}
        />
      )}

    </div>
  )
}

function UsageRow({ label, used, total, icon: Icon }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3 h-3 text-slate-600" />
          <span className="text-[11px] font-medium text-slate-500">{label}</span>
        </div>
      </div>
      <UsageBar used={used ?? 0} total={total} />
    </div>
  )
}

// Plans modal — shown when user clicks "Manage plan" or "Choose plan"
function PlansModal({ plans, orgPlanId, status, isSubscribed, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-[#0d1117] border border-slate-800/60 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
          <div>
            <h3 className="text-[15px] font-semibold text-slate-100">Choose a plan</h3>
            <p className="text-[12px] text-slate-500 mt-0.5">Upgrade anytime. Cancel anytime.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Plan grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(plans).map(([planKey, p]) => (
            <PlanCard
              key={planKey}
              planKey={planKey}
              plan={p}
              orgPlanId={orgPlanId}
              status={status}
              isSubscribed={isSubscribed}
            />
          ))}
        </div>

      </div>
    </div>
  )
}

function PlanCard({ planKey, plan, orgPlanId, status, isSubscribed }) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  // A plan is "current" only when the user has an active paid subscription to it
  const isCurrent     = isSubscribed && orgPlanId === planKey
  const isStarterPlan = planKey === 'starter'
  const isRecommended = planKey === 'pro'

  // Show trial button only for starter when user has no subscription at all
  const showTrial  = isStarterPlan && !['active', 'trialing'].includes(status)

  const planRank    = { starter: 0, pro: 1, business: 2 }
  const currentRank = isSubscribed ? (planRank[orgPlanId] ?? 0) : -1
  const thisRank    = planRank[planKey] ?? 0
  const isUpgrade   = thisRank > currentRank

  const buttonLabel = isCurrent
    ? 'Current plan'
    : showTrial
      ? 'Start 14-day trial'
      : isUpgrade
        ? `Upgrade to ${plan.name}`
        : `Switch to ${plan.name}`

  async function handleCheckout() {
    if (isCurrent) return
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/stripe/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ planId: planKey, trial: showTrial }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Could not start checkout')
        setLoading(false)
      }
    } catch {
      setError('Network error')
      setLoading(false)
    }
  }

  return (
    <div className={`relative flex flex-col rounded-xl border transition-all ${
      isCurrent
        ? 'border-indigo-500/40 bg-indigo-500/5'
        : isRecommended
          ? 'border-slate-600/60 bg-slate-900/60'
          : 'border-slate-800/60 bg-slate-900/40'
    }`}>

      {isRecommended && !isCurrent && (
        <div className="absolute -top-px left-1/2 -translate-x-1/2">
          <span className="inline-block px-3 py-0.5 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wide rounded-b-lg">
            Popular
          </span>
        </div>
      )}

      <div className="p-5 border-b border-slate-800/60">
        <div className="flex items-baseline justify-between mb-1">
          <p className={`text-[13px] font-bold ${isCurrent ? 'text-indigo-400' : 'text-slate-200'}`}>{plan.name}</p>
          {isCurrent && <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-md">Active</span>}
        </div>
        <p className="text-2xl font-bold text-white tracking-tight">
          ${plan.price}<span className="text-[13px] font-normal text-slate-500">/mo</span>
        </p>
      </div>

      <div className="p-5 flex-1 space-y-2.5">
        {PLAN_FEATURES.map(f => (
          <div key={f.key} className="flex items-center gap-2">
            <Check className={`w-3 h-3 shrink-0 ${isCurrent ? 'text-indigo-400' : 'text-slate-500'}`} />
            <span className="text-[12px] text-slate-400">
              <span className="text-slate-200 font-medium">{f.fmt(plan[f.key])}</span>{' '}{f.label}
            </span>
          </div>
        ))}
      </div>

      <div className="p-5 pt-0 space-y-2">
        {error && <p className="text-[11px] text-red-400 text-center">{error}</p>}
        <button
          onClick={handleCheckout}
          disabled={isCurrent || loading}
          className={`w-full py-2.5 rounded-lg text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
            isCurrent
              ? 'bg-slate-800/60 text-slate-600 cursor-default border border-slate-700/40'
              : showTrial
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          } disabled:opacity-60`}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : buttonLabel}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Integrations section
// ─────────────────────────────────────────────────────────────────────────────

function IntegrationsSection({ linkedinName, hasRunwayKey, socialConnections }) {
  const [connections, setConnections] = useState(
    Array.isArray(socialConnections) ? socialConnections : []
  )
  const [disconnecting, setDisconnecting] = useState(null)

  const metaConn   = connections.find(c => c.platform === 'meta')
  const tiktokConn = connections.find(c => c.platform === 'tiktok')

  async function disconnect(platform) {
    setDisconnecting(platform)
    await fetch(`/api/social-connections?platform=${platform}`, { method: 'DELETE' })
    setConnections(prev => prev.filter(c => c.platform !== platform))
    setDisconnecting(null)
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Integrations" description="Connect external services to unlock automation features." />

      <Card>
        <div className="px-5 py-3.5 border-b border-slate-800/60">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Connected Accounts</p>
        </div>

        {/* LinkedIn */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
              <Linkedin className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-slate-200">LinkedIn</p>
              <p className="text-[11px] text-slate-500">Auto-publish approved posts to your profile</p>
            </div>
          </div>
          {linkedinName ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[12px] text-emerald-400 font-medium">{linkedinName}</span>
              </div>
              <a href="/api/auth/linkedin"
                className="px-2.5 py-1 text-[11px] text-slate-500 hover:text-slate-300 border border-slate-700/60 rounded-md transition-colors">
                Reconnect
              </a>
            </div>
          ) : (
            <a href="/api/auth/linkedin"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-[12px] font-semibold rounded-lg transition-colors">
              <Linkedin className="w-3 h-3" /> Connect
            </a>
          )}
        </div>

        {/* Meta (Instagram + Facebook) — Coming Soon */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60 opacity-50 cursor-not-allowed select-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/40 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-semibold text-slate-400">Meta (Instagram + Facebook)</p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-500 border border-slate-600/40 tracking-wide">
                  COMING SOON
                </span>
              </div>
              <p className="text-[11px] text-slate-600">Auto-post videos to Instagram Reels and Facebook Pages</p>
            </div>
          </div>
          <span className="text-[11px] text-slate-600 font-medium">Not available yet</span>
        </div>

        {/* TikTok */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-700/50 border border-slate-600/40 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-slate-200" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.54V6.79a4.85 4.85 0 01-1.02-.1z"/>
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-slate-200">TikTok</p>
              <p className="text-[11px] text-slate-500">
                {tiktokConn
                  ? `@${tiktokConn.platform_username ?? 'Connected'}`
                  : 'Auto-post short videos to your TikTok account'}
              </p>
            </div>
          </div>
          {tiktokConn ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[12px] text-emerald-400 font-medium">Connected</span>
              </div>
              <button
                onClick={() => disconnect('tiktok')}
                disabled={disconnecting === 'tiktok'}
                className="px-2.5 py-1 text-[11px] text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 rounded-md transition-colors"
              >
                {disconnecting === 'tiktok' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Disconnect'}
              </button>
            </div>
          ) : (
            <a href="/api/auth/tiktok"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-700/60 bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-[12px] font-semibold rounded-lg transition-colors">
              Connect
            </a>
          )}
        </div>

        {/* Runway */}
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
              <Video className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-slate-200">Runway</p>
              <p className="text-[11px] text-slate-500">Cinematic AI video generation for any brand</p>
            </div>
          </div>
          {hasRunwayKey ? (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[12px] text-emerald-400 font-medium">API key saved</span>
            </div>
          ) : (
            <a href="/content/brand"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-700/60 bg-slate-800/60
                         hover:bg-slate-800 text-slate-300 text-[12px] font-medium rounded-lg transition-all">
              <ChevronRight className="w-3 h-3" /> Add key
            </a>
          )}
        </div>
      </Card>

      <Card>
        <div className="px-5 py-3.5 border-b border-slate-800/60">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Email Sending</p>
        </div>
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-slate-200">Resend</p>
              <p className="text-[11px] text-slate-500">Transactional and outreach emails — set via RESEND_API_KEY env var</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[12px] text-emerald-400 font-medium">Configured</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Danger Zone section
// ─────────────────────────────────────────────────────────────────────────────

function DangerSection({ orgName }) {
  const [confirm,   setConfirm]   = useState('')
  const [deleting,  setDeleting]  = useState(false)
  const [open,      setOpen]      = useState(false)
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const res  = await fetch('/api/settings/export')
      if (!res.ok) { alert('Export failed'); return }
      const blob = await res.blob()
      const date = new Date().toISOString().slice(0, 10)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `nexus-export-${date}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally { setExporting(false) }
  }

  const match = confirm.trim().toLowerCase() === orgName.trim().toLowerCase()

  async function handleDelete() {
    if (!match) return
    setDeleting(true)
    const res = await fetch('/api/settings/org', { method: 'DELETE' })
    if (res.ok) window.location.href = '/login'
    else setDeleting(false)
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Danger Zone" description="Permanent actions that cannot be undone." />

      {/* Export Data */}
      <div className="border border-slate-800/60 rounded-xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-[13px] font-semibold text-slate-200">Export All Data</p>
            <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">
              Download all your data — contacts, deals, bots, campaigns, and content — as a JSON file.
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 border border-slate-700/60
                       bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-slate-100
                       text-[12px] font-semibold rounded-lg transition-all disabled:opacity-50"
          >
            {exporting
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Download className="w-3.5 h-3.5" />
            }
            Export
          </button>
        </div>
      </div>

      <div className="border border-red-500/20 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-red-500/20 bg-red-500/5">
          <p className="text-[10px] font-semibold text-red-500/70 uppercase tracking-widest">Destructive Actions</p>
        </div>
        <div className="flex items-start justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-[13px] font-semibold text-slate-200">Delete Organisation</p>
            <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">
              Permanently delete your organisation and all associated data — contacts, campaigns, bots, and content. This cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 border border-red-500/30
                       bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300
                       text-[12px] font-semibold rounded-lg transition-all"
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* Confirm modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0d1117] border border-red-500/20 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800/60">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                </div>
                <p className="text-[13px] font-semibold text-slate-100">Delete Organisation</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-[13px] text-slate-400 leading-relaxed">
                This will permanently delete <span className="text-white font-semibold">{orgName}</span> and all its data.
                There is no way to recover it.
              </p>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                  Type <span className="text-white font-mono">{orgName}</span> to confirm
                </label>
                <input
                  className={INPUT}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder={orgName}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setOpen(false); setConfirm('') }}
                  className="flex-1 py-2.5 border border-slate-700/60 text-slate-400 hover:text-slate-200
                             text-[13px] font-medium rounded-xl hover:border-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!match || deleting}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-600 hover:bg-red-500
                             text-white text-[13px] font-semibold rounded-xl transition-colors
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete permanently'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Root client component
// ─────────────────────────────────────────────────────────────────────────────

export default function SettingsClient({ user, org, plan, plans, counts, linkedinName, hasRunwayKey, socialConnections }) {
  const [active, setActive] = useState('general')

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">

        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-1.5 mb-1">
            <Building2 className="w-4 h-4 text-slate-500" />
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">Settings</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-100 tracking-tight">Account & Billing</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your workspace, subscription, and integrations.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">

          {/* Left nav — horizontal scroll on mobile, vertical on sm+ */}
          <nav className="flex sm:flex-col sm:w-44 sm:shrink-0 overflow-x-auto sm:overflow-x-visible no-scrollbar gap-1 sm:gap-0 sm:space-y-0.5 pb-1 sm:pb-0">
            {NAV.map(item => {
              const isActive = active === item.id
              const isDanger = item.id === 'danger'
              return (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className={`
                    relative shrink-0 sm:w-full flex items-center gap-2.5 px-3 py-[7px] rounded-md
                    text-[13px] font-medium text-left transition-all duration-100 whitespace-nowrap
                    ${isActive
                      ? isDanger
                        ? 'text-red-400 bg-red-500/8'
                        : 'text-white bg-slate-800'
                      : isDanger
                        ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/5'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }
                  `}
                >
                  {isActive && !isDanger && (
                    <span className="absolute left-0 inset-y-[6px] w-[2px] rounded-r-full bg-indigo-500" />
                  )}
                  {isActive && isDanger && (
                    <span className="absolute left-0 inset-y-[6px] w-[2px] rounded-r-full bg-red-500" />
                  )}
                  <item.icon className={`w-[15px] h-[15px] shrink-0 ${
                    isActive ? isDanger ? 'text-red-400' : 'text-indigo-400' : ''
                  }`} />
                  {item.label}
                </button>
              )
            })}


            {/* Legal links */}
            <div className="hidden sm:block mt-auto pt-4 border-t border-slate-800/60 space-y-0.5">
              {[
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' },
              ].map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-[6px] rounded-md text-[12px]
                    text-slate-600 hover:text-slate-400 hover:bg-slate-800/40 transition-all"
                >
                  {label}
                </a>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {active === 'general'      && <GeneralSection org={org} user={user} />}
            {active === 'billing'      && <BillingSection org={org} plan={plan} plans={plans} counts={counts} />}
            {active === 'integrations' && <IntegrationsSection linkedinName={linkedinName} hasRunwayKey={hasRunwayKey} socialConnections={socialConnections} />}
            {active === 'danger'       && <DangerSection orgName={org.name} />}

            {/* Legal links — mobile only (desktop version lives in the sidebar nav) */}
            <div className="sm:hidden flex gap-4 mt-8 pt-4 border-t border-slate-800/60">
              {[
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' },
              ].map(({ label, href }) => (
                <a key={href} href={href} target="_blank" rel="noreferrer"
                  className="text-[12px] text-slate-600 hover:text-slate-400 underline underline-offset-2 transition-colors">
                  {label}
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
