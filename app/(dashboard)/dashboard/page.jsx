import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  Users, Search, Mail, Bot, PenLine,
  BrainCircuit, ChevronRight, FileText, ArrowUpRight, Sparkles,
} from 'lucide-react'
import Link from 'next/link'

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, accent }) {
  const A = {
    indigo:  { bg: 'rgba(92,96,245,0.10)',   br: 'rgba(92,96,245,0.22)',   ic: '#a8abfc' },
    violet:  { bg: 'rgba(139,92,246,0.10)',  br: 'rgba(139,92,246,0.22)',  ic: '#c4b5fd' },
    emerald: { bg: 'rgba(16,185,129,0.10)',  br: 'rgba(16,185,129,0.22)',  ic: '#6ee7b7' },
    cyan:    { bg: 'rgba(34,211,238,0.10)',  br: 'rgba(34,211,238,0.22)',  ic: '#67e8f9' },
  }[accent] ?? { bg: 'rgba(92,96,245,0.10)', br: 'rgba(92,96,245,0.22)', ic: '#a8abfc' }

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-4"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <p className="section-label">{label}</p>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: A.bg, border: `1px solid ${A.br}` }}
        >
          <Icon className="w-4 h-4" style={{ color: A.ic }} />
        </div>
      </div>
      <p
        className="text-[32px] font-extrabold tracking-tight leading-none"
        style={{ color: 'var(--text)' }}
      >
        {value}
      </p>
    </div>
  )
}

// ── Tool Card ──────────────────────────────────────────────────────────────────
const TA = {
  indigo:  { bg: 'rgba(92,96,245,0.09)',  br: 'rgba(92,96,245,0.18)',  ic: '#a8abfc' },
  violet:  { bg: 'rgba(139,92,246,0.09)', br: 'rgba(139,92,246,0.18)', ic: '#c4b5fd' },
  emerald: { bg: 'rgba(16,185,129,0.09)', br: 'rgba(16,185,129,0.18)', ic: '#6ee7b7' },
  orange:  { bg: 'rgba(249,115,22,0.09)', br: 'rgba(249,115,22,0.18)', ic: '#fdba74' },
  pink:    { bg: 'rgba(236,72,153,0.09)', br: 'rgba(236,72,153,0.18)', ic: '#f9a8d4' },
  cyan:    { bg: 'rgba(34,211,238,0.09)', br: 'rgba(34,211,238,0.18)', ic: '#67e8f9' },
}

function ToolCard({ href, icon: Icon, label, description, accent }) {
  const c = TA[accent] ?? TA.indigo
  return (
    <Link
      href={href}
      className={`hov-card hov-${accent} group relative flex items-start gap-4 p-5 rounded-xl`}
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: c.bg, border: `1px solid ${c.br}` }}
      >
        <Icon className="w-4 h-4" style={{ color: c.ic }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold leading-snug mb-1" style={{ color: 'var(--text)' }}>
          {label}
        </p>
        <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-3)' }}>
          {description}
        </p>
      </div>
      <ArrowUpRight
        className="hov-arrow w-3.5 h-3.5 shrink-0 mt-1 -translate-y-0.5 translate-x-0.5"
        style={{ color: c.ic }}
      />
    </Link>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const service = createServiceClient()
  const { data: org } = await service
    .from('organizations')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  const [
    { count: contactCount },
    { count: botCount },
    { count: pendingPostCount },
  ] = await Promise.all([
    service.from('contacts').select('*', { count: 'exact', head: true }).eq('org_id', org.id),
    service.from('bots').select('*', { count: 'exact', head: true }).eq('org_id', org.id),
    service.from('content_posts').select('*', { count: 'exact', head: true }).eq('org_id', org.id).eq('status', 'pending'),
  ])

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const today    = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-8 sm:py-10">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="flex items-center gap-1.5 px-2.5 py-[5px] rounded-full text-[11px] font-semibold"
              style={{ background: 'var(--primary-dim)', border: '1px solid var(--primary-border)', color: 'var(--primary-text)' }}
            >
              <Sparkles className="w-3 h-3" />
              Overview
            </div>
            <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>{today}</span>
          </div>

          <h1 className="text-[28px] font-extrabold tracking-tight leading-tight mb-2" style={{ color: 'var(--text)' }}>
            {greeting},{' '}
            <span style={{ color: 'var(--primary-text)' }}>{org.name.split(' ')[0]}</span>
          </h1>
          <p className="text-[14px]" style={{ color: 'var(--text-3)' }}>
            Here&apos;s a snapshot of your workspace.
          </p>
        </div>

        {/* ── Stats ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          <StatCard label="Contacts"     value={contactCount ?? 0}           icon={Users}  accent="cyan"    />
          <StatCard label="Lead Credits" value={org.lead_credits_used ?? 0}  icon={Search} accent="violet"  />
          <StatCard label="Chatbots"     value={botCount ?? 0}               icon={Bot}    accent="indigo"  />
        </div>

        {/* ── Pending content alert ───────────────────────────────── */}
        {pendingPostCount > 0 && (
          <Link
            href="/content"
            className="hov-card hov-orange flex items-center gap-3 mb-8 px-4 py-3.5 rounded-xl"
            style={{ background: 'var(--warning-dim)', border: '1px solid rgba(245,158,11,0.25)' }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}
            >
              <FileText className="w-3.5 h-3.5" style={{ color: '#fcd34d' }} />
            </div>
            <p className="text-[13px] flex-1" style={{ color: '#fcd34d' }}>
              <span className="font-semibold">
                {pendingPostCount} content post{pendingPostCount !== 1 ? 's' : ''}
              </span>{' '}
              waiting for your review
            </p>
            <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#f59e0b' }} />
          </Link>
        )}

        {/* ── Platform tools ──────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <p className="section-label">Platform</p>
            <div className="flex-1 h-px" style={{ background: 'var(--border-soft)' }} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <ToolCard href="/leads"    icon={Search}       label="Lead Finder"     description="Find prospects by industry, location, or keyword"           accent="violet"  />
            <ToolCard href="/crm"      icon={Users}        label="CRM"             description="Manage and organise your entire contact base"               accent="cyan"    />
            <ToolCard href="/outreach" icon={Mail}         label="Email Outreach"  description="Build AI-powered email sequences and enrol contacts"        accent="orange"  />
            <ToolCard href="/content"  icon={PenLine}      label="Content Studio"  description="Generate and schedule LinkedIn and TikTok content"          accent="pink"    />
            <ToolCard href="/advisor"  icon={BrainCircuit} label="AI Advisor"      description="Get AI-driven insights and business recommendations"        accent="indigo"  />
          </div>
        </div>

      </div>
    </div>
  )
}
