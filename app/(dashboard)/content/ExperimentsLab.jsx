'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FlaskConical, Trophy, Zap, Plus, ChevronLeft,
  Loader2, Check, Sparkles, Copy, Camera, Linkedin,
  X, Trash2,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Shared metadata
// ─────────────────────────────────────────────────────────────────────────────

function TikTokIcon({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.54V6.79a4.85 4.85 0 01-1.02-.1z"/>
    </svg>
  )
}

const PLATFORM_META = {
  linkedin: {
    label: 'LinkedIn',
    style: { background: 'rgba(14,165,233,0.12)', color: '#7dd3fc', borderColor: 'rgba(14,165,233,0.3)' },
    Icon: Linkedin,
  },
  tiktok: {
    label: 'TikTok',
    style: { background: 'rgba(0,0,0,0.3)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.15)' },
    Icon: TikTokIcon,
  },
  instagram: {
    label: 'Instagram',
    style: { background: 'rgba(236,72,153,0.12)', color: '#f9a8d4', borderColor: 'rgba(236,72,153,0.3)' },
    Icon: Camera,
    comingSoon: true,
  },
}

const EXPERIMENT_STATUS = {
  running:  { label: 'Running',  style: { background: 'rgba(16,185,129,0.12)',  color: '#6ee7b7', borderColor: 'rgba(16,185,129,0.3)'  } },
  complete: { label: 'Complete', style: { background: 'rgba(100,116,139,0.12)', color: '#94a3b8', borderColor: 'rgba(100,116,139,0.3)' } },
}

// ─────────────────────────────────────────────────────────────────────────────
// Small utilities
// ─────────────────────────────────────────────────────────────────────────────

function Badge({ children, style, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${className}`}
      style={style}
    >
      {children}
    </span>
  )
}

function Spinner({ className = 'w-4 h-4' }) {
  return <Loader2 className={`${className} animate-spin`} />
}

// ─────────────────────────────────────────────────────────────────────────────
// Create experiment modal
// ─────────────────────────────────────────────────────────────────────────────

function CreateModal({ onClose, onCreate }) {
  const [name, setName]           = useState('')
  const [hypothesis, setHypo]     = useState('')
  const [platform, setPlatform]   = useState('linkedin')
  const [variantA, setVariantA]   = useState('')
  const [variantB, setVariantB]   = useState('')
  const [genA, setGenA]           = useState(false)
  const [genB, setGenB]           = useState(false)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  const pm = PLATFORM_META[platform]

  async function generateVariant(setter, setLoading) {
    if (!name.trim()) { setError('Add a name before generating.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/content/from-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: `${name.trim()} ${hypothesis.trim()}`.trim(),
          platform,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Generation failed.'); return }
      setter(json.post?.body ?? '')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!name.trim())    { setError('Name is required.'); return }
    if (!variantA.trim()) { setError('Variant A is required.'); return }
    if (!variantB.trim()) { setError('Variant B is required.'); return }

    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/content/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:           name.trim(),
          platform,
          hypothesis:     hypothesis.trim(),
          variant_a_body: variantA.trim(),
          variant_b_body: variantB.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to create.'); return }
      onCreate(json)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl"
        style={{ background: '#0d1117', border: '1px solid rgba(148,163,184,0.12)' }}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
          style={{ background: '#0d1117', borderBottom: '1px solid rgba(148,163,184,0.1)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.15)' }}
            >
              <FlaskConical className="w-4 h-4" style={{ color: '#a5b4fc' }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>New Experiment</h2>
              <p className="text-[11px]" style={{ color: 'var(--text-4)' }}>Create an A/B test for two post variants</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-4)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>
              What are you testing?
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Story hook vs. Question hook"
              className="input w-full"
            />
          </div>

          {/* Hypothesis */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>
              What do you expect?
            </label>
            <input
              type="text"
              value={hypothesis}
              onChange={e => setHypo(e.target.value)}
              placeholder="e.g. Story format will get more comments"
              className="input w-full"
            />
          </div>

          {/* Platform */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>
              Platform
            </label>
            <div className="flex gap-2">
              {['linkedin', 'tiktok', 'instagram'].map(p => {
                const meta = PLATFORM_META[p]
                const active = platform === p
                if (meta.comingSoon) {
                  return (
                    <div
                      key={p}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium opacity-50 cursor-not-allowed pointer-events-none"
                      style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-3)', border: '1px solid var(--border)' }}
                    >
                      <meta.Icon className="w-3.5 h-3.5" />
                      {meta.label}
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-700/60 text-slate-500 border border-slate-600/40">SOON</span>
                    </div>
                  )
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all"
                    style={
                      active
                        ? meta.style
                        : {
                            background: 'rgba(255,255,255,0.03)',
                            color: 'var(--text-3)',
                            border: '1px solid var(--border)',
                          }
                    }
                  >
                    <meta.Icon className="w-3.5 h-3.5" />
                    {meta.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Variants */}
          {[
            { label: 'Variant A', value: variantA, setter: setVariantA, loading: genA, setLoading: setGenA },
            { label: 'Variant B', value: variantB, setter: setVariantB, loading: genB, setLoading: setGenB },
          ].map(({ label, value, setter, loading, setLoading }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>
                  {label} — Hook / opening approach
                </label>
                <button
                  onClick={() => generateVariant(setter, setLoading)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all disabled:opacity-50"
                  style={{
                    background: 'rgba(99,102,241,0.12)',
                    color: '#a5b4fc',
                    border: '1px solid rgba(99,102,241,0.25)',
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(99,102,241,0.2)' }}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.12)'}
                >
                  {loading ? <Spinner className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                  {loading ? 'Generating…' : 'AI Generate'}
                </button>
              </div>
              <textarea
                value={value}
                onChange={e => setter(e.target.value)}
                rows={5}
                placeholder={`Write ${label} here, or use AI Generate above…`}
                className="input w-full resize-none"
                style={{ fontSize: '13px', lineHeight: '1.6' }}
              />
            </div>
          ))}

          {error && (
            <p
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
              style={{ background: 'rgba(244,63,94,0.1)', color: '#fda4af', border: '1px solid rgba(244,63,94,0.2)' }}
            >
              <X className="w-3.5 h-3.5 shrink-0" /> {error}
            </p>
          )}

          {/* Footer actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="btn-secondary px-4 py-2 text-sm">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="btn-primary flex items-center gap-2 px-5 py-2 text-sm disabled:opacity-60"
            >
              {saving ? <Spinner className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
              {saving ? 'Creating…' : 'Create Experiment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Experiment list card
// ─────────────────────────────────────────────────────────────────────────────

function ExperimentListCard({ experiment, onClick, onDelete }) {
  const pm = PLATFORM_META[experiment.platform] ?? PLATFORM_META.linkedin
  const sm = EXPERIMENT_STATUS[experiment.status] ?? EXPERIMENT_STATUS.running
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e) {
    e.stopPropagation()
    if (!confirm('Delete this experiment? This cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/content/experiments/${experiment.id}`, { method: 'DELETE' })
      if (res.ok) onDelete(experiment.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      onClick={onClick}
      className="rounded-xl p-4 cursor-pointer transition-all group"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge style={pm.style}>
              <pm.Icon className="w-3 h-3" />
              {pm.label}
            </Badge>
            <Badge style={sm.style}>
              {experiment.status === 'running' && (
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ background: '#6ee7b7' }}
                />
              )}
              {sm.label}
            </Badge>
            {experiment.winner && (
              <Badge style={{ background: 'rgba(245,158,11,0.12)', color: '#fcd34d', borderColor: 'rgba(245,158,11,0.3)' }}>
                <Trophy className="w-3 h-3" />
                Variant {experiment.winner.toUpperCase()} won
              </Badge>
            )}
          </div>

          <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
            {experiment.name}
          </h3>

          {experiment.hypothesis && (
            <p
              className="text-xs mt-0.5 truncate"
              style={{ color: 'var(--text-4)' }}
              title={experiment.hypothesis}
            >
              {experiment.hypothesis}
            </p>
          )}
        </div>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all"
          style={{ color: 'var(--text-4)' }}
          onMouseEnter={e => e.currentTarget.style.color = '#fda4af'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}
          title="Delete experiment"
        >
          {deleting ? <Spinner className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant card (used inside detail view)
// ─────────────────────────────────────────────────────────────────────────────

function VariantCard({ letter, body, isWinner, isRunning, onPick, picking }) {
  const [copied, setCopied] = useState(false)

  const isA   = letter === 'A'
  const badge = isA
    ? { background: 'rgba(16,185,129,0.15)', color: '#6ee7b7' }
    : { background: 'rgba(99,102,241,0.15)',  color: '#a5b4fc' }

  const pickBtn = isA
    ? { normal: 'rgba(16,185,129,0.15)',  hover: 'rgba(16,185,129,0.25)',  color: '#6ee7b7', border: 'rgba(16,185,129,0.35)' }
    : { normal: 'rgba(99,102,241,0.15)',   hover: 'rgba(99,102,241,0.25)',   color: '#a5b4fc', border: 'rgba(99,102,241,0.35)' }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(body ?? '')
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col h-full"
      style={{
        background: isWinner ? 'rgba(16,185,129,0.06)' : 'var(--bg-card)',
        border: isWinner ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
            style={badge}
          >
            {letter}
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Variant {letter}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isWinner && (
            <Badge style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', borderColor: 'rgba(16,185,129,0.3)' }}>
              <Trophy className="w-3 h-3" />
              Winner
            </Badge>
          )}
          <button
            onClick={handleCopy}
            title="Copy variant"
            className="p-1.5 rounded-md transition-all"
            style={{ color: 'var(--text-4)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}
          >
            {copied ? <Check className="w-3.5 h-3.5" style={{ color: '#6ee7b7' }} /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-4 flex-1 overflow-y-auto" style={{ maxHeight: '280px' }}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-2)' }}>
          {body}
        </p>
      </div>

      {/* Pick winner button */}
      {isRunning && !isWinner && (
        <div className="px-4 pb-4 pt-2">
          <button
            onClick={onPick}
            disabled={picking}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
            style={{
              background: pickBtn.normal,
              color: pickBtn.color,
              border: `1px solid ${pickBtn.border}`,
            }}
            onMouseEnter={e => { if (!picking) e.currentTarget.style.background = pickBtn.hover }}
            onMouseLeave={e => e.currentTarget.style.background = pickBtn.normal}
          >
            {picking ? <Spinner className="w-4 h-4" /> : <span>Pick as Winner 🏆</span>}
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail view
// ─────────────────────────────────────────────────────────────────────────────

function ExperimentDetail({ experiment: initial, onBack, onWinnerPicked }) {
  const [experiment, setExperiment] = useState(initial)
  const [pickingA, setPickingA]     = useState(false)
  const [pickingB, setPickingB]     = useState(false)
  const [error, setError]           = useState('')

  const pm = PLATFORM_META[experiment.platform] ?? PLATFORM_META.linkedin
  const sm = EXPERIMENT_STATUS[experiment.status] ?? EXPERIMENT_STATUS.running
  const isRunning  = experiment.status === 'running'
  const isComplete = experiment.status === 'complete'

  async function pickWinner(winner) {
    const setSaving = winner === 'a' ? setPickingA : setPickingB
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/content/experiments/${experiment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to set winner.'); return }
      setExperiment(json)
      onWinnerPicked(json)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: 'var(--text-3)' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
      >
        <ChevronLeft className="w-4 h-4" />
        Back to experiments
      </button>

      {/* Complete banner */}
      {isComplete && (
        <div
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7' }}
        >
          <Check className="w-4 h-4 shrink-0" />
          Winner saved to Approved drafts — ready to schedule or publish.
        </div>
      )}

      {/* Experiment header */}
      <div
        className="rounded-xl p-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge style={pm.style}>
                <pm.Icon className="w-3 h-3" />
                {pm.label}
              </Badge>
              <Badge style={sm.style}>
                {isRunning && (
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: '#6ee7b7' }}
                  />
                )}
                {sm.label}
              </Badge>
            </div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
              {experiment.name}
            </h2>
            {experiment.hypothesis && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>
                Hypothesis: {experiment.hypothesis}
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
          style={{ background: 'rgba(244,63,94,0.1)', color: '#fda4af', border: '1px solid rgba(244,63,94,0.2)' }}
        >
          <X className="w-3.5 h-3.5 shrink-0" /> {error}
        </p>
      )}

      {/* Side-by-side variants */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <VariantCard
          letter="A"
          body={experiment.variant_a_body}
          isWinner={isComplete && experiment.winner === 'a'}
          isRunning={isRunning}
          picking={pickingA}
          onPick={() => pickWinner('a')}
        />
        <VariantCard
          letter="B"
          body={experiment.variant_b_body}
          isWinner={isComplete && experiment.winner === 'b'}
          isRunning={isRunning}
          picking={pickingB}
          onPick={() => pickWinner('b')}
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function ExperimentsLab() {
  const [experiments, setExperiments]   = useState([])
  const [loading, setLoading]           = useState(true)
  const [showCreate, setShowCreate]     = useState(false)
  const [activeExp, setActiveExp]       = useState(null)

  // ── Fetch list ───────────────────────────────────────────────────────────
  const fetchExperiments = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/content/experiments')
      const data = await res.json()
      if (res.ok) setExperiments(Array.isArray(data) ? data : [])
    } catch {
      // fail silently — empty state shown
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchExperiments() }, [fetchExperiments])

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleCreated(newExp) {
    setExperiments(prev => [newExp, ...prev])
    setShowCreate(false)
    setActiveExp(newExp)
  }

  function handleWinnerPicked(updated) {
    setExperiments(prev => prev.map(e => e.id === updated.id ? updated : e))
    setActiveExp(updated)
  }

  function handleDelete(id) {
    setExperiments(prev => prev.filter(e => e.id !== id))
    if (activeExp?.id === id) setActiveExp(null)
  }

  // ── List view ────────────────────────────────────────────────────────────
  if (activeExp) {
    return (
      <ExperimentDetail
        experiment={activeExp}
        onBack={() => setActiveExp(null)}
        onWinnerPicked={handleWinnerPicked}
      />
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5 mb-0.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.15)' }}
              >
                <FlaskConical className="w-4 h-4" style={{ color: '#a5b4fc' }} />
              </div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
                Experiments Lab
              </h2>
            </div>
            <p className="text-xs ml-[42px]" style={{ color: 'var(--text-4)' }}>
              Test two versions of a post. Pick the winner — it goes straight to approved.
            </p>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            New Experiment
          </button>
        </div>

        {/* Experiment list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="w-5 h-5" />
          </div>
        ) : experiments.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 rounded-xl"
            style={{ border: '1px dashed var(--border)' }}
          >
            <FlaskConical className="w-9 h-9 mb-3" style={{ color: 'var(--text-4)' }} />
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-2)' }}>
              No experiments yet
            </p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-4)' }}>
              Create your first A/B test to compare post variants
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: 'rgba(99,102,241,0.12)',
                color: '#a5b4fc',
                border: '1px solid rgba(99,102,241,0.3)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.12)'}
            >
              <Plus className="w-3.5 h-3.5" />
              New Experiment
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {experiments.map(exp => (
              <ExperimentListCard
                key={exp.id}
                experiment={exp}
                onClick={() => setActiveExp(exp)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreated}
        />
      )}
    </>
  )
}
