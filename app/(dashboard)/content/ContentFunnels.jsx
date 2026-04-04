'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  GitBranch, ArrowRight, Zap, Users, BookOpen, Star, Target,
  Plus, Trash2, Copy, Check, Loader2, ChevronLeft, X,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Stage metadata
// ─────────────────────────────────────────────────────────────────────────────

const STAGE_META = {
  awareness: {
    label:       'Awareness',
    description: 'Introduce a problem or pain point — no selling.',
    Icon:        Users,
    color: {
      badge:       'bg-cyan-900/20 text-cyan-400 border-cyan-800/30',
      icon:        'text-cyan-400',
      iconBg:      'bg-cyan-900/25',
      border:      'border-cyan-800/40',
      btn:         'bg-cyan-900/15 text-cyan-400 border-cyan-800/30 hover:bg-cyan-900/30 hover:border-cyan-700/50',
      btnLoading:  'bg-cyan-900/25 text-cyan-400 border-cyan-800/40 cursor-wait',
      headerText:  'text-cyan-300',
    },
  },
  education: {
    label:       'Education',
    description: 'Share insights, tips, or how-to content that builds authority.',
    Icon:        BookOpen,
    color: {
      badge:       'bg-violet-900/20 text-violet-400 border-violet-800/30',
      icon:        'text-violet-400',
      iconBg:      'bg-violet-900/25',
      border:      'border-violet-800/40',
      btn:         'bg-violet-900/15 text-violet-400 border-violet-800/30 hover:bg-violet-900/30 hover:border-violet-700/50',
      btnLoading:  'bg-violet-900/25 text-violet-400 border-violet-800/40 cursor-wait',
      headerText:  'text-violet-300',
    },
  },
  social_proof: {
    label:       'Social Proof',
    description: 'Show real results, transformations, or testimonials.',
    Icon:        Star,
    color: {
      badge:       'bg-emerald-900/20 text-emerald-400 border-emerald-800/30',
      icon:        'text-emerald-400',
      iconBg:      'bg-emerald-900/25',
      border:      'border-emerald-800/40',
      btn:         'bg-emerald-900/15 text-emerald-400 border-emerald-800/30 hover:bg-emerald-900/30 hover:border-emerald-700/50',
      btnLoading:  'bg-emerald-900/25 text-emerald-400 border-emerald-800/40 cursor-wait',
      headerText:  'text-emerald-300',
    },
  },
  cta: {
    label:       'CTA',
    description: 'Drive a specific action — booking, enquiry, or purchase.',
    Icon:        Target,
    color: {
      badge:       'bg-amber-900/20 text-amber-400 border-amber-800/30',
      icon:        'text-amber-400',
      iconBg:      'bg-amber-900/25',
      border:      'border-amber-800/40',
      btn:         'bg-amber-900/15 text-amber-400 border-amber-800/30 hover:bg-amber-900/30 hover:border-amber-700/50',
      btnLoading:  'bg-amber-900/25 text-amber-400 border-amber-800/40 cursor-wait',
      headerText:  'text-amber-300',
    },
  },
}

const PLATFORM_META = {
  linkedin: {
    label: 'LinkedIn',
    style: { background: 'rgba(14,165,233,0.12)', color: '#7dd3fc', borderColor: 'rgba(14,165,233,0.3)' },
  },
  tiktok: {
    label: 'TikTok',
    style: { background: 'rgba(0,0,0,0.3)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.15)' },
  },
  instagram: {
    label: 'Instagram',
    style: { background: 'rgba(236,72,153,0.12)', color: '#f9a8d4', borderColor: 'rgba(236,72,153,0.3)' },
    comingSoon: true,
  },
}

function countTotalPosts(stages) {
  if (!Array.isArray(stages)) return 0
  return stages.reduce((acc, s) => acc + (Array.isArray(s.posts) ? s.posts.length : 0), 0)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─────────────────────────────────────────────────────────────────────────────
// Post review modal — shown after AI generates a post, before accepting
// ─────────────────────────────────────────────────────────────────────────────

function ReviewModal({ post, stageId, onAccept, onDiscard }) {
  const meta = STAGE_META[stageId] ?? STAGE_META.awareness

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onDiscard}
      />

      {/* Panel */}
      <div className="relative bg-[#0d1117] border border-slate-700/60 rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${meta.color.iconBg}`}>
              <meta.Icon className={`w-3.5 h-3.5 ${meta.color.icon}`} />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Generated Post</h3>
              <p className="text-slate-500 text-xs">{meta.label} stage</p>
            </div>
          </div>
          <button
            onClick={onDiscard}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-800/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
          <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
            {post.body}
          </p>
          {post.hashtags && (
            <p className="text-indigo-400 text-xs leading-relaxed">
              {post.hashtags}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-800/60">
          <button
            onClick={onDiscard}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 bg-slate-800/60 border border-slate-700/50 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Discard
          </button>
          <button
            onClick={() => onAccept(post)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Individual post card inside a stage column
// ─────────────────────────────────────────────────────────────────────────────

function PostCard({ post, onDelete }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const text = post.hashtags ? `${post.body}\n\n${post.hashtags}` : post.body
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group bg-[#0a0f16] border border-slate-800/40 rounded-lg p-3 space-y-2">
      <p className="text-slate-300 text-xs leading-relaxed line-clamp-3">
        {post.body}
      </p>
      {post.hashtags && (
        <p className="text-indigo-400/70 text-[10px] leading-snug line-clamp-1">
          {post.hashtags}
        </p>
      )}
      <div className="flex items-center gap-1.5 pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          title="Copy post"
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-slate-400 bg-slate-800/60 border border-slate-700/40 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          {copied
            ? <><Check className="w-3 h-3 text-emerald-400" /> Copied</>
            : <><Copy className="w-3 h-3" /> Copy</>
          }
        </button>
        <button
          onClick={onDelete}
          title="Delete post"
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-red-500/70 bg-red-900/10 border border-red-900/20 hover:text-red-400 hover:bg-red-900/20 transition-colors"
        >
          <Trash2 className="w-3 h-3" /> Delete
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Stage column in funnel detail view
// ─────────────────────────────────────────────────────────────────────────────

function StageColumn({ stage, funnelId, funnelPlatform, onPostsChange }) {
  const meta      = STAGE_META[stage.id] ?? STAGE_META.awareness
  const [generating, setGenerating] = useState(false)
  const [genError,   setGenError]   = useState(null)
  const [preview,    setPreview]    = useState(null) // generated post pending review

  const handleGenerate = async () => {
    setGenerating(true)
    setGenError(null)
    try {
      const res  = await fetch('/api/content/funnels/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          funnelId,
          stageId:  stage.id,
          platform: funnelPlatform,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Generation failed')
      setPreview(json.post)
    } catch (err) {
      setGenError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleAccept = (post) => {
    const newPost = {
      id:       crypto.randomUUID(),
      body:     post.body,
      hashtags: post.hashtags ?? null,
      addedAt:  new Date().toISOString(),
    }
    onPostsChange(stage.id, [...(stage.posts ?? []), newPost])
    setPreview(null)
  }

  const handleDiscard = () => setPreview(null)

  const handleDelete = (postId) => {
    onPostsChange(stage.id, (stage.posts ?? []).filter(p => p.id !== postId))
  }

  return (
    <>
      {/* Review modal */}
      {preview && (
        <ReviewModal
          post={preview}
          stageId={stage.id}
          onAccept={handleAccept}
          onDiscard={handleDiscard}
        />
      )}

      <div className="bg-[#0d1117] border border-slate-800/60 rounded-xl p-4 min-w-[260px] w-[260px] flex flex-col gap-3">

        {/* Stage header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${meta.color.iconBg}`}>
              <meta.Icon className={`w-3 h-3 ${meta.color.icon}`} />
            </div>
            <span className={`font-semibold text-sm ${meta.color.headerText}`}>
              {meta.label}
            </span>
            <span className="ml-auto text-slate-600 text-xs font-mono">
              {(stage.posts ?? []).length}
            </span>
          </div>
          <p className="text-slate-500 text-[11px] leading-snug pl-8">
            {meta.description}
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800/60" />

        {/* Posts list */}
        <div className="flex flex-col gap-2 flex-1 min-h-0">
          {(stage.posts ?? []).length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-6">
              <p className="text-slate-700 text-xs text-center leading-relaxed">
                No posts yet.<br />Generate one below.
              </p>
            </div>
          ) : (
            (stage.posts ?? []).map(post => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={() => handleDelete(post.id)}
              />
            ))
          )}
        </div>

        {/* Generate button */}
        {genError && (
          <p className="text-red-400 text-[11px] leading-tight bg-red-900/10 border border-red-800/30 rounded-lg px-2.5 py-1.5">
            {genError}
          </p>
        )}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className={[
            'w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-150',
            generating ? meta.color.btnLoading : meta.color.btn,
          ].join(' ')}
        >
          {generating
            ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating…</>
            : <><Zap className="w-3 h-3" /> Generate post</>
          }
        </button>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Funnel card in list view
// ─────────────────────────────────────────────────────────────────────────────

function FunnelCard({ funnel, onClick, onDelete }) {
  const [deleting,    setDeleting]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const totalPosts = countTotalPosts(funnel.stages)
  const platformMeta = funnel.platform ? PLATFORM_META[funnel.platform] : null

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!showConfirm) { setShowConfirm(true); return }
    setDeleting(true)
    try {
      const res = await fetch(`/api/content/funnels/${funnel.id}`, { method: 'DELETE' })
      if (res.ok) onDelete(funnel.id)
    } finally {
      setDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <div
      onClick={onClick}
      className="group bg-[#0d1117] border border-slate-800/60 rounded-xl p-5 cursor-pointer hover:border-indigo-700/50 hover:shadow-lg hover:shadow-indigo-950/20 transition-all duration-200 flex flex-col gap-3 relative"
    >
      {/* Name + platform badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
            <GitBranch className="w-4 h-4 text-indigo-400" />
          </div>
          <h3 className="text-white font-semibold text-sm leading-tight truncate">
            {funnel.name}
          </h3>
        </div>
        {platformMeta && (
          <span
            className="flex-shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium border"
            style={platformMeta.style}
          >
            {platformMeta.label}
          </span>
        )}
      </div>

      {/* Goal */}
      {funnel.goal && (
        <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
          {funnel.goal}
        </p>
      )}

      {/* Footer: post count + date */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-slate-500 text-[11px]">
          {totalPosts} {totalPosts === 1 ? 'post' : 'posts'} across 4 stages
        </span>
        <span className="text-slate-600 text-[11px]">
          {formatDate(funnel.created_at)}
        </span>
      </div>

      {/* Stage progress dots */}
      <div className="flex items-center gap-1.5">
        {(funnel.stages ?? []).map(stage => {
          const m = STAGE_META[stage.id]
          const hasPost = (stage.posts ?? []).length > 0
          return (
            <div
              key={stage.id}
              title={`${m?.label ?? stage.label}: ${(stage.posts ?? []).length} posts`}
              className={[
                'flex-1 h-1 rounded-full transition-all',
                hasPost
                  ? stage.id === 'awareness'    ? 'bg-cyan-500/60'
                    : stage.id === 'education'  ? 'bg-violet-500/60'
                    : stage.id === 'social_proof' ? 'bg-emerald-500/60'
                    : 'bg-amber-500/60'
                  : 'bg-slate-800',
              ].join(' ')}
            />
          )
        })}
      </div>

      {/* Delete button */}
      <div className="absolute top-3.5 right-3.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={[
            'flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors',
            showConfirm
              ? 'bg-red-900/30 text-red-400 border-red-800/50 hover:bg-red-900/50'
              : 'bg-slate-900/80 text-slate-500 border-slate-700/50 hover:text-red-400 hover:bg-red-900/20 hover:border-red-900/40',
          ].join(' ')}
        >
          {deleting
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : <Trash2 className="w-3 h-3" />
          }
          {showConfirm ? 'Confirm?' : ''}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Create funnel modal
// ─────────────────────────────────────────────────────────────────────────────

function CreateFunnelModal({ onClose, onCreate }) {
  const [name,     setName]     = useState('')
  const [goal,     setGoal]     = useState('')
  const [platform, setPlatform] = useState('linkedin')
  const [creating, setCreating] = useState(false)
  const [error,    setError]    = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    setError(null)
    try {
      const res  = await fetch('/api/content/funnels', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: name.trim(), goal: goal.trim(), platform }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to create funnel')
      onCreate(json)
    } catch (err) {
      setError(err.message)
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0d1117] border border-slate-700/60 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">New Content Funnel</h2>
              <p className="text-slate-500 text-xs">Define your audience journey</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-800/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 text-xs font-medium">
              Funnel name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Q2 Lead Generation"
              autoFocus
              required
              className="w-full bg-[#0a0f16] border border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-600/60 focus:ring-1 focus:ring-indigo-600/20 transition-colors"
            />
          </div>

          {/* Goal */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 text-xs font-medium">
              Goal <span className="text-slate-600 font-normal">(optional)</span>
            </label>
            <textarea
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="e.g. Convert cold leads into discovery call bookings"
              rows={2}
              className="w-full bg-[#0a0f16] border border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-600/60 focus:ring-1 focus:ring-indigo-600/20 transition-colors resize-none"
            />
          </div>

          {/* Platform */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 text-xs font-medium">
              Primary platform
            </label>
            <div className="flex gap-2">
              {[
                { value: 'linkedin',  label: 'LinkedIn',  colorClass: 'text-sky-400 border-sky-700/50 bg-sky-900/15',  activeClass: 'border-sky-500/60 bg-sky-900/30',  comingSoon: false },
                { value: 'tiktok',    label: 'TikTok',    colorClass: 'text-white border-white/20 bg-black/30',          activeClass: 'border-white/40 bg-black/50',          comingSoon: false },
                { value: 'instagram', label: 'Instagram', colorClass: 'text-pink-400 border-pink-700/50 bg-pink-900/15', activeClass: 'border-pink-500/60 bg-pink-900/30', comingSoon: true },
              ].map(p => (
                p.comingSoon ? (
                  <div
                    key={p.value}
                    className={[
                      'flex-1 py-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5',
                      p.colorClass,
                      'opacity-50 cursor-not-allowed pointer-events-none',
                    ].join(' ')}
                  >
                    {p.label}
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-700/60 text-slate-500 border border-slate-600/40">SOON</span>
                  </div>
                ) : (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPlatform(p.value)}
                    className={[
                      'flex-1 py-2 rounded-lg text-xs font-medium border transition-colors',
                      p.colorClass,
                      platform === p.value ? p.activeClass : 'opacity-60 hover:opacity-100',
                    ].join(' ')}
                  >
                    {p.label}
                  </button>
                )
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-xs bg-red-900/15 border border-red-800/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Funnel stages preview */}
          <div className="pt-1">
            <p className="text-slate-600 text-[11px] mb-2">Stages created automatically:</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {['Awareness', 'Education', 'Social Proof', 'CTA'].map((s, i, arr) => (
                <div key={s} className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[11px] font-medium">{s}</span>
                  {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-slate-700" />}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 bg-slate-800/60 border border-slate-700/50 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {creating
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating…</>
                : <><Plus className="w-3.5 h-3.5" /> Create Funnel</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail view — full funnel with stage columns
// ─────────────────────────────────────────────────────────────────────────────

function FunnelDetail({ funnelId, onBack }) {
  const [funnel,    setFunnel]    = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState(null)
  const [editName,  setEditName]  = useState('')
  const [nameEdit,  setNameEdit]  = useState(false)

  const saveTimerRef = useRef(null)
  const stagesRef    = useRef(null)

  // Load funnel
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/content/funnels/${funnelId}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        setFunnel(data)
        setEditName(data.name ?? '')
        stagesRef.current = data.stages
      })
      .catch(err => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [funnelId])

  // Debounced save
  const scheduleSave = useCallback((updatedStages) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true)
      setSaved(false)
      try {
        const res  = await fetch(`/api/content/funnels/${funnelId}`, {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ stages: updatedStages }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Save failed')
        setFunnel(json)
        stagesRef.current = json.stages
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      } catch (err) {
        setError(err.message)
      } finally {
        setSaving(false)
      }
    }, 800)
  }, [funnelId])

  const handlePostsChange = useCallback((stageId, newPosts) => {
    setFunnel(prev => {
      if (!prev) return prev
      const updated = {
        ...prev,
        stages: prev.stages.map(s =>
          s.id === stageId ? { ...s, posts: newPosts } : s
        ),
      }
      scheduleSave(updated.stages)
      return updated
    })
  }, [scheduleSave])

  const handleNameSave = async () => {
    if (!editName.trim() || editName.trim() === funnel?.name) {
      setNameEdit(false)
      setEditName(funnel?.name ?? '')
      return
    }
    try {
      const res  = await fetch(`/api/content/funnels/${funnelId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: editName.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Save failed')
      setFunnel(json)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.message)
    }
    setNameEdit(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    )
  }

  if (error && !funnel) {
    return (
      <div className="bg-red-900/15 border border-red-800/40 rounded-xl px-5 py-4 text-red-400 text-sm">
        {error}
      </div>
    )
  }

  if (!funnel) return null

  const platformMeta = funnel.platform ? PLATFORM_META[funnel.platform] : null

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 text-xs font-medium bg-slate-800/60 border border-slate-700/50 hover:text-slate-200 hover:bg-slate-800 transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back
          </button>

          <div className="min-w-0">
            {nameEdit ? (
              <input
                autoFocus
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={e => { if (e.key === 'Enter') handleNameSave(); if (e.key === 'Escape') { setNameEdit(false); setEditName(funnel.name) } }}
                className="bg-[#0a0f16] border border-indigo-600/60 rounded-lg px-3 py-1.5 text-white font-semibold text-lg focus:outline-none focus:ring-1 focus:ring-indigo-600/30 w-full max-w-xs"
              />
            ) : (
              <button
                onClick={() => setNameEdit(true)}
                className="text-white font-semibold text-lg hover:text-indigo-300 transition-colors text-left truncate max-w-xs block"
                title="Click to edit"
              >
                {funnel.name}
              </button>
            )}
            {funnel.goal && (
              <p className="text-slate-500 text-xs mt-0.5 truncate max-w-sm">
                {funnel.goal}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {platformMeta && (
            <span
              className="px-2.5 py-1 rounded-full text-xs font-medium border"
              style={platformMeta.style}
            >
              {platformMeta.label}
            </span>
          )}
          {/* Save indicator */}
          <div className="h-6 flex items-center">
            {saving && (
              <span className="flex items-center gap-1.5 text-slate-500 text-xs">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving…
              </span>
            )}
            {saved && !saving && (
              <span className="flex items-center gap-1.5 text-emerald-500 text-xs">
                <Check className="w-3 h-3" /> Saved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-900/15 border border-red-800/40 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center justify-between gap-3">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs underline underline-offset-2 flex-shrink-0 hover:text-red-300">
            Dismiss
          </button>
        </div>
      )}

      {/* Funnel flow indicator */}
      <div className="flex items-center gap-2 px-1">
        {(funnel.stages ?? []).map((stage, i, arr) => {
          const m = STAGE_META[stage.id]
          return (
            <div key={stage.id} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${m?.color.badge ?? ''}`}>
                {m && <m.Icon className="w-3 h-3" />}
                {m?.label ?? stage.label}
                {(stage.posts ?? []).length > 0 && (
                  <span className="font-mono">{(stage.posts ?? []).length}</span>
                )}
              </div>
              {i < arr.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-slate-700 flex-shrink-0" />
              )}
            </div>
          )
        })}
      </div>

      {/* Stage columns */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent' }}>
        {(funnel.stages ?? []).map(stage => (
          <StageColumn
            key={stage.id}
            stage={stage}
            funnelId={funnelId}
            funnelPlatform={funnel.platform}
            onPostsChange={handlePostsChange}
          />
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main ContentFunnels component
// ─────────────────────────────────────────────────────────────────────────────

export default function ContentFunnels({ brand }) {
  const [funnels,         setFunnels]         = useState([])
  const [loading,         setLoading]         = useState(true)
  const [activeFunnelId,  setActiveFunnelId]  = useState(null)
  const [showCreate,      setShowCreate]      = useState(false)
  const [error,           setError]           = useState(null)

  // Load funnels
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/api/content/funnels')
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          if (Array.isArray(data)) setFunnels(data)
          else setError(data.error ?? 'Failed to load funnels')
        }
      })
      .catch(err => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const handleCreate = (newFunnel) => {
    setFunnels(prev => [newFunnel, ...prev])
    setShowCreate(false)
    setActiveFunnelId(newFunnel.id)
  }

  const handleDelete = (id) => {
    setFunnels(prev => prev.filter(f => f.id !== id))
    if (activeFunnelId === id) setActiveFunnelId(null)
  }

  // ── Detail view ─────────────────────────────────────────────────────────────
  if (activeFunnelId) {
    return (
      <FunnelDetail
        funnelId={activeFunnelId}
        onBack={() => setActiveFunnelId(null)}
      />
    )
  }

  // ── List view ───────────────────────────────────────────────────────────────
  return (
    <>
      {showCreate && (
        <CreateFunnelModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}

      <section className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
              <GitBranch className="w-4.5 h-4.5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base leading-tight">
                Content Funnels
              </h2>
              <p className="text-slate-500 text-xs mt-0.5 max-w-md">
                Structure your content as a journey — guide your audience from discovery to conversion.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Funnel
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-900/15 border border-red-800/40 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center justify-between gap-3">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-xs underline underline-offset-2 flex-shrink-0 hover:text-red-300"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#0d1117] border border-slate-800/60 rounded-xl p-5 space-y-3 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-800 rounded-lg" />
                  <div className="w-40 h-4 bg-slate-800 rounded" />
                </div>
                <div className="w-full h-3 bg-slate-800/70 rounded" />
                <div className="w-2/3 h-3 bg-slate-800/70 rounded" />
                <div className="flex gap-1.5 pt-1">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="flex-1 h-1 bg-slate-800 rounded-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && funnels.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-800/30 flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-indigo-500" />
            </div>
            <div className="space-y-1.5">
              <p className="text-white font-semibold text-sm">No funnels yet</p>
              <p className="text-slate-500 text-xs max-w-xs leading-relaxed">
                Create your first funnel to start building structured content sequences
                that move your audience from awareness to action.
              </p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors mt-1"
            >
              <Plus className="w-4 h-4" />
              Create your first funnel
            </button>
          </div>
        )}

        {/* Funnel grid */}
        {!loading && funnels.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {funnels.map(funnel => (
              <FunnelCard
                key={funnel.id}
                funnel={funnel}
                onClick={() => setActiveFunnelId(funnel.id)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
