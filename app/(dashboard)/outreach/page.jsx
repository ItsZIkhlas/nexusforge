'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Mail, Plus, Loader2, AlertCircle, X,
  Users, Send, FileText, Play, Eye, EyeOff,
  KeyRound, Check, TriangleAlert, Copy
} from 'lucide-react'
import EmailInboxPreview from './EmailInboxPreview'

const STATUS_CFG = {
  draft:  { label: 'Draft',  style: { background: 'var(--bg-hover)', color: 'var(--text-3)', borderColor: 'var(--border)' } },
  active: { label: 'Active', style: { background: 'rgba(16,185,129,0.12)', color: '#6ee7b7', borderColor: 'rgba(16,185,129,0.3)' } },
  paused: { label: 'Paused', style: { background: 'rgba(234,179,8,0.12)',  color: '#fde047', borderColor: 'rgba(234,179,8,0.3)' } },
}

// ── Campaign Card ─────────────────────────────────────────────────────────────

function CampaignCard({ campaign, onClick, onDuplicate, duplicating }) {
  const s    = STATUS_CFG[campaign.status] ?? STATUS_CFG.draft
  const date = new Date(campaign.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  // Compute "Next send" for active campaigns
  let nextSendLabel = null
  if (campaign.status === 'active' && campaign.next_send_at) {
    const d = new Date(campaign.next_send_at)
    const now = new Date()
    const diffMs = d - now
    if (diffMs > 0) {
      const diffDays = Math.ceil(diffMs / 86_400_000)
      if (diffDays === 0) {
        nextSendLabel = 'Next send: Today'
      } else if (diffDays === 1) {
        nextSendLabel = 'Next send: Tomorrow'
      } else {
        nextSendLabel = `Next send: ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      }
    } else {
      nextSendLabel = 'Next send: Now'
    }
  }

  function handleDuplicateClick(e) {
    e.stopPropagation()
    onDuplicate()
  }

  return (
    <div
      onClick={onClick}
      className="hov-card hov-orange rounded-xl p-5 cursor-pointer relative"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      {/* Duplicate button */}
      <button
        onClick={handleDuplicateClick}
        disabled={duplicating}
        title="Duplicate campaign"
        className="absolute top-3 right-3 p-1.5 rounded-lg transition-colors z-10"
        style={{ color: 'var(--text-3)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
      >
        {duplicating
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <Copy className="w-3.5 h-3.5" />
        }
      </button>

      <div className="flex items-start justify-between mb-4 pr-7">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}
          >
            <Mail className="w-4 h-4" style={{ color: '#fdba74' }} />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold truncate" style={{ color: 'var(--text)' }}>
              {campaign.name}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>{date}</p>
            {nextSendLabel && (
              <p className="text-[10px] mt-0.5 font-medium" style={{ color: '#6ee7b7' }}>
                {nextSendLabel}
              </p>
            )}
          </div>
        </div>
        <span
          className="text-[11px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ml-2"
          style={s.style}
        >
          {s.label}
        </span>
      </div>

      <div
        className="grid grid-cols-3 gap-2 pt-3"
        style={{ borderTop: '1px solid var(--border-soft)' }}
      >
        {[
          { icon: FileText, value: campaign.step_count,     label: 'steps'    },
          { icon: Users,    value: campaign.enrolled_count, label: 'enrolled' },
          { icon: Send,     value: campaign.sends_count,    label: 'sent'     },
        ].map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            className="rounded-lg p-2 text-center"
            style={{ background: 'var(--bg-page)' }}
          >
            <Icon className="w-3 h-3 mx-auto mb-1" style={{ color: 'var(--text-4)' }} />
            <p className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>{value ?? 0}</p>
            <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── New Campaign Modal ────────────────────────────────────────────────────────

function NewCampaignModal({ onClose, onCreate }) {
  const [name,      setName]      = useState('')
  const [fromName,  setFromName]  = useState('')
  const [fromEmail, setFromEmail] = useState('')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Campaign name is required'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/outreach/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, from_name: fromName, from_email: fromEmail }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create'); return }
      onCreate(data)
    } catch { setError('Network error') }
    finally { setSaving(false) }
  }

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
    >
      <div className="flex items-stretch gap-4 w-full max-w-3xl">

        {/* ── Form panel ── */}
        <div
          className="rounded-2xl flex-1 shadow-2xl overflow-hidden"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <h2
              className="text-[14px] font-bold flex items-center gap-2"
              style={{ color: 'var(--text)' }}
            >
              <Mail className="w-4 h-4" style={{ color: '#fdba74' }} />
              New Campaign
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-3)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-hover)'; e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreate} className="p-5 space-y-4">
            {error && (
              <div
                className="rounded-xl px-3 py-2.5 flex items-center gap-2 text-[13px]"
                style={{ background: 'var(--danger-dim)', border: '1px solid rgba(244,63,94,0.25)', color: '#fda4af' }}
              >
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
              </div>
            )}
            <div>
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--text-3)' }}>
                Campaign Name *
              </label>
              <input
                autoFocus value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Cold Outreach — Q1 SaaS Founders"
                className="input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--text-3)' }}>
                  From Name
                </label>
                <input value={fromName} onChange={e => setFromName(e.target.value)} placeholder="Your Name" className="input" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--text-3)' }}>
                  From Email
                </label>
                <input type="email" value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="you@company.com" className="input" />
              </div>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>
              The From email must be from a verified domain in your{' '}
              <a href="https://resend.com/domains" target="_blank" rel="noreferrer" style={{ color: '#fdba74' }}>
                Resend account
              </a>.
            </p>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
              <button
                type="submit" disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[13px] font-semibold text-white transition-colors disabled:opacity-60"
                style={{ background: '#ea6500' }}
                onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#f97316' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#ea6500' }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create
              </button>
            </div>
          </form>
        </div>

        {/* ── Live preview panel ── */}
        <div className="w-80 flex-shrink-0 hidden md:flex flex-col">
          <EmailInboxPreview fromName={fromName} fromEmail={fromEmail} />
        </div>

      </div>
    </div>
  )
}

// ── Email Setup Modal ─────────────────────────────────────────────────────────

function EmailSetupModal({ initial, onClose, onSaved }) {
  const [apiKey,          setApiKey]          = useState('')
  const [fromName,        setFromName]        = useState(initial.fromName        ?? '')
  const [fromEmail,       setFromEmail]       = useState(initial.fromEmail       ?? '')
  const [physicalAddress, setPhysicalAddress] = useState(initial.physicalAddress ?? '')
  const [hasKey,          setHasKey]          = useState(initial.hasKey          ?? false)
  const [showKey,         setShowKey]         = useState(false)
  const [saving,          setSaving]          = useState(false)
  const [removing,        setRemoving]        = useState(false)
  const [saved,           setSaved]           = useState(false)
  const [error,           setError]           = useState('')

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true); setError(''); setSaved(false)
    const payload = {
      resend_from_name:  fromName,
      resend_from_email: fromEmail,
      physical_address:  physicalAddress,
      ...(apiKey.trim() ? { resend_api_key: apiKey.trim() } : {}),
    }
    const res = await fetch('/api/org', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setApiKey('')
      setHasKey(true)
      onSaved({ hasKey: true, fromName, fromEmail, physicalAddress })
      setTimeout(() => setSaved(false), 2500)
    } else {
      const d = await res.json()
      setError(d.error ?? 'Failed to save')
    }
  }

  async function handleRemove() {
    if (!confirm('Remove your Resend API key? Emails will use the platform default sender.')) return
    setRemoving(true)
    await fetch('/api/org', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resend_api_key: '', resend_from_name: '', resend_from_email: '' }),
    })
    setRemoving(false)
    setHasKey(false)
    setFromName('')
    setFromEmail('')
    onSaved({ hasKey: false, fromName: '', fromEmail: '', physicalAddress })
  }

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
    >
      <div
        className="rounded-2xl w-full max-w-md shadow-2xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2 className="text-[14px] font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <KeyRound className="w-4 h-4" style={{ color: '#fdba74' }} />
            Email Sending Setup
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-hover)'; e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} autoComplete="off" className="p-5 space-y-4">
          <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-2)' }}>
            Connect your{' '}
            <a href="https://resend.com" target="_blank" rel="noreferrer" style={{ color: '#fdba74' }}>Resend</a>
            {' '}account to send emails from your own domain. Free up to 3,000 emails/month.
          </p>

          {error && (
            <div
              className="rounded-xl px-3 py-2.5 flex items-center gap-2 text-[12px]"
              style={{ background: 'var(--danger-dim)', border: '1px solid rgba(244,63,94,0.25)', color: '#fda4af' }}
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
            </div>
          )}

          {/* API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold" style={{ color: 'var(--text-3)' }}>
                Resend API Key
                {hasKey && <span className="ml-2" style={{ color: '#6ee7b7' }}>✓ Key saved</span>}
              </label>
              {hasKey && (
                <button
                  type="button" onClick={handleRemove} disabled={removing}
                  className="text-[11px] flex items-center gap-1 transition-colors"
                  style={{ color: 'var(--danger)' }}
                >
                  {removing ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                  Remove
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={hasKey ? 're_•••••••••••• (leave blank to keep current)' : 're_xxxxxxxxxxxxxxxxxxxx'}
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-bwignore
                data-form-type="other"
                style={{ WebkitTextSecurity: showKey ? 'none' : 'disc' }}
                className="input pr-10"
              />
              <button
                type="button" onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--text-3)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-2)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-4)' }}>
              Get your key at{' '}
              <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" style={{ color: '#fdba74' }}>resend.com/api-keys</a>
              {' '}· Domain must be verified at{' '}
              <a href="https://resend.com/domains" target="_blank" rel="noreferrer" style={{ color: '#fdba74' }}>resend.com/domains</a>
            </p>
          </div>

          {/* Default From */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--text-3)' }}>
                Default From Name
              </label>
              <input value={fromName} onChange={e => setFromName(e.target.value)} placeholder="Your Business" autoComplete="off" className="input" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--text-3)' }}>
                Default From Email
              </label>
              <input type="email" value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="you@yourdomain.com" autoComplete="off" className="input" />
            </div>
          </div>
          <p className="text-[10px]" style={{ color: 'var(--text-4)' }}>
            These defaults pre-fill every new campaign. You can override them per campaign in Campaign Settings.
          </p>

          {/* Physical address — required by CAN-SPAM */}
          <div>
            <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--text-3)' }}>
              Physical Mailing Address
              <span className="ml-1.5 font-normal" style={{ color: 'var(--text-4)' }}>(required by CAN-SPAM)</span>
            </label>
            <input
              value={physicalAddress}
              onChange={e => setPhysicalAddress(e.target.value)}
              placeholder="123 Main St, New York, NY 10001, USA"
              autoComplete="off"
              className="input"
            />
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-4)' }}>
              Shown in the footer of every outreach email. Can be a P.O. Box.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-colors disabled:opacity-60"
              style={{ background: '#ea6500' }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#f97316' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#ea6500' }}
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                : saved
                  ? <><Check className="w-4 h-4" /> Saved!</>
                  : <><Check className="w-4 h-4" /> Save Settings</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function OutreachPage() {
  const router = useRouter()

  const [campaigns,      setCampaigns]      = useState([])
  const [loading,        setLoading]        = useState(true)
  const [showModal,      setShowModal]      = useState(false)
  const [showEmailSetup, setShowEmailSetup] = useState(false)
  const [emailSetup,     setEmailSetup]     = useState({ hasKey: null, fromName: '', fromEmail: '', physicalAddress: '' })
  const [duplicatingId,  setDuplicatingId]  = useState(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/outreach/campaigns').then(r => r.json()),
      fetch('/api/org').then(r => r.json()),
    ]).then(([camps, org]) => {
      if (Array.isArray(camps)) setCampaigns(camps)
      setEmailSetup({
        hasKey:          org.hasKey          ?? false,
        fromName:        org.fromName        ?? '',
        fromEmail:       org.fromEmail       ?? '',
        physicalAddress: org.physicalAddress ?? '',
      })
    }).finally(() => setLoading(false))
  }, [])

  async function duplicateCampaign(campaign) {
    if (duplicatingId) return
    setDuplicatingId(campaign.id)
    try {
      // 1. Create the new campaign
      const createRes = await fetch('/api/outreach/campaigns', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:       `${campaign.name} (copy)`,
          from_name:  campaign.from_name  ?? '',
          from_email: campaign.from_email ?? '',
          reply_to:   campaign.reply_to   ?? '',
        }),
      })
      const newCampaign = await createRes.json()
      if (!createRes.ok) { console.error('Duplicate failed:', newCampaign.error); return }

      // 2. Fetch the original campaign's steps
      const detailRes = await fetch(`/api/outreach/campaigns/${campaign.id}`)
      const detail    = await detailRes.json()
      const steps     = detail.steps ?? []

      // 3. Copy steps to the new campaign (if any beyond the blank seed)
      if (steps.length > 0 && (steps[0]?.subject || steps[0]?.body)) {
        await fetch(`/api/outreach/campaigns/${newCampaign.id}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ steps }),
        })
      }

      router.push(`/outreach/${newCampaign.id}`)
    } catch (err) {
      console.error('Duplicate error:', err)
    } finally {
      setDuplicatingId(null)
    }
  }

  const totalEnrolled = campaigns.reduce((a, c) => a + (c.enrolled_count ?? 0), 0)
  const totalSent     = campaigns.reduce((a, c) => a + (c.sends_count    ?? 0), 0)
  const totalActive   = campaigns.filter(c => c.status === 'active').length

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-8 sm:py-10">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 mb-8 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}
              >
                <Mail className="w-4 h-4" style={{ color: '#fdba74' }} />
              </div>
              <span className="section-label">Email Outreach</span>
            </div>
            <h1 className="text-[26px] font-extrabold tracking-tight mb-1" style={{ color: 'var(--text)' }}>
              Campaigns
            </h1>
            <p className="text-[13px]" style={{ color: 'var(--text-3)' }}>
              Build multi-step sequences, enroll contacts, and send via Resend.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => setShowEmailSetup(true)}
              className="btn-secondary flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              {emailSetup.hasKey ? 'Email Setup' : 'Connect Resend'}
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-colors"
              style={{ background: '#ea6500', boxShadow: '0 4px 14px rgba(249,115,22,0.25)' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f97316'}
              onMouseLeave={e => e.currentTarget.style.background = '#ea6500'}
            >
              <Plus className="w-4 h-4" /> New Campaign
            </button>
          </div>
        </div>

        {/* ── No Resend key warning ────────────────────────────────── */}
        {!loading && emailSetup.hasKey === false && (
          <div
            className="mb-6 flex items-start gap-3 rounded-xl px-4 py-3"
            style={{ background: 'var(--warning-dim)', border: '1px solid rgba(245,158,11,0.25)' }}
          >
            <TriangleAlert className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#fcd34d' }} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold" style={{ color: '#fde047' }}>Resend not connected</p>
              <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'var(--text-3)' }}>
                Emails will send from the platform default address. Connect your own Resend account to send from your domain.
              </p>
            </div>
            <button
              onClick={() => setShowEmailSetup(true)}
              className="text-[12px] font-semibold whitespace-nowrap transition-colors"
              style={{ color: '#fcd34d' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fef08a'}
              onMouseLeave={e => e.currentTarget.style.color = '#fcd34d'}
            >
              Set up →
            </button>
          </div>
        )}

        {/* ── Stats bar ───────────────────────────────────────────── */}
        {campaigns.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {[
              { icon: Play,  value: totalActive,   label: 'Active campaigns', color: 'rgba(249,115,22,0.12)', borderC: 'rgba(249,115,22,0.25)', ic: '#fdba74' },
              { icon: Users, value: totalEnrolled, label: 'Total enrolled',   color: 'var(--primary-dim)',    borderC: 'var(--primary-border)', ic: 'var(--primary-text)' },
              { icon: Send,  value: totalSent,     label: 'Emails sent',      color: 'var(--secondary-dim)',  borderC: 'var(--secondary-border)', ic: 'var(--secondary-text)' },
            ].map(({ icon: Icon, value, label, color, borderC, ic }) => (
              <div
                key={label}
                className="rounded-xl p-4 flex items-center gap-3"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: color, border: `1px solid ${borderC}` }}
                >
                  <Icon className="w-4 h-4" style={{ color: ic }} />
                </div>
                <div>
                  <p className="text-[20px] font-extrabold tracking-tight leading-none" style={{ color: 'var(--text)' }}>
                    {value.toLocaleString()}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Campaign grid ────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#fdba74' }} />
          </div>
        ) : campaigns.length === 0 ? (
          <div
            className="rounded-2xl p-16 text-center"
            style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-strong)' }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}
            >
              <Mail className="w-7 h-7" style={{ color: '#fdba74' }} />
            </div>
            <h2 className="text-[17px] font-bold mb-2" style={{ color: 'var(--text)' }}>No campaigns yet</h2>
            <p className="text-[13px] max-w-sm mx-auto mb-6 leading-relaxed" style={{ color: 'var(--text-3)' }}>
              Create your first campaign, write your sequence, enroll contacts from your CRM and send.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-colors"
              style={{ background: '#ea6500' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f97316'}
              onMouseLeave={e => e.currentTarget.style.background = '#ea6500'}
            >
              <Plus className="w-4 h-4" /> Create First Campaign
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {campaigns.map(c => (
              <CampaignCard
                key={c.id}
                campaign={c}
                onClick={() => router.push(`/outreach/${c.id}`)}
                onDuplicate={() => duplicateCampaign(c)}
                duplicating={duplicatingId === c.id}
              />
            ))}
          </div>
        )}

      </div>

      {showModal && (
        <NewCampaignModal
          onClose={() => setShowModal(false)}
          onCreate={campaign => {
            setShowModal(false)
            router.push(`/outreach/${campaign.id}`)
          }}
        />
      )}

      {showEmailSetup && (
        <EmailSetupModal
          initial={emailSetup}
          onClose={() => setShowEmailSetup(false)}
          onSaved={updated => {
            setEmailSetup(updated)
            setShowEmailSetup(false)
          }}
        />
      )}
    </div>
  )
}
