'use client'

import { useState, useMemo, useRef } from 'react'
import {
  Search, X, Copy, Check, Linkedin, Camera,
  GitFork, SlidersHorizontal, ChevronDown,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Shared metadata (mirrors page.jsx pattern)
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

const STATUS_META = {
  pending:  { label: 'Pending',  style: { background: 'rgba(234,179,8,0.12)',   color: '#fde047', borderColor: 'rgba(234,179,8,0.3)'   } },
  approved: { label: 'Approved', style: { background: 'rgba(99,102,241,0.12)',  color: '#a5b4fc', borderColor: 'rgba(99,102,241,0.3)'  } },
  posted:   { label: 'Posted',   style: { background: 'rgba(16,185,129,0.12)',  color: '#6ee7b7', borderColor: 'rgba(16,185,129,0.3)'  } },
  rejected: { label: 'Rejected', style: { background: 'rgba(100,116,139,0.12)', color: '#94a3b8', borderColor: 'rgba(100,116,139,0.3)' } },
}

const SORT_OPTIONS = [
  { value: 'newest',   label: 'Newest first' },
  { value: 'oldest',   label: 'Oldest first' },
  { value: 'platform', label: 'Platform' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────────────────────

function Toast({ message, visible }) {
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium pointer-events-none transition-all duration-300"
      style={{
        background: 'rgba(16,185,129,0.15)',
        border: '1px solid rgba(16,185,129,0.35)',
        color: '#6ee7b7',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(12px)',
      }}
    >
      <Check className="w-4 h-4" />
      {message}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter pill button
// ─────────────────────────────────────────────────────────────────────────────

function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 rounded-full text-xs font-medium transition-all"
      style={
        active
          ? { background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.4)' }
          : { background: 'rgba(255,255,255,0.03)', color: 'var(--text-3)', border: '1px solid var(--border)' }
      }
    >
      {label}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sort dropdown
// ─────────────────────────────────────────────────────────────────────────────

function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = SORT_OPTIONS.find(o => o.value === value)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border)',
          color: 'var(--text-2)',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        {current?.label}
        <ChevronDown className="w-3.5 h-3.5" style={{ opacity: 0.5 }} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden z-20 w-40 py-1"
            style={{ background: '#1a2233', border: '1px solid var(--border)' }}
          >
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className="w-full text-left px-3 py-2 text-xs transition-colors"
                style={{
                  color: opt.value === value ? '#a5b4fc' : 'var(--text-2)',
                  background: opt.value === value ? 'rgba(99,102,241,0.1)' : 'transparent',
                }}
                onMouseEnter={e => { if (opt.value !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                onMouseLeave={e => { if (opt.value !== value) e.currentTarget.style.background = 'transparent' }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Asset card
// ─────────────────────────────────────────────────────────────────────────────

function AssetCard({ post, onCloneDraft }) {
  const [copied, setCopied] = useState(false)
  const [cloning, setCloning] = useState(false)

  const pm = PLATFORM_META[post.platform] ?? PLATFORM_META.linkedin
  const sm = STATUS_META[post.status]     ?? STATUS_META.pending

  const formattedDate = post.created_at
    ? new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(post.body ?? '')
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  async function handleClone() {
    if (cloning) return
    setCloning(true)
    try {
      await onCloneDraft(post)
    } finally {
      setCloning(false)
    }
  }

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col transition-colors"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      {/* Header row */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border"
            style={pm.style}
          >
            <pm.Icon className="w-3 h-3" />
            {pm.label}
          </span>
          <span
            className="inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full border"
            style={sm.style}
          >
            {sm.label}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pt-3 pb-2 flex-1">
        <p
          className="text-sm leading-relaxed"
          style={{
            color: 'var(--text-2)',
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {post.body}
        </p>

        {post.hashtags && (
          <p
            className="mt-2 text-xs leading-relaxed"
            style={{
              color: '#f9a8d4',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {post.hashtags}
          </p>
        )}
      </div>

      {/* Footer row */}
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <span className="text-[11px]" style={{ color: 'var(--text-4)' }}>
          {formattedDate}
        </span>

        <div className="flex items-center gap-1.5">
          {/* Copy */}
          <button
            onClick={handleCopy}
            title="Copy post text"
            className="p-1.5 rounded-md transition-all"
            style={{ color: 'var(--text-4)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}
          >
            {copied
              ? <Check className="w-3.5 h-3.5" style={{ color: '#6ee7b7' }} />
              : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Clone as draft */}
          <button
            onClick={handleClone}
            disabled={cloning}
            title="Clone as draft"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all disabled:opacity-50"
            style={{
              background: 'rgba(99,102,241,0.12)',
              color: '#a5b4fc',
              border: '1px solid rgba(99,102,241,0.3)',
            }}
            onMouseEnter={e => { if (!cloning) e.currentTarget.style.background = 'rgba(99,102,241,0.2)' }}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.12)'}
          >
            <GitFork className="w-3 h-3" />
            {cloning ? 'Cloning…' : 'Clone as draft'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function AssetsLibrary({ initialPosts = [] }) {
  const [posts, setPosts]               = useState(initialPosts)
  const [search, setSearch]             = useState('')
  const [platformFilter, setPlatform]   = useState('all')
  const [statusFilter, setStatus]       = useState('all')
  const [sort, setSort]                 = useState('newest')
  const [toast, setToast]               = useState({ visible: false, message: '' })

  // ── Derived counts ──────────────────────────────────────────────────────
  const totalLinkedIn = posts.filter(p => p.platform === 'linkedin').length
  const totalTikTok   = posts.filter(p => p.platform === 'tiktok').length

  // ── Filtered + sorted posts ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...posts]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        (p.body ?? '').toLowerCase().includes(q) ||
        (p.hashtags ?? '').toLowerCase().includes(q)
      )
    }

    if (platformFilter !== 'all') {
      result = result.filter(p => p.platform === platformFilter)
    }

    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter)
    }

    if (sort === 'newest') {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    } else if (sort === 'oldest') {
      result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    } else if (sort === 'platform') {
      result.sort((a, b) => (a.platform ?? '').localeCompare(b.platform ?? ''))
    }

    return result
  }, [posts, search, platformFilter, statusFilter, sort])

  // ── Clone handler ────────────────────────────────────────────────────────
  async function handleCloneDraft(post) {
    try {
      const res = await fetch('/api/content/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body:     post.body,
          platform: post.platform,
          hashtags: post.hashtags ?? null,
          status:   'pending',
        }),
      })

      if (!res.ok) throw new Error('Failed to clone')

      const newPost = await res.json()

      // Optimistically add to local state so it appears in the library
      setPosts(prev => [newPost, ...prev])

      showToast('Added to drafts')
    } catch {
      showToast('Failed to clone — try again')
    }
  }

  function showToast(message) {
    setToast({ visible: true, message })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2800)
  }

  function clearFilters() {
    setSearch('')
    setPlatform('all')
    setStatus('all')
    setSort('newest')
  }

  const hasActiveFilters = search || platformFilter !== 'all' || statusFilter !== 'all'

  return (
    <>
      <div className="space-y-4">
        {/* ── Summary bar ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs" style={{ color: 'var(--text-4)' }}>
            <span style={{ color: 'var(--text-2)' }} className="font-medium">{posts.length}</span>
            {' '}posts{' · '}
            <span style={{ color: '#7dd3fc' }} className="font-medium">{totalLinkedIn}</span>
            {' '}LinkedIn{' · '}
            <span style={{ color: '#ffffff' }} className="font-medium">{totalTikTok}</span>
            {' '}TikTok
          </p>

          <SortDropdown value={sort} onChange={setSort} />
        </div>

        {/* ── Search bar ──────────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--text-4)' }} />
          <input
            type="text"
            placeholder="Search posts…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text)', caretColor: '#a5b4fc' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="p-0.5 rounded transition-colors"
              style={{ color: 'var(--text-4)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ── Filter pills ────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {['all', 'linkedin', 'tiktok'].map(p => (
              <FilterPill
                key={p}
                label={p === 'all' ? 'All platforms' : PLATFORM_META[p]?.label ?? p}
                active={platformFilter === p}
                onClick={() => setPlatform(p)}
              />
            ))}
          </div>

          <div
            className="w-px self-stretch"
            style={{ background: 'var(--border)' }}
          />

          <div className="flex items-center gap-1.5 flex-wrap">
            {['all', 'pending', 'approved', 'posted', 'rejected'].map(s => (
              <FilterPill
                key={s}
                label={s === 'all' ? 'All statuses' : STATUS_META[s]?.label ?? s}
                active={statusFilter === s}
                onClick={() => setStatus(s)}
              />
            ))}
          </div>
        </div>

        {/* ── Post grid ───────────────────────────────────────────────────── */}
        {filtered.length > 0 ? (
          <>
            <p className="text-[11px]" style={{ color: 'var(--text-4)' }}>
              Showing {filtered.length} of {posts.length} posts
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map(post => (
                <AssetCard
                  key={post.id}
                  post={post}
                  onCloneDraft={handleCloneDraft}
                />
              ))}
            </div>
          </>
        ) : (
          /* Empty state */
          <div
            className="flex flex-col items-center justify-center py-16 rounded-xl"
            style={{ border: '1px dashed var(--border)' }}
          >
            <Search className="w-8 h-8 mb-3" style={{ color: 'var(--text-4)' }} />
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-2)' }}>
              No posts match your filters
            </p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-4)' }}>
              Try adjusting your search or filter criteria
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: 'rgba(99,102,241,0.12)',
                  color: '#a5b4fc',
                  border: '1px solid rgba(99,102,241,0.3)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.12)'}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </>
  )
}
