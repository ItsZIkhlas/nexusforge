'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, Linkedin, Camera, Music2, Mail, Copy, Check, BookmarkPlus } from 'lucide-react'

// ── Platform config ────────────────────────────────────────────────────────────

const PLATFORMS = [
  {
    key: 'linkedin',
    label: 'LinkedIn',
    Icon: Linkedin,
    bg: 'rgba(14,165,233,0.12)',
    color: '#7dd3fc',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    Icon: Camera,
    bg: 'rgba(236,72,153,0.12)',
    color: '#f9a8d4',
    comingSoon: true,
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    Icon: Music2,
    bg: 'rgba(20,184,166,0.12)',
    color: '#5eead4',
  },
  {
    key: 'email',
    label: 'Email',
    Icon: Mail,
    bg: 'rgba(245,158,11,0.12)',
    color: '#fcd34d',
  },
]

// ── Skeleton shimmer ──────────────────────────────────────────────────────────

function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded bg-slate-700/40 ${className}`}
      aria-hidden="true"
    />
  )
}

// ── Individual platform card ──────────────────────────────────────────────────

function PlatformCard({ platform, data, loading, isSource, onSave }) {
  const { key, label, Icon, bg, color } = platform
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const fullText = data
    ? data.hashtags
      ? `${data.body}\n\n${data.hashtags}`
      : data.body
    : ''

  async function handleCopy() {
    if (!fullText) return
    try {
      await navigator.clipboard.writeText(fullText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // fallback for older browsers
      const el = document.createElement('textarea')
      el.value = fullText
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  async function handleSave() {
    if (!data || saving || saved) return
    setSaving(true)
    try {
      await onSave(key, data)
      setSaved(true)
    } catch (err) {
      console.error('[RepurposeModal] Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="flex flex-col rounded-xl border border-slate-800/60 overflow-hidden"
      style={{ background: bg }}
    >
      {/* Card header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800/40">
        <Icon size={15} style={{ color }} />
        <span className="text-sm font-semibold" style={{ color }}>
          {label}
        </span>
        {isSource && (
          <span className="ml-auto text-xs text-slate-500 italic">source</span>
        )}
      </div>

      {/* Card body */}
      <div className="flex-1 px-4 py-3 min-h-[9rem]">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/6" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-3/6" />
          </div>
        ) : data ? (
          <div>
            <div
              className="max-h-40 overflow-y-auto text-sm text-slate-200 leading-relaxed whitespace-pre-wrap pr-1"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
            >
              {data.body}
            </div>
            {data.hashtags && (
              <p className="mt-2 text-xs leading-relaxed break-words" style={{ color: '#f9a8d4' }}>
                {data.hashtags}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic mt-2">
            {isSource ? 'This is the source platform.' : 'Generation failed. Please try again.'}
          </p>
        )}
      </div>

      {/* Action row */}
      {!loading && data && !isSource && (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-800/40">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-700/60 transition-colors"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                Copy
              </>
            )}
          </button>

          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-60"
            style={
              saved
                ? { background: 'rgba(52,211,153,0.15)', color: '#6ee7b7' }
                : { background: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }
            }
          >
            {saved ? (
              <>
                <Check size={12} />
                Saved!
              </>
            ) : (
              <>
                <BookmarkPlus size={12} />
                {saving ? 'Saving…' : 'Save as draft'}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main modal component ──────────────────────────────────────────────────────

export default function RepurposeModal({ post, onClose, onSaved }) {
  const [repurposed, setRepurposed] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const sourcePlatform = post?.platform?.toLowerCase() ?? null

  // Fetch repurposed content on mount
  useEffect(() => {
    if (!post) return

    let cancelled = false

    async function fetchRepurposed() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/content/repurpose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            body: post.body,
            hashtags: post.hashtags ?? null,
            sourcePlatform: post.platform ?? null,
          }),
        })

        const json = await res.json()

        if (!res.ok) {
          throw new Error(json.error ?? 'Repurposing failed')
        }

        if (!cancelled) {
          setRepurposed(json.repurposed)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message ?? 'Something went wrong')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchRepurposed()
    return () => { cancelled = true }
  }, [post])

  // Save a single repurposed version as a new draft post
  const handleSave = useCallback(async (platform, data) => {
    const res = await fetch('/api/content/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform,
        body: data.body,
        hashtags: data.hashtags ?? null,
        status: 'pending',
      }),
    })

    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Save failed')

    if (typeof onSaved === 'function') {
      onSaved(json)
    }
  }, [onSaved])

  // Close on backdrop click
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const truncatedBody = post?.body
    ? post.body.length > 200
      ? post.body.slice(0, 200) + '…'
      : post.body
    : ''

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Repurpose Post"
    >
      <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-800/60 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">Repurpose Post</h2>
            <p className="text-sm text-slate-400 mt-0.5">Adapt this content for every platform</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Original post preview */}
          <div className="rounded-xl border border-slate-800/50 bg-slate-900/40 px-4 py-3">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              Original · {post?.platform ?? 'Post'}
            </p>
            <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">
              {truncatedBody}
            </p>
          </div>

          {/* Error state */}
          {error && !loading && (
            <div className="rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Platform cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PLATFORMS.map((platform) => {
              const isSource = platform.key === sourcePlatform
              const cardData = repurposed ? repurposed[platform.key] : null

              if (platform.comingSoon) {
                return (
                  <div
                    key={platform.key}
                    className="flex flex-col rounded-xl border overflow-hidden opacity-50 pointer-events-none cursor-not-allowed"
                    style={{ background: platform.bg, borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800/40">
                      <platform.Icon size={15} style={{ color: platform.color }} />
                      <span className="text-sm font-semibold" style={{ color: platform.color }}>{platform.label}</span>
                      <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-500 border border-slate-600/40">SOON</span>
                    </div>
                    <div className="flex-1 px-4 py-3 min-h-[9rem] flex items-center justify-center">
                      <p className="text-xs text-slate-500 italic">Coming Soon</p>
                    </div>
                  </div>
                )
              }

              return (
                <PlatformCard
                  key={platform.key}
                  platform={platform}
                  data={cardData}
                  loading={loading}
                  isSource={isSource}
                  onSave={handleSave}
                />
              )
            })}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex justify-end px-6 py-4 border-t border-slate-800/60 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-700/60 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
