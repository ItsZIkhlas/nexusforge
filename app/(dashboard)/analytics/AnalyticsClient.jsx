'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis,
  Tooltip,
  PieChart, Pie, Cell,
} from 'recharts'
import {
  Users, MessageSquare, TrendingUp, Mail,
  Globe, Bot, Search, DollarSign,
  Video, PenLine, BarChart3, Zap,
  Loader2,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Date-range presets
// ─────────────────────────────────────────────────────────────────────────────

const PRESETS = [
  { label: '7d',  days: 7  },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]

function RangePicker({ value, onChange }) {
  return (
    <div
      className="flex items-center rounded-lg border border-slate-700/60 overflow-hidden"
      style={{ background: 'transparent' }}
    >
      {PRESETS.map(({ label, days }) => {
        const active = value === days
        return (
          <button
            key={days}
            onClick={() => onChange(days)}
            className={[
              'px-3 py-1.5 text-[12px] font-semibold tracking-wide transition-all duration-150 select-none',
              'border-r border-slate-700/60 last:border-r-0',
              active
                ? 'bg-slate-800 text-indigo-400 border-indigo-500/50 shadow-inner'
                : 'bg-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/40',
            ].join(' ')}
            style={
              active
                ? { borderTopColor: 'transparent', borderBottomColor: 'transparent' }
                : {}
            }
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────────────────────

function Card({ children, className = '' }) {
  return (
    <div className={`bg-[#0d1117] border border-slate-800/60 rounded-xl overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

function CardHeader({ title, subtitle }) {
  return (
    <div className="px-5 py-4 border-b border-slate-800/60">
      <p className="text-[13px] font-semibold text-slate-200 tracking-tight">{title}</p>
      {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function StatCard({ label, value, sub, icon: Icon, color = 'text-indigo-400', bg = 'bg-indigo-500/10 border-indigo-500/20' }) {
  return (
    <div className="bg-[#0d1117] border border-slate-800/60 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">{label}</p>
        <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${bg}`}>
          <Icon className={`w-3.5 h-3.5 ${color}`} />
        </div>
      </div>
      <p className="text-[28px] font-bold text-white tracking-tight leading-none">{value}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-1.5">{sub}</p>}
    </div>
  )
}

// Custom tooltip for recharts
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 border border-slate-700/60 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[11px] text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-[13px] font-semibold" style={{ color: p.color }}>
          {p.value} {p.name}
        </p>
      ))}
    </div>
  )
}

// Tick that only renders every Nth label to avoid crowding
function SparseTick({ x, y, payload, total, every = 6 }) {
  const idx = payload?.index ?? 0
  if (idx % every !== 0 && idx !== total - 1) return null
  return (
    <text x={x} y={y + 12} textAnchor="middle" style={{ fontSize: 10, fill: '#475569' }}>
      {payload.value}
    </text>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Small pill stat used inside cards
// ─────────────────────────────────────────────────────────────────────────────

function MiniStat({ label, value, color = 'text-indigo-400' }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-800/40 last:border-0">
      <span className="text-[12px] text-slate-500">{label}</span>
      <span className={`text-[13px] font-bold tabular-nums ${color}`}>{value}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Donut chart (content posts / video status)
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  // content posts
  pending:    '#f59e0b',
  approved:   '#6366f1',
  posted:     '#10b981',
  rejected:   '#ef4444',
  // video projects
  draft:      '#475569',
  generating: '#f59e0b',
  ready:      '#10b981',
  failed:     '#ef4444',
}

function DonutChart({ data, total }) {
  if (!data.length || total === 0) {
    return (
      <div className="flex items-center justify-center h-[140px]">
        <p className="text-[12px] text-slate-600">No data yet</p>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-5 py-2">
      <PieChart width={120} height={120}>
        <Pie
          data={data}
          cx={55}
          cy={55}
          innerRadius={36}
          outerRadius={55}
          paddingAngle={2}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={STATUS_COLORS[entry.name] ?? '#4f46e5'} />
          ))}
        </Pie>
      </PieChart>
      <div className="flex-1 space-y-1.5">
        {data.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[entry.name] ?? '#4f46e5' }} />
              <span className="text-[11px] text-slate-400 capitalize">{entry.name}</span>
            </div>
            <span className="text-[12px] font-bold text-slate-300 tabular-nums">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Area chart wrapper
// ─────────────────────────────────────────────────────────────────────────────

function TrendChart({ data, dataKey = 'count', color = '#6366f1', name, days }) {
  const hasData = data.some(d => d[dataKey] > 0)

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-[160px]">
        <p className="text-[12px] text-slate-600">No activity in the last {days} days</p>
      </div>
    )
  }

  const total = data.length
  // Space ticks proportionally: ~6 for 30d, fewer for 7d, more for 90d
  const every = days <= 7 ? 2 : days <= 30 ? 6 : 15

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0}   />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={<SparseTick total={total} every={every} />}
          interval={0}
        />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569' }} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey={dataKey}
          name={name}
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${color.replace('#', '')})`}
          dot={false}
          activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Bar chart wrapper (deal stages)
// ─────────────────────────────────────────────────────────────────────────────

const STAGE_COLORS = {
  Lead:        '#6366f1',
  Contacted:   '#8b5cf6',
  Interested:  '#06b6d4',
  Negotiating: '#f59e0b',
  Won:         '#10b981',
  Lost:        '#ef4444',
}

function PipelineChart({ data }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[160px]">
        <p className="text-[12px] text-slate-600">No deals yet</p>
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569' }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569' }} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="count" name="deals" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={STAGE_COLORS[entry.stage] ?? '#6366f1'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Root client component
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_STATS = {
  totalContacts: 0, totalConversations: 0, activeDeals: 0, wonRevenue: 0,
  totalDeals: 0, emailStats: { sent: 0, opened: 0, clicked: 0, replied: 0 },
  openRate: 0, clickRate: 0, totalSequences: 0, totalEnrollments: 0,
  totalWebsites: 0, totalBots: 0, creditsUsedThisMonth: 0,
  planCredits: 0, leadCreditsUsed: 0, postsByStatus: {}, videosByStatus: {},
}

export default function AnalyticsClient() {
  const [days,    setDays]    = useState(30)
  const [data,    setData]    = useState(null)   // null = loading, object = loaded
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetchData = useCallback(async (d) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/analytics?days=${d}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(days) }, [days, fetchData])

  const handleRangeChange = (d) => {
    setDays(d)
  }

  // Derived display values (safe defaults while loading/erroring)
  const stats                  = data?.stats                  ?? EMPTY_STATS
  const contactsTimeSeries     = data?.contactsTimeSeries     ?? []
  const conversationsTimeSeries= data?.conversationsTimeSeries ?? []
  const dealsByStage           = data?.dealsByStage           ?? []

  const {
    totalContacts, totalConversations, activeDeals, wonRevenue, totalDeals,
    emailStats, openRate, clickRate, totalSequences, totalEnrollments,
    totalWebsites, totalBots, creditsUsedThisMonth, planCredits, leadCreditsUsed,
    postsByStatus, videosByStatus,
  } = stats

  const contentDonut = Object.entries(postsByStatus).map(([name, value]) => ({ name, value }))
  const videoDonut   = Object.entries(videosByStatus).map(([name, value]) => ({ name, value }))
  const totalPosts   = contentDonut.reduce((s, d) => s + d.value, 0)
  const totalVideos  = videoDonut.reduce((s, d) => s + d.value, 0)
  const creditsPct   = planCredits === -1 ? 0 : Math.min(100, Math.round((leadCreditsUsed / planCredits) * 100))

  const rangeLabel = `last ${days} days`

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Page header */}
        <div className="mb-2 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <BarChart3 className="w-4 h-4 text-slate-500" />
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">Analytics</span>
            </div>
            <h1 className="text-xl font-semibold text-slate-100 tracking-tight">Overview</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Unified metrics across all modules —{' '}
              {loading && !data
                ? 'loading…'
                : `last ${days} days`}
            </p>
          </div>

          {/* Segmented date-range picker */}
          <div className="flex items-center gap-3">
            {loading && (
              <Loader2 className="w-3.5 h-3.5 text-slate-600 animate-spin" />
            )}
            <RangePicker value={days} onChange={handleRangeChange} />
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-[12px] px-4 py-2.5 rounded-lg">
            Failed to load analytics: {error}
          </div>
        )}

        {/* ── Stat cards ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Contacts"
            value={loading && !data ? '—' : totalContacts.toLocaleString()}
            sub={`${activeDeals} active deals`}
            icon={Users}
            color="text-indigo-400" bg="bg-indigo-500/10 border-indigo-500/20"
          />
          <StatCard
            label="Revenue Won"
            value={loading && !data ? '—' : wonRevenue > 0 ? `$${wonRevenue.toLocaleString()}` : '—'}
            sub={`${totalDeals} total deals`}
            icon={DollarSign}
            color="text-emerald-400" bg="bg-emerald-500/10 border-emerald-500/20"
          />
          <StatCard
            label="Emails Sent"
            value={loading && !data ? '—' : emailStats.sent.toLocaleString()}
            sub={`${openRate}% open rate`}
            icon={Mail}
            color="text-violet-400" bg="bg-violet-500/10 border-violet-500/20"
          />
          <StatCard
            label="Conversations"
            value={loading && !data ? '—' : totalConversations.toLocaleString()}
            sub={`across ${totalBots} chatbot${totalBots !== 1 ? 's' : ''}`}
            icon={MessageSquare}
            color="text-sky-400" bg="bg-sky-500/10 border-sky-500/20"
          />
        </div>

        {/* ── Growth charts ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Contacts over time */}
          <Card className="lg:col-span-3">
            <CardHeader title="Contact Growth" subtitle={`New contacts added — ${rangeLabel}`} />
            <div className="p-5">
              <TrendChart
                data={contactsTimeSeries}
                color="#6366f1"
                name="contacts"
                days={days}
              />
            </div>
          </Card>

          {/* Deal pipeline */}
          <Card className="lg:col-span-2">
            <CardHeader title="Deal Pipeline" subtitle="Deals by current stage" />
            <div className="p-5">
              <PipelineChart data={dealsByStage} />
            </div>
          </Card>

        </div>

        {/* ── Second row ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Chatbot conversations */}
          <Card className="lg:col-span-3">
            <CardHeader title="Chatbot Activity" subtitle={`Conversations started — ${rangeLabel}`} />
            <div className="p-5">
              <TrendChart
                data={conversationsTimeSeries}
                color="#8b5cf6"
                name="conversations"
                days={days}
              />
            </div>
          </Card>

          {/* Email outreach stats */}
          <Card className="lg:col-span-2">
            <CardHeader title="Email Outreach" subtitle={`${totalSequences} sequences · ${totalEnrollments} enrolled`} />
            <div className="px-5 py-4">
              <MiniStat label="Emails sent"    value={emailStats.sent.toLocaleString()}    color="text-slate-200"   />
              <MiniStat label="Opened"         value={emailStats.opened.toLocaleString()}  color="text-indigo-400"  />
              <MiniStat label="Open rate"      value={`${openRate}%`}                      color="text-indigo-400"  />
              <MiniStat label="Clicked"        value={emailStats.clicked.toLocaleString()} color="text-violet-400"  />
              <MiniStat label="Click rate"     value={`${clickRate}%`}                     color="text-violet-400"  />
              <MiniStat label="Replied"        value={emailStats.replied.toLocaleString()} color="text-emerald-400" />
            </div>
          </Card>

        </div>

        {/* ── Bottom row ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Content posts */}
          <Card>
            <CardHeader title="Content Posts" subtitle={`${totalPosts} total posts`} />
            <div className="px-5 py-4">
              <DonutChart data={contentDonut} total={totalPosts} />
            </div>
          </Card>

          {/* AI Videos */}
          <Card>
            <CardHeader title="AI Videos" subtitle={`${totalVideos} total projects`} />
            <div className="px-5 py-4">
              <DonutChart data={videoDonut} total={totalVideos} />
            </div>
          </Card>

          {/* Lead credits + platform overview */}
          <Card>
            <CardHeader title="Platform Usage" subtitle="Resources and limits" />
            <div className="px-5 py-4">
              <MiniStat label="Websites"           value={totalWebsites}                                                  color="text-slate-200" />
              <MiniStat label="Chatbots"           value={totalBots}                                                       color="text-slate-200" />
              <MiniStat label="Lead credits used"  value={leadCreditsUsed.toLocaleString()}                                color="text-amber-400" />
              <MiniStat label="Credits limit"      value={planCredits === -1 ? '∞' : planCredits.toLocaleString()}         color="text-slate-500" />
              <MiniStat label="Credits this period" value={creditsUsedThisMonth.toLocaleString()}                          color="text-indigo-400" />

              {/* Credit usage bar */}
              {planCredits !== -1 && (
                <div className="mt-3 pt-3 border-t border-slate-800/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-slate-600">Credit usage</span>
                    <span className="text-[10px] text-slate-500 tabular-nums">{creditsPct}%</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${creditsPct > 80 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                      style={{ width: `${creditsPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

        </div>

      </div>
    </div>
  )
}
