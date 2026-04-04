'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Mail, Plus, Trash2, Loader2, Check, AlertCircle,
  Send, Users, ChevronDown, ChevronUp, X, Search,
  Play, Pause, Settings, Clock, UserPlus, SlidersHorizontal,
  AtSign, CornerDownRight, Tag, Sparkles, FlaskConical, UserX
} from 'lucide-react'
import EmailInboxPreview from '../EmailInboxPreview'

const STATUS_CFG = {
  draft:  { label: 'Draft',  color: 'bg-slate-700 text-slate-300',        dot: 'bg-slate-400' },
  active: { label: 'Active', color: 'bg-green-900/60 text-green-300',     dot: 'bg-green-400' },
  paused: { label: 'Paused', color: 'bg-yellow-900/60 text-yellow-300',   dot: 'bg-yellow-400' },
}

const MERGE_TAGS = ['{{first_name}}', '{{last_name}}', '{{full_name}}', '{{company}}', '{{email}}', '{{sender_name}}']

// ── Step Editor ───────────────────────────────────────────────────────────────

function StepEditor({ step, index, total, onChange, onRemove, campaignDesc }) {
  const [open,      setOpen]      = useState(index === 0)
  const [aiOpen,    setAiOpen]    = useState(false)
  const [aiPrompt,  setAiPrompt]  = useState(campaignDesc ?? '')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError,   setAiError]   = useState('')

  async function generateStep() {
    if (!aiPrompt.trim()) return
    setAiLoading(true); setAiError('')
    const res = await fetch('/api/outreach/ai-write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'step', prompt: aiPrompt, stepNumber: index + 1, totalSteps: total }),
    })
    const data = await res.json()
    setAiLoading(false)
    if (!res.ok) { setAiError(data.error ?? 'Generation failed'); return }
    onChange({ ...step, subject: data.subject ?? step.subject, body: data.body ?? step.body })
    setAiOpen(false)
  }

  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => e.key === 'Enter' || e.key === ' ' ? setOpen(o => !o) : null}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/80 hover:bg-slate-800 transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-orange-600/30 border border-orange-500/30 flex items-center justify-center text-xs font-bold text-orange-300 flex-shrink-0">
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">
              {step.subject?.trim() || <span className="text-slate-500 italic">No subject</span>}
            </p>
            <p className="text-xs text-slate-500">
              {index === 0 ? 'Send immediately' : `${step.delay_days ?? 3} day${step.delay_days !== 1 ? 's' : ''} after previous`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {total > 1 && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onRemove() }}
              className="p-1 rounded hover:bg-red-900/40 text-slate-600 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </div>

      {/* Body */}
      {open && (
        <div className="p-4 space-y-3 bg-slate-900/40">
          {index > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <label className="text-xs text-slate-400 flex-shrink-0">Send after</label>
              <input
                type="number" min={1} max={365}
                value={step.delay_days ?? 3}
                onChange={e => onChange({ ...step, delay_days: parseInt(e.target.value) || 1 })}
                className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <span className="text-xs text-slate-400">days</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Subject Line</label>
            <input
              value={step.subject ?? ''}
              onChange={e => onChange({ ...step, subject: e.target.value })}
              placeholder="e.g. Quick question, {{first_name}}"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Body</label>
            <textarea
              rows={7}
              value={step.body ?? ''}
              onChange={e => onChange({ ...step, body: e.target.value })}
              placeholder={`Hi {{first_name}},\n\nI noticed you're at {{company}} and wanted to reach out…\n\nBest,\n{{sender_name}}`}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {MERGE_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  const el = document.activeElement
                  onChange({ ...step, body: (step.body ?? '') + tag })
                }}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-slate-200 font-mono transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* AI writer */}
          {!aiOpen ? (
            <button type="button" onClick={() => setAiOpen(true)}
              className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors mt-1">
              <Sparkles className="w-3.5 h-3.5" /> Write with AI
            </button>
          ) : (
            <div className="mt-1 p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> AI — Step {index + 1} of {total}
                </span>
                <button type="button" onClick={() => setAiOpen(false)} className="text-slate-500 hover:text-slate-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                rows={2}
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="What's this campaign about? e.g. Cold outreach to SaaS founders about our analytics tool"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
              {aiError && <p className="text-xs text-red-400">{aiError}</p>}
              <button type="button" onClick={generateStep} disabled={aiLoading || !aiPrompt.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs font-medium transition-colors disabled:opacity-60">
                {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {aiLoading ? 'Writing…' : 'Generate'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── AI Campaign Generator Modal ───────────────────────────────────────────────

function AiCampaignModal({ onClose, onGenerated }) {
  const [prompt,    setPrompt]    = useState('')
  const [audience,  setAudience]  = useState('')
  const [stepCount, setStepCount] = useState('3')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  async function handleGenerate() {
    if (!prompt.trim()) return
    setLoading(true); setError('')
    const res = await fetch('/api/outreach/ai-write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'campaign', prompt, audience, stepCount }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Generation failed'); return }
    onGenerated(data.steps ?? [])
    onClose()
  }

  const inp = 'w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" /> Generate Campaign with AI
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-400">Describe your campaign and AI will write all the steps for you.</p>

          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg px-3 py-2.5 flex items-center gap-2 text-xs text-red-400">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Campaign goal <span className="text-red-400">*</span></label>
            <textarea
              rows={3}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. Cold outreach to e-commerce store owners about our Shopify analytics app. Goal is to book a demo call."
              className={inp + ' resize-none'}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Target audience <span className="text-slate-600">(optional)</span></label>
            <input
              value={audience}
              onChange={e => setAudience(e.target.value)}
              placeholder="e.g. E-commerce founders with 10k–100k monthly orders"
              className={inp}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Number of steps</label>
            <select value={stepCount} onChange={e => setStepCount(e.target.value)}
              className={inp}>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} step{n > 1 ? 's' : ''}</option>)}
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors">
              Cancel
            </button>
            <button type="button" onClick={handleGenerate} disabled={loading || !prompt.trim()}
              className="flex-1 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? 'Writing…' : 'Generate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Campaign Settings Modal ───────────────────────────────────────────────────

function CampaignSettingsModal({ campaign, onClose, onSaved }) {
  const [name,      setName]      = useState(campaign.name       ?? '')
  const [fromName,  setFromName]  = useState(campaign.from_name  ?? '')
  const [fromEmail, setFromEmail] = useState(campaign.from_email ?? '')
  const [replyTo,   setReplyTo]   = useState(campaign.reply_to   ?? '')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  async function handleSave(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Campaign name is required'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/outreach/campaigns/${campaign.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: name.trim(), from_name: fromName, from_email: fromEmail, reply_to: replyTo }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Save failed'); return }
      onSaved()   // signal success — parent re-fetches from DB
    } catch { setError('Network error') }
    finally { setSaving(false) }
  }

  const inp = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="flex items-stretch gap-4 w-full max-w-3xl">

        {/* ── Form panel ── */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl flex-1 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-orange-400" />
            Campaign Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} autoComplete="off" className="p-5 space-y-5">
          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg px-3 py-2.5 flex items-center gap-2 text-xs text-red-400">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
            </div>
          )}

          {/* Campaign name */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
              <Tag className="w-3 h-3" /> Campaign Name <span className="text-orange-400">*</span>
            </label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Cold Outreach — Q1 SaaS Founders"
              className={inp}
            />
          </div>

          {/* Sender */}
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-2">
              <AtSign className="w-3 h-3" /> Sender Details
              <span className="text-slate-600 font-normal ml-1">— overrides your Settings defaults</span>
            </p>
            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">From Name</label>
                <input
                  value={fromName}
                  onChange={e => setFromName(e.target.value)}
                  placeholder="e.g. Sarah at Acme"
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">From Email</label>
                <input
                  type="email"
                  value={fromEmail}
                  onChange={e => setFromEmail(e.target.value)}
                  placeholder="e.g. sarah@yourdomain.com"
                  className={inp}
                />
                {fromEmail && !fromEmail.includes('@') === false && (
                  <p className="text-[11px] text-yellow-500 mt-1">
                    ⚠ Must be from a verified domain in your Resend account
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* Reply-to */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
              <CornerDownRight className="w-3 h-3" /> Reply-To Email
              <span className="text-slate-600 font-normal ml-1">— optional</span>
            </label>
            <input
              type="email"
              value={replyTo}
              onChange={e => setReplyTo(e.target.value)}
              placeholder="e.g. replies@yourdomain.com"
              className={inp}
            />
            <p className="text-[11px] text-slate-600 mt-1.5">
              If set, replies from contacts go here instead of the From address.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                : <><Check className="w-4 h-4" /> Save Changes</>
              }
            </button>
          </div>
        </form>
        </div>{/* end form panel */}

        {/* ── Live preview panel ── */}
        <div className="w-80 flex-shrink-0 hidden md:flex flex-col">
          <EmailInboxPreview fromName={fromName} fromEmail={fromEmail} replyTo={replyTo} />
        </div>

      </div>
    </div>
  )
}

// ── Enroll Contacts Modal ─────────────────────────────────────────────────────

function EnrollModal({ campaignId, alreadyEnrolled, onClose, onEnrolled }) {
  const [contacts,  setContacts]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [selected,  setSelected]  = useState(new Set())
  const [enrolling, setEnrolling] = useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    fetch('/api/contacts')
      .then(r => r.json())
      .then(d => setContacts(Array.isArray(d) ? d : (d.contacts ?? [])))
      .finally(() => setLoading(false))
  }, [])

  const enrolledSet = new Set(alreadyEnrolled.map(e => e.contact_id))

  const filtered = contacts.filter(c => {
    if (enrolledSet.has(c.id)) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      c.first_name?.toLowerCase().includes(q) ||
      c.last_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q)
    )
  })

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleEnroll() {
    if (!selected.size) return
    setEnrolling(true); setError('')
    try {
      const res = await fetch(`/api/outreach/campaigns/${campaignId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_ids: [...selected] }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to enroll'); return }
      onEnrolled(data)
    } catch { setError('Network error') }
    finally { setEnrolling(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 flex-shrink-0">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-orange-400" /> Enroll Contacts
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-800 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search contacts…"
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-orange-400 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-8">
              {search ? 'No matching contacts' : 'All contacts already enrolled'}
            </p>
          ) : (
            filtered.map(c => {
              const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || c.email
              const checked = selected.has(c.id)
              return (
                <div
                  key={c.id}
                  onClick={() => toggle(c.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${checked ? 'bg-orange-600/10 border border-orange-500/30' : 'hover:bg-slate-800'}`}
                >
                  <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${checked ? 'bg-orange-600 border-orange-500' : 'border-slate-600'}`}>
                    {checked && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">{name}</p>
                    <p className="text-xs text-slate-500 truncate">{c.email} {c.company ? `· ${c.company}` : ''}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {error && (
          <div className="px-4 py-2 text-xs text-red-400 flex items-center gap-1.5 flex-shrink-0">
            <AlertCircle className="w-3.5 h-3.5" /> {error}
          </div>
        )}

        <div className="p-4 border-t border-slate-800 flex gap-2 flex-shrink-0">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors">
            Cancel
          </button>
          <button
            onClick={handleEnroll}
            disabled={!selected.size || enrolling}
            className="flex-1 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {enrolling
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <><UserPlus className="w-4 h-4" /> Enroll {selected.size > 0 ? selected.size : ''}</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CampaignDetailPage({ params }) {
  const { id } = use(params)
  const router = useRouter()

  const [campaign,    setCampaign]    = useState(null)
  const [steps,       setSteps]       = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [stats,       setStats]       = useState({})
  const [loading,     setLoading]     = useState(true)

  const [stepsDirty,  setStepsDirty]  = useState(false)
  const [savingSteps, setSavingSteps] = useState(false)
  const [stepsMsg,    setStepsMsg]    = useState('')

  const [sending,     setSending]     = useState(false)
  const [sendResult,  setSendResult]  = useState(null)
  const [sendError,   setSendError]   = useState('')

  const [showEnroll,     setShowEnroll]     = useState(false)
  const [showSettings,   setShowSettings]   = useState(false)
  const [showAiCampaign, setShowAiCampaign] = useState(false)
  const [togglingStatus, setTogglingStatus] = useState(false)

  async function load() {
    const res = await fetch(`/api/outreach/campaigns/${id}`, { cache: 'no-store' })
    if (!res.ok) return
    const data = await res.json()
    setCampaign(data)
    setSteps(data.steps ?? [])
    setEnrollments(data.enrollments ?? [])
    setStats(data.stats ?? {})
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  // ── Steps ──────────────────────────────────────────────────────────────────

  function updateStep(index, updated) {
    setSteps(prev => prev.map((s, i) => i === index ? updated : s))
    setStepsDirty(true)
  }

  function addStep() {
    setSteps(prev => [...prev, { subject: '', body: '', delay_days: 3 }])
    setStepsDirty(true)
  }

  function removeStep(index) {
    setSteps(prev => prev.filter((_, i) => i !== index))
    setStepsDirty(true)
  }

  async function saveSteps() {
    setSavingSteps(true); setStepsMsg('')
    const res = await fetch(`/api/outreach/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ steps }),
    })
    setSavingSteps(false)
    if (res.ok) {
      const data = await res.json()
      if (data.steps) setSteps(data.steps)  // sync to real DB state
      setStepsDirty(false)
      setStepsMsg('Saved!')
      setTimeout(() => setStepsMsg(''), 2000)
    } else {
      const data = await res.json().catch(() => ({}))
      setStepsMsg(data.error ?? 'Save failed')
    }
  }

  // ── Status toggle ──────────────────────────────────────────────────────────

  async function toggleStatus() {
    const next = campaign.status === 'active' ? 'paused' : 'active'
    setTogglingStatus(true)
    const res = await fetch(`/api/outreach/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    if (res.ok) setCampaign(c => ({ ...c, status: next }))
    setTogglingStatus(false)
  }

  // ── Send ───────────────────────────────────────────────────────────────────

  async function handleSend() {
    setSending(true); setSendResult(null); setSendError('')
    try {
      const res = await fetch(`/api/outreach/campaigns/${id}/send`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setSendError(data.error ?? 'Send failed'); return }
      setSendResult(data)
      await load()
    } catch { setSendError('Network error') }
    finally { setSending(false) }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this campaign? All enrollments and send history will be removed.')) return
    setDeleting(true)
    await fetch(`/api/outreach/campaigns/${id}`, { method: 'DELETE' })
    router.push('/outreach')
  }

  // ── Test Send ───────────────────────────────────────────────────────────────

  const [showTestModal,  setShowTestModal]  = useState(false)
  const [testEmail,      setTestEmail]      = useState('')
  const [testSending,    setTestSending]    = useState(false)
  const [testResult,     setTestResult]     = useState(null)  // null | 'ok' | string (error)

  async function handleTestSend() {
    if (!testEmail.trim()) return
    setTestSending(true)
    setTestResult(null)
    try {
      const res  = await fetch(`/api/outreach/campaigns/${id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      })
      const data = await res.json()
      setTestResult(res.ok ? 'ok' : (data.error ?? 'Send failed'))
    } catch { setTestResult('Network error') }
    finally { setTestSending(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
      </div>
    )
  }
  if (!campaign) {
    return <div className="p-6 text-slate-400">Campaign not found. <Link href="/outreach" className="text-orange-400">Back</Link></div>
  }

  const statusCfg = STATUS_CFG[campaign.status] ?? STATUS_CFG.draft

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <Link href="/outreach" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> All Campaigns
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">{campaign.name}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusCfg.color}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusCfg.dot} mr-1.5 align-middle`} />
              {statusCfg.label}
            </span>
          </div>
          {campaign.from_email && (
            <p className="text-xs text-slate-500">
              From: {campaign.from_name ? `${campaign.from_name} <${campaign.from_email}>` : campaign.from_email}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {campaign.status !== 'draft' && (
            <button onClick={toggleStatus} disabled={togglingStatus}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors">
              {togglingStatus
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : campaign.status === 'active' ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Resume</>
              }
            </button>
          )}
          <button
            onClick={() => { setShowTestModal(true); setTestResult(null) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            title="Send a test email to yourself"
          >
            <FlaskConical className="w-3.5 h-3.5" /> Test Send
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" /> Settings
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 text-xs font-medium transition-colors disabled:opacity-60">
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Delete
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Steps',     value: steps.length   },
          { label: 'Enrolled',  value: stats.enrolled ?? 0  },
          { label: 'Active',    value: stats.active   ?? 0  },
          { label: 'Emails Sent', value: stats.total_sent ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT — Step editor */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-400" /> Sequence Steps
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowAiCampaign(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-800/60 hover:bg-purple-700/80 text-purple-300 text-xs font-medium transition-colors border border-purple-700/40">
                <Sparkles className="w-3.5 h-3.5" /> Generate with AI
              </button>
              {stepsDirty && (
                <button onClick={saveSteps} disabled={savingSteps}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium transition-colors disabled:opacity-60">
                  {savingSteps ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Steps
                </button>
              )}
              {stepsMsg && <span className={`text-xs ${stepsMsg === 'Saved!' ? 'text-green-400' : 'text-red-400'}`}>{stepsMsg}</span>}
            </div>
          </div>

          {steps.map((step, i) => (
            <StepEditor
              key={i}
              step={step}
              index={i}
              total={steps.length}
              onChange={updated => updateStep(i, updated)}
              onRemove={() => removeStep(i)}
            />
          ))}

          <button onClick={addStep}
            className="w-full py-3 border border-dashed border-slate-700 hover:border-orange-500/50 rounded-xl text-sm text-slate-500 hover:text-orange-400 transition-colors flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add Step
          </button>
        </div>

        {/* RIGHT — Contacts + Send */}
        <div className="lg:col-span-2 space-y-4">
          {/* Send panel */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Send className="w-4 h-4 text-orange-400" /> Send Emails
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Sends the current step's email to every active enrolled contact, then advances them to the next step.
            </p>

            {sendResult && (
              <div className={`border rounded-lg p-3 mb-3 text-xs space-y-1.5 ${
                sendResult.failed > 0
                  ? 'bg-red-900/20 border-red-800 text-red-400'
                  : 'bg-green-900/20 border-green-800 text-green-400'
              }`}>
                <p>
                  {sendResult.failed > 0 ? '⚠' : '✓'} Sent {sendResult.sent} · Failed {sendResult.failed} · Skipped {sendResult.skipped}
                </p>
                {sendResult.errors?.length > 0 && (
                  <p className="text-red-300 font-medium">
                    Resend error: {sendResult.errors[0]}
                  </p>
                )}
              </div>
            )}
            {sendError && (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 mb-3 flex items-start gap-2 text-xs text-red-400">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {sendError}
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={sending || !stats.active}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {sending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                : <><Send className="w-4 h-4" /> Send Now ({stats.active ?? 0} contacts)</>
              }
            </button>
            {!campaign.from_email && (
              <p className="text-xs text-yellow-500 mt-2 text-center">⚠ Set a From email to enable sending</p>
            )}
          </div>

          {/* Enrolled contacts */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" /> Enrolled Contacts
                <span className="text-xs font-normal text-slate-500">({enrollments.length})</span>
              </h3>
              <button
                onClick={() => setShowEnroll(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {enrollments.length === 0 ? (
              <div className="text-center py-6">
                <Users className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No contacts enrolled yet</p>
                <button onClick={() => setShowEnroll(true)}
                  className="mt-3 text-xs text-orange-400 hover:text-orange-300 transition-colors">
                  + Enroll from CRM
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {enrollments.map(e => {
                  const c = e.contact
                  const name = `${c?.first_name ?? ''} ${c?.last_name ?? ''}`.trim() || c?.email
                  const stepLabel = e.status === 'completed'
                    ? 'Completed' : e.status === 'active'
                    ? `Step ${e.current_step}` : e.status
                  return (
                    <div key={e.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white truncate">{name}</p>
                        <p className="text-xs text-slate-500 truncate">{c?.email}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ml-2 font-medium ${
                        e.status === 'completed' ? 'bg-green-900/40 text-green-400'
                        : e.status === 'active'  ? 'bg-blue-900/40 text-blue-300'
                        : 'bg-slate-700 text-slate-400'
                      }`}>
                        {stepLabel}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Unsubscribes */}
          {enrollments.some(e => e.status === 'unsubscribed') && (
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-3">
                <UserX className="w-4 h-4 text-slate-400" /> Unsubscribed
                <span className="text-xs font-normal text-slate-500">
                  ({enrollments.filter(e => e.status === 'unsubscribed').length})
                </span>
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {enrollments.filter(e => e.status === 'unsubscribed').map(e => {
                  const c = e.contact
                  const name = `${c?.first_name ?? ''} ${c?.last_name ?? ''}`.trim() || c?.email
                  return (
                    <div key={e.id} className="flex items-center justify-between py-1.5 border-b border-slate-700/50 last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-300 truncate">{name}</p>
                        <p className="text-xs text-slate-500 truncate">{c?.email}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-900/30 text-red-400 ml-2">
                        Unsubscribed
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {showEnroll && (
        <EnrollModal
          campaignId={id}
          alreadyEnrolled={enrollments}
          onClose={() => setShowEnroll(false)}
          onEnrolled={() => { setShowEnroll(false); load() }}
        />
      )}

      {showSettings && (
        <CampaignSettingsModal
          campaign={campaign}
          onClose={() => setShowSettings(false)}
          onSaved={() => {
            setShowSettings(false)
            load()           // always re-fetch the real DB state after save
          }}
        />
      )}

      {showAiCampaign && (
        <AiCampaignModal
          onClose={() => setShowAiCampaign(false)}
          onGenerated={generatedSteps => {
            setSteps(generatedSteps)
            setStepsDirty(true)
            setShowAiCampaign(false)
          }}
        />
      )}

      {/* ── Test Send Modal ─────────────────────────────────────────────── */}
      {showTestModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setShowTestModal(false)}
        >
          <div className="w-full max-w-sm bg-[#0d1117] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-orange-400" />
                <p className="text-sm font-semibold text-slate-100">Send Test Email</p>
              </div>
              <button
                onClick={() => setShowTestModal(false)}
                className="p-1 rounded text-slate-500 hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Sends step 1 of this campaign to the address below. Merge tags will use placeholder values.
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Send to</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={e => { setTestEmail(e.target.value); setTestResult(null) }}
                  placeholder="you@example.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500/60"
                  onKeyDown={e => e.key === 'Enter' && !testSending && handleTestSend()}
                  autoFocus
                />
              </div>

              {testResult === 'ok' && (
                <div className="flex items-center gap-2 text-xs text-green-400 bg-green-900/20 border border-green-800 rounded-lg px-3 py-2">
                  <Check className="w-3.5 h-3.5 flex-shrink-0" />
                  Test email sent to <strong>{testEmail}</strong>
                </div>
              )}
              {testResult && testResult !== 'ok' && (
                <div className="flex items-start gap-2 text-xs text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  {testResult}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setShowTestModal(false)}
                  className="flex-1 py-2 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleTestSend}
                  disabled={testSending || !testEmail.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {testSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {testSending ? 'Sending…' : 'Send Test'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
