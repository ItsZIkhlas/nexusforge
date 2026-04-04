'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Plus, Trash2, Loader2, Play, Pause, X, Check,
  Instagram, Facebook, Clock, Zap, RefreshCw,
  CalendarClock, ChevronDown, AlertCircle, Film,
  Sparkles, Video, BarChart3, Upload, Send,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_CFG = {
  instagram: {
    label: 'Instagram',
    icon:  Instagram,
    color: '#f9a8d4',
    bg:    'rgba(236,72,153,0.12)',
    border:'rgba(236,72,153,0.3)',
    comingSoon: true,
  },
  facebook: {
    label: 'Facebook',
    icon:  Facebook,
    color: '#93c5fd',
    bg:    'rgba(59,130,246,0.12)',
    border:'rgba(59,130,246,0.3)',
    comingSoon: true,
  },
  tiktok: {
    label: 'TikTok',
    icon:  ({ className, style }) => (
      <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.54V6.79a4.85 4.85 0 01-1.02-.1z"/>
      </svg>
    ),
    color: '#ffffff',
    bg:    'rgba(0,0,0,0.3)',
    border:'rgba(255,255,255,0.15)',
  },
}

const FREQUENCY_OPTS = [
  { value: 'daily',    label: 'Daily',          sub: '1 video/day' },
  { value: '3x_week',  label: '3× per week',    sub: 'Mon / Wed / Fri' },
  { value: 'weekly',   label: 'Weekly',          sub: '1 video/week' },
]

const LENGTH_OPTS = [
  { value: 30,  label: '30s' },
  { value: 60,  label: '60s' },
  { value: 90,  label: '90s' },
]

const JOB_STATUS = {
  queued:     { label: 'Queued',     color: '#94a3b8', bg: 'rgba(100,116,139,0.12)' },
  generating: { label: 'Generating', color: '#fde047', bg: 'rgba(234,179,8,0.12)'  },
  ready:      { label: 'Ready',      color: '#6ee7b7', bg: 'rgba(16,185,129,0.12)'  },
  posting:    { label: 'Posting',    color: '#93c5fd', bg: 'rgba(59,130,246,0.12)'  },
  posted:     { label: 'Posted',     color: '#6ee7b7', bg: 'rgba(16,185,129,0.12)'  },
  failed:     { label: 'Failed',     color: '#fda4af', bg: 'rgba(244,63,94,0.12)'   },
}

// ─── Platform pill ─────────────────────────────────────────────────────────────

function PlatformPill({ platform }) {
  const cfg = PLATFORM_CFG[platform]
  if (!cfg) return null
  const Icon = cfg.icon
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border"
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

// ─── Schedule Card ─────────────────────────────────────────────────────────────

function ScheduleCard({ schedule, onToggle, onDelete, onEdit }) {
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const isActive = schedule.status === 'active'

  async function handleToggle() {
    setToggling(true)
    await onToggle(schedule.id, isActive ? 'paused' : 'active')
    setToggling(false)
  }

  async function handleDelete() {
    if (!confirm(`Delete "${schedule.name}"? Running jobs won't be affected.`)) return
    setDeleting(true)
    await onDelete(schedule.id)
  }

  const nextRun = schedule.next_run_at ? new Date(schedule.next_run_at) : null
  const nextRunStr = nextRun
    ? nextRun.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—'

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--bg-card)', border: `1px solid ${isActive ? 'var(--primary-border)' : 'var(--border)'}` }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: isActive ? 'var(--primary-dim)' : 'rgba(100,116,139,0.12)', border: `1px solid ${isActive ? 'var(--primary-border)' : 'var(--border)'}` }}
          >
            <CalendarClock className="w-4 h-4" style={{ color: isActive ? 'var(--primary-text)' : 'var(--text-3)' }} />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold truncate" style={{ color: 'var(--text)' }}>{schedule.name}</p>
            <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>
              {FREQUENCY_OPTS.find(f => f.value === schedule.frequency)?.label ?? schedule.frequency}
              {' · '}
              {schedule.video_length}s videos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{
              background: isActive ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)',
              color:      isActive ? '#6ee7b7'                : '#94a3b8',
            }}
          >
            {isActive ? 'Active' : 'Paused'}
          </span>
          <button
            onClick={() => onEdit(schedule)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-hover)'; e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Platforms */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {(schedule.platforms ?? []).map(p => <PlatformPill key={p} platform={p} />)}
      </div>

      {/* Topics preview */}
      {schedule.topics?.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-4)' }}>Topics</p>
          <div className="flex flex-wrap gap-1">
            {schedule.topics.slice(0, 4).map((t, i) => (
              <span
                key={i}
                className="text-[11px] px-2 py-0.5 rounded-md"
                style={{ background: 'var(--bg-card-hover)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
              >
                {t}
              </span>
            ))}
            {schedule.topics.length > 4 && (
              <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>+{schedule.topics.length - 4} more</span>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-3)' }}>
          <Clock className="w-3 h-3" />
          Next: {nextRunStr}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleToggle}
            disabled={toggling}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
            style={{
              background: isActive ? 'rgba(234,179,8,0.12)' : 'rgba(16,185,129,0.12)',
              color:      isActive ? '#fde047'               : '#6ee7b7',
              border:     `1px solid ${isActive ? 'rgba(234,179,8,0.3)' : 'rgba(16,185,129,0.3)'}`,
            }}
          >
            {toggling ? <Loader2 className="w-3 h-3 animate-spin" /> : isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isActive ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.1)'; e.currentTarget.style.color = '#fda4af' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Job Row ───────────────────────────────────────────────────────────────────

function JobRow({ job }) {
  const cfg = JOB_STATUS[job.status] ?? JOB_STATUS.queued
  const date = new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 transition-colors"
      style={{ borderBottom: '1px solid var(--border)' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-hover)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      {/* Thumbnail or placeholder */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
        style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border)' }}
      >
        {job.thumbnail_url
          ? <img src={job.thumbnail_url} alt="" className="w-full h-full object-cover" />
          : <Film className="w-4 h-4" style={{ color: 'var(--text-4)' }} />
        }
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
          {job.topic ?? 'Video'}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>{date}</p>
          <div className="flex gap-1">
            {(job.platforms ?? []).map(p => <PlatformPill key={p} platform={p} />)}
          </div>
        </div>
      </div>

      <span
        className="text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
        style={{ background: cfg.bg, color: cfg.color }}
      >
        {cfg.status === 'generating' && <Loader2 className="w-2.5 h-2.5 animate-spin inline mr-1" />}
        {cfg.label}
      </span>

      {job.heygen_video_url && (
        <a
          href={job.heygen_video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg flex-shrink-0 transition-colors"
          style={{ color: 'var(--text-3)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary-text)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)' }}
          title="View video"
        >
          <Video className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  )
}

// ─── Schedule Form Modal ───────────────────────────────────────────────────────

function ScheduleModal({ initial, onClose, onSaved }) {
  const isEdit = !!initial?.id
  const [form, setForm] = useState({
    name:         initial?.name         ?? 'My Video Schedule',
    platforms:    initial?.platforms    ?? [],
    frequency:    initial?.frequency    ?? 'daily',
    post_time:    initial?.post_time    ?? '10:00',
    topics:       initial?.topics       ?? [],
    brand_voice:  initial?.brand_voice  ?? '',
    avatar_id:    initial?.avatar_id    ?? '',
    voice_id:     initial?.voice_id     ?? '',
    video_length: initial?.video_length ?? 60,
  })
  const [topicInput, setTopicInput] = useState('')
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function togglePlatform(p) {
    set('platforms', form.platforms.includes(p)
      ? form.platforms.filter(x => x !== p)
      : [...form.platforms, p]
    )
  }

  function addTopic() {
    const t = topicInput.trim()
    if (!t || form.topics.includes(t)) return
    set('topics', [...form.topics, t])
    setTopicInput('')
  }

  function removeTopic(t) {
    set('topics', form.topics.filter(x => x !== t))
  }

  async function handleSave() {
    if (!form.platforms.length) { setError('Select at least one platform'); return }
    if (!form.topics.length)    { setError('Add at least one topic'); return }
    if (!form.avatar_id.trim()) { setError('Enter your HeyGen avatar ID'); return }

    setSaving(true); setError('')
    try {
      const url    = isEdit ? `/api/video-schedules/${initial.id}` : '/api/video-schedules'
      const method = isEdit ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Save failed'); return }
      onSaved(data)
      onClose()
    } catch { setError('Network error') }
    finally { setSaving(false) }
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4" style={{ color: 'var(--primary-text)' }} />
            <h2 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>
              {isEdit ? 'Edit Schedule' : 'New Video Schedule'}
            </h2>
          </div>
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

        <div className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>Schedule Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="input"
              placeholder="Daily Tech Tips"
            />
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-3)' }}>Post to</label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(PLATFORM_CFG).map(([key, cfg]) => {
                const active = form.platforms.includes(key)
                const Icon   = cfg.icon
                if (cfg.comingSoon) {
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed pointer-events-none"
                      style={{ background: 'transparent', color: 'var(--text-3)', border: '1px solid var(--border)' }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {cfg.label}
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-700/60 text-slate-500 border border-slate-600/40">SOON</span>
                    </div>
                  )
                }
                return (
                  <button
                    key={key}
                    onClick={() => togglePlatform(key)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background:  active ? cfg.bg    : 'transparent',
                      color:       active ? cfg.color : 'var(--text-3)',
                      border:      `1px solid ${active ? cfg.border : 'var(--border)'}`,
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cfg.label}
                    {active && <Check className="w-3 h-3" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Frequency + Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>Frequency</label>
              <select value={form.frequency} onChange={e => set('frequency', e.target.value)} className="input">
                {FREQUENCY_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>Post time</label>
              <input type="time" value={form.post_time} onChange={e => set('post_time', e.target.value)} className="input" />
            </div>
          </div>

          {/* Video length */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-3)' }}>Video length</label>
            <div className="flex gap-2">
              {LENGTH_OPTS.map(o => (
                <button
                  key={o.value}
                  onClick={() => set('video_length', o.value)}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: form.video_length === o.value ? 'var(--primary-dim)' : 'transparent',
                    color:      form.video_length === o.value ? 'var(--primary-text)' : 'var(--text-3)',
                    border:     `1px solid ${form.video_length === o.value ? 'var(--primary-border)' : 'var(--border)'}`,
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Topics */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>
              Topics <span style={{ color: 'var(--text-4)' }}>(AI rotates through these)</span>
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={topicInput}
                onChange={e => setTopicInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                className="input flex-1"
                placeholder="e.g. productivity tips, morning routine…"
              />
              <button
                onClick={addTopic}
                className="px-3 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--primary-dim)', color: 'var(--primary-text)', border: '1px solid var(--primary-border)' }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {form.topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.topics.map(t => (
                  <span
                    key={t}
                    className="flex items-center gap-1 text-[12px] px-2 py-1 rounded-md"
                    style={{ background: 'var(--bg-card-hover)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
                  >
                    {t}
                    <button onClick={() => removeTopic(t)} style={{ color: 'var(--text-4)' }}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* HeyGen Avatar ID */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>
              HeyGen Avatar ID <span style={{ color: 'var(--text-4)' }}>(from your HeyGen dashboard)</span>
            </label>
            <input
              type="text"
              value={form.avatar_id}
              onChange={e => set('avatar_id', e.target.value)}
              className="input"
              placeholder="e.g. Abigail_expressive_20230130"
            />
          </div>

          {/* Voice ID (optional) */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>
              HeyGen Voice ID <span style={{ color: 'var(--text-4)' }}>(optional — uses avatar default)</span>
            </label>
            <input
              type="text"
              value={form.voice_id}
              onChange={e => set('voice_id', e.target.value)}
              className="input"
              placeholder="e.g. 2d5b0e6cf36f460aa7fc47e3eee4ba54"
            />
          </div>

          {/* Brand voice */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>
              Brand voice <span style={{ color: 'var(--text-4)' }}>(optional style guide for AI)</span>
            </label>
            <textarea
              value={form.brand_voice}
              onChange={e => set('brand_voice', e.target.value)}
              className="input"
              rows={2}
              placeholder="e.g. Upbeat and motivational. Speak directly to entrepreneurs. Use short sentences."
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(244,63,94,0.1)', color: '#fda4af', border: '1px solid rgba(244,63,94,0.3)' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1 py-2.5 text-sm font-medium">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Manual Post Modal ─────────────────────────────────────────────────────────

function ManualPostModal({ connections, onClose }) {
  const [caption, setCaption]   = useState('')
  const [platform, setPlatform] = useState('tiktok')
  const [file, setFile]         = useState(null)
  const [posting, setPosting]   = useState(false)
  const [status, setStatus]     = useState('')
  const [isError, setIsError]   = useState(false)
  const [progress, setProgress] = useState(0)
  const fileRef = useRef()

  const availablePlatforms = (connections ?? []).map(c => c.platform)

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleFilePick(picked) {
    if (!picked) return
    setFile(picked)
    setStatus('')
    setProgress(0)
  }

  async function handlePost() {
    if (!file)     { setStatus('Choose a video file first'); setIsError(true); return }
    if (!platform) { setStatus('Select a platform');         setIsError(true); return }

    setPosting(true)
    setIsError(false)
    setProgress(0)

    try {
      // Step 1 — get TikTok upload URL from our API
      setStatus('Step 1/3 — Initialising upload…')
      const initRes = await fetch('/api/social/tiktok/init', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption, fileSize: file.size }),
      })
      const initData = await initRes.json()
      if (!initRes.ok) throw new Error(initData.error ?? 'Init failed')
      const { upload_url, publish_id } = initData

      // Step 2 — PUT video directly to TikTok (no server proxy)
      setStatus('Step 2/3 — Uploading video to TikTok…')
      const uploadRes = await fetch(upload_url, {
        method:  'PUT',
        headers: {
          'Content-Type':  file.type || 'video/mp4',
          'Content-Range': `bytes 0-${file.size - 1}/${file.size}`,
          'Content-Length': String(file.size),
        },
        body: file,
      })
      if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`)
      setProgress(80)

      // Step 3 — Poll publish status
      setStatus('Step 3/3 — Processing… (may take 1–2 minutes)')
      for (let i = 0; i < 24; i++) {
        await new Promise(r => setTimeout(r, 5000))
        const statusRes  = await fetch(`/api/social/tiktok/status?publish_id=${publish_id}`)
        const statusData = await statusRes.json()
        const st = statusData.data?.status
        if (st === 'PUBLISH_COMPLETE') {
          setProgress(100)
          setStatus('✓ Posted! Check your TikTok profile (will be private in sandbox).')
          setIsError(false)
          setPosting(false)
          return
        }
        if (st === 'FAILED') throw new Error(`TikTok failed: ${statusData.data?.fail_reason ?? 'unknown'}`)
      }
      throw new Error('Timed out waiting for TikTok to process the video')
    } catch (err) {
      setStatus(err.message)
      setIsError(true)
    } finally {
      setPosting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4" style={{ color: 'var(--primary-text)' }} />
            <h2 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>Post Video Now</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-hover)'; e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Platform */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-3)' }}>Platform</label>
            <div className="flex gap-2">
              {availablePlatforms.length === 0 ? (
                <p className="text-xs" style={{ color: '#fda4af' }}>
                  No platforms connected. Go to Settings → Integrations.
                </p>
              ) : availablePlatforms.map(p => {
                const cfg = PLATFORM_CFG[p]
                if (!cfg) return null
                const Icon = cfg.icon
                return (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all"
                    style={{
                      background:   platform === p ? cfg.bg      : 'transparent',
                      color:        platform === p ? cfg.color    : 'var(--text-3)',
                      borderColor:  platform === p ? cfg.border   : 'var(--border)',
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* File upload — only option, no URL pasting */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>
              Your Video <span style={{ color: 'var(--text-4)' }}>(MP4, under 128 MB)</span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="video/mp4,video/webm,video/*"
              className="hidden"
              onChange={e => handleFilePick(e.target.files[0])}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={posting}
              className="w-full flex items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed text-sm transition-colors"
              style={{ borderColor: file ? 'rgba(16,185,129,0.4)' : 'var(--border)', color: file ? '#6ee7b7' : 'var(--text-3)' }}
              onMouseEnter={e => { if (!file) { e.currentTarget.style.borderColor = 'var(--primary-border)'; e.currentTarget.style.color = 'var(--primary-text)' }}}
              onMouseLeave={e => { if (!file) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)' }}}
            >
              {file
                ? <><Check className="w-4 h-4" /> {file.name} — click to replace</>
                : <><Upload className="w-4 h-4" /> Click to choose your video</>
              }
            </button>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>
              Caption <span style={{ color: 'var(--text-4)' }}>(optional)</span>
            </label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Add a caption with hashtags…"
              value={caption}
              onChange={e => setCaption(e.target.value)}
            />
          </div>

          {/* Progress bar */}
          {posting && (
            <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--border)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: 'var(--primary)' }}
              />
            </div>
          )}

          {/* Status message */}
          {status && (
            <div
              className="flex items-start gap-2 px-3 py-2 rounded-lg text-[12px]"
              style={{
                background: isError ? 'rgba(244,63,94,0.1)'  : 'rgba(16,185,129,0.1)',
                color:      isError ? '#fda4af'               : '#6ee7b7',
                border:     `1px solid ${isError ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.3)'}`,
              }}
            >
              {posting && !isError && <Loader2 className="w-3 h-3 animate-spin shrink-0 mt-0.5" />}
              {status}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1 py-2.5 text-sm font-medium">
              Close
            </button>
            <button
              onClick={handlePost}
              disabled={posting || availablePlatforms.length === 0}
              className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium"
            >
              {posting ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting…</> : <><Send className="w-4 h-4" /> Post Now</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function VideoScheduler({ connections }) {
  const [schedules,    setSchedules]    = useState([])
  const [jobs,         setJobs]         = useState([])
  const [loading,      setLoading]      = useState(true)
  const [showModal,    setShowModal]    = useState(false)
  const [showManual,   setShowManual]   = useState(false)
  const [editing,      setEditing]      = useState(null)
  const [jobsTab,      setJobsTab]      = useState('all')
  const [refreshing,   setRefreshing]   = useState(false)

  const metaConn   = connections?.find(c => c.platform === 'meta')
  const tiktokConn = connections?.find(c => c.platform === 'tiktok')

  async function load() {
    const [schedRes, jobsRes] = await Promise.all([
      fetch('/api/video-schedules'),
      fetch('/api/video-jobs?limit=40'),
    ])
    if (schedRes.ok) setSchedules(await schedRes.json())
    if (jobsRes.ok)  setJobs(await jobsRes.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  async function handleToggle(id, status) {
    await fetch(`/api/video-schedules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, status } : s))
  }

  async function handleDelete(id) {
    await fetch(`/api/video-schedules/${id}`, { method: 'DELETE' })
    setSchedules(prev => prev.filter(s => s.id !== id))
  }

  function handleSaved(data) {
    setSchedules(prev => {
      const exists = prev.find(s => s.id === data.id)
      return exists ? prev.map(s => s.id === data.id ? data : s) : [data, ...prev]
    })
  }

  const filteredJobs = jobsTab === 'all' ? jobs : jobs.filter(j => j.status === jobsTab)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--primary-text)' }} />
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* Connection warnings */}
      {(!metaConn && !tiktokConn) && (
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
          style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)', color: '#fde047' }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">No social accounts connected</p>
            <p className="text-[12px] mt-0.5 opacity-80">
              Go to <a href="/settings?tab=integrations" className="underline">Settings → Integrations</a> to connect LinkedIn or TikTok before creating a schedule.
            </p>
          </div>
        </div>
      )}

      {/* Schedules */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h2 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>Video Schedules</h2>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-3)' }}>
              AI creates and posts videos automatically on your schedule
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowManual(true)}
              className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm font-medium shrink-0"
            >
              <Upload className="w-4 h-4" />
              Post Now
            </button>
            <button
              onClick={() => { setEditing(null); setShowModal(true) }}
              className="btn-primary flex items-center gap-2 px-4 py-2 text-sm font-medium shrink-0"
            >
              <Plus className="w-4 h-4" />
              New Schedule
            </button>
          </div>
        </div>

        {schedules.length === 0 ? (
          <div
            className="rounded-xl p-10 text-center"
            style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)' }}
          >
            <CalendarClock className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-4)' }} />
            <p className="font-medium" style={{ color: 'var(--text-3)' }}>No schedules yet</p>
            <p className="text-sm mt-1 mb-4" style={{ color: 'var(--text-4)' }}>
              Create a schedule and NexusForge will generate and post videos for you automatically
            </p>
            <button
              onClick={() => { setEditing(null); setShowModal(true) }}
              className="btn-primary px-5 py-2 text-sm font-medium inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Create your first schedule
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {schedules.map(s => (
              <ScheduleCard
                key={s.id}
                schedule={s}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onEdit={s => { setEditing(s); setShowModal(true) }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Jobs feed */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h2 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>Video Jobs</h2>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-3)' }}>
              Live feed of all AI-generated videos
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2 px-3 py-1.5 text-sm shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 mb-3 flex-wrap">
          {['all', 'generating', 'ready', 'posted', 'failed'].map(tab => (
            <button
              key={tab}
              onClick={() => setJobsTab(tab)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium capitalize transition-all"
              style={{
                background: jobsTab === tab ? 'var(--primary-dim)' : 'transparent',
                color:      jobsTab === tab ? 'var(--primary-text)' : 'var(--text-3)',
                border:     `1px solid ${jobsTab === tab ? 'var(--primary-border)' : 'transparent'}`,
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div
          className="rounded-xl overflow-hidden"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-4)' }} />
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>No jobs yet</p>
            </div>
          ) : (
            filteredJobs.map(j => <JobRow key={j.id} job={j} />)
          )}
        </div>
      </div>

      {showModal && (
        <ScheduleModal
          initial={editing}
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSaved={handleSaved}
        />
      )}

      {showManual && (
        <ManualPostModal
          connections={connections}
          onClose={() => setShowManual(false)}
        />
      )}
    </div>
  )
}
