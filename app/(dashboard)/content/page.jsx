'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Sparkles, Settings2, Loader2, Check, Copy, Trash2,
  ThumbsUp, ThumbsDown, Linkedin, Send, CalendarDays,
  PenLine, CheckCircle2, AlertCircle, Clock, Camera,
  FileText, X, Video, Play, Download, RefreshCw,
  Wand2, ChevronRight, User, AlertTriangle, Film,
  Square, CheckSquare, XCircle, CalendarClock,
  Mic, TrendingUp, Repeat2, GitBranch, Library, FlaskConical,
  HelpCircle, Upload,
} from 'lucide-react'
import VideoScheduler  from './VideoScheduler'
import RepurposeModal  from './RepurposeModal'
import VoiceToPost     from './VoiceToPost'
import TrendPanel      from './TrendPanel'
import ContentFunnels  from './ContentFunnels'
import AssetsLibrary   from './AssetsLibrary'
import ExperimentsLab  from './ExperimentsLab'

// ─────────────────────────────────────────────────────────────────────────────
// Shared metadata — using inline style objects instead of Tailwind class strings
// ─────────────────────────────────────────────────────────────────────────────

function TikTokIcon({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
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
    style: { background: 'rgba(20,184,166,0.12)', color: '#5eead4', borderColor: 'rgba(20,184,166,0.3)' },
    Icon: TikTokIcon,
  },
  instagram: {
    label: 'Instagram (Coming Soon)',
    style: { background: 'rgba(236,72,153,0.12)', color: '#f9a8d4', borderColor: 'rgba(236,72,153,0.3)' },
    Icon: Camera,
  },
}

const STATUS_META = {
  pending:  { label: 'Pending',  style: { background: 'rgba(234,179,8,0.12)',   color: '#fde047', borderColor: 'rgba(234,179,8,0.3)'   } },
  approved: { label: 'Approved', style: { background: 'rgba(99,102,241,0.12)',  color: '#a5b4fc', borderColor: 'rgba(99,102,241,0.3)'  } },
  posted:   { label: 'Posted',   style: { background: 'rgba(16,185,129,0.12)',  color: '#6ee7b7', borderColor: 'rgba(16,185,129,0.3)'  } },
  rejected: { label: 'Rejected', style: { background: 'rgba(100,116,139,0.12)', color: '#94a3b8', borderColor: 'rgba(100,116,139,0.3)' } },
}

const VIDEO_STATUS = {
  draft:      { label: 'Draft',      style: { background: 'rgba(100,116,139,0.12)', color: '#94a3b8', borderColor: 'rgba(100,116,139,0.3)' } },
  generating: { label: 'Generating', style: { background: 'rgba(234,179,8,0.12)',   color: '#fde047', borderColor: 'rgba(234,179,8,0.3)'   } },
  ready:      { label: 'Ready',      style: { background: 'rgba(16,185,129,0.12)',  color: '#6ee7b7', borderColor: 'rgba(16,185,129,0.3)'  } },
  failed:     { label: 'Failed',     style: { background: 'rgba(244,63,94,0.12)',   color: '#fda4af', borderColor: 'rgba(244,63,94,0.3)'   } },
}

// ─────────────────────────────────────────────────────────────────────────────
// Posts Tab components
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, iconStyle }) {
  return (
    <div
      className="flex-1 rounded-xl p-4"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
          {label}
        </p>
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={iconStyle.bg}
        >
          <Icon className="w-3 h-3" style={{ color: iconStyle.color }} />
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>{value}</p>
    </div>
  )
}

function PostCard({
  post, editingId, editBody, setEditBody,
  copiedId, actionId,
  onEdit, onCancelEdit, onSaveEdit,
  onCopy, onStatus, onDelete, onPublish,
  selected, onToggleSelect,
  onRepurpose,
}) {
  const pm = PLATFORM_META[post.platform] ?? {
    label: post.platform ?? 'Post',
    style: { background: 'rgba(100,116,139,0.12)', color: '#94a3b8', borderColor: 'rgba(100,116,139,0.3)' },
    Icon: FileText,
  }
  const sm = STATUS_META[post.status]     ?? STATUS_META.pending
  const isEditing  = editingId === post.id
  const isActing   = actionId  === post.id
  const isPending  = post.status === 'pending'

  return (
    <div
      className="rounded-xl overflow-hidden transition-colors"
      style={{
        background: 'var(--bg-card)',
        border: selected
          ? '1px solid rgba(16,185,129,0.4)'
          : '1px solid var(--border)',
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {/* Checkbox — only for pending posts */}
          {isPending && (
            <button
              onClick={() => onToggleSelect(post.id)}
              className="flex items-center justify-center shrink-0 transition-colors"
              style={{ color: selected ? '#6ee7b7' : 'var(--text-4)', marginRight: '2px' }}
              onMouseEnter={e => { if (!selected) e.currentTarget.style.color = 'var(--text-2)' }}
              onMouseLeave={e => { if (!selected) e.currentTarget.style.color = 'var(--text-4)' }}
              title={selected ? 'Deselect' : 'Select for bulk action'}
            >
              {selected
                ? <CheckSquare className="w-4 h-4" />
                : <Square className="w-4 h-4" />}
            </button>
          )}
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border"
            style={pm.style}
          >
            <pm.Icon className="w-3 h-3" />{pm.label}
          </span>
          <span
            className="inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full border"
            style={sm.style}
          >
            {sm.label}
          </span>
          {post.week_of && (
            <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-4)' }}>
              <CalendarDays className="w-3 h-3" />Week of {post.week_of}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onRepurpose(post)} title="Repurpose for other platforms"
            className="p-1.5 rounded-md transition-all"
            style={{ color: 'var(--text-4)' }}
            onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}
          >
            <Repeat2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onCopy(post)} title="Copy"
            className="p-1.5 rounded-md transition-all"
            style={{ color: 'var(--text-4)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}
          >
            {copiedId === post.id
              ? <Check className="w-3.5 h-3.5" style={{ color: '#6ee7b7' }} />
              : <Copy className="w-3.5 h-3.5" />}
          </button>
          {post.status !== 'posted' && (
            <button
              onClick={() => isEditing ? onCancelEdit() : onEdit(post)}
              className="p-1.5 rounded-md transition-all"
              style={{ color: 'var(--text-4)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}
            >
              {isEditing ? <X className="w-3.5 h-3.5" /> : <PenLine className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      <div className="px-5 py-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editBody}
              onChange={e => setEditBody(e.target.value)}
              rows={7}
              className="input resize-none"
              style={{ fontSize: '14px', lineHeight: '1.6' }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => onSaveEdit(post.id)} disabled={isActing}
                className="btn-primary flex items-center gap-1.5 px-3.5 py-1.5 text-xs disabled:opacity-60"
              >
                {isActing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Save changes
              </button>
              <button
                onClick={onCancelEdit}
                className="btn-secondary px-3.5 py-1.5 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-2)' }}>
              {post.body}
            </p>
            {post.hashtags && (
              <p className="text-xs mt-3 leading-relaxed font-medium" style={{ color: 'rgba(236,72,153,0.6)' }}>
                {post.hashtags}
              </p>
            )}
          </>
        )}
      </div>

      {/* ── Pending: Approve / Reject ──────────────────────────────────────── */}
      {post.status === 'pending' && !isEditing && (
        <div
          className="flex items-center gap-2 px-5 py-3.5"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-panel)' }}
        >
          <button
            onClick={() => onStatus(post.id, 'approved')} disabled={isActing}
            className="flex items-center gap-1.5 px-4 py-2 text-white text-[12px] font-semibold rounded-lg transition-colors disabled:opacity-60"
            style={{ background: 'rgba(16,185,129,0.8)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.8)'}
          >
            {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5" />}
            Approve
          </button>
          <button
            onClick={() => onStatus(post.id, 'rejected')} disabled={isActing}
            className="btn-secondary flex items-center gap-1.5 px-3.5 py-2 text-[12px]"
          >
            <ThumbsDown className="w-3.5 h-3.5" /> Reject
          </button>
          <button
            onClick={() => onDelete(post.id)}
            className="ml-auto p-2 rounded-lg transition-all"
            style={{ color: 'var(--text-4)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fda4af'; e.currentTarget.style.background = 'rgba(244,63,94,0.05)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-4)'; e.currentTarget.style.background = 'transparent' }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Approved: Publish button ───────────────────────────────────────── */}
      {post.status === 'approved' && !isEditing && (
        <div
          className="flex items-center gap-2 px-5 py-3.5"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-panel)' }}
        >
          {post.platform === 'linkedin' && (
            <button
              onClick={() => onPublish(post)} disabled={isActing}
              className="flex items-center gap-1.5 px-4 py-2 text-white text-[12px] font-semibold rounded-lg transition-colors disabled:opacity-60"
              style={{ background: 'rgba(14,165,233,0.8)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(14,165,233,1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(14,165,233,0.8)'}
            >
              {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Linkedin className="w-3.5 h-3.5" />}
              Publish to LinkedIn
            </button>
          )}
          {post.platform === 'tiktok' && (
            <button
              onClick={() => onPublish(post)} disabled={isActing}
              className="flex items-center gap-1.5 px-4 py-2 text-white text-[12px] font-semibold rounded-lg transition-colors disabled:opacity-60"
              style={{ background: 'rgba(20,184,166,0.8)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(20,184,166,1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(20,184,166,0.8)'}
            >
              {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TikTokIcon className="w-3.5 h-3.5" />}
              Copy & Mark Posted
            </button>
          )}
          <button
            onClick={() => onDelete(post.id)}
            className="ml-auto p-2 rounded-lg transition-all"
            style={{ color: 'var(--text-4)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fda4af'; e.currentTarget.style.background = 'rgba(244,63,94,0.05)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-4)'; e.currentTarget.style.background = 'transparent' }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Posted: success badge ──────────────────────────────────────────── */}
      {post.status === 'posted' && (
        <div className="mx-5 mb-4 flex items-center gap-2 text-[12px] font-medium" style={{ color: '#6ee7b7' }}>
          <CheckCircle2 className="w-3.5 h-3.5" />
          {post.platform === 'linkedin' ? 'Published to LinkedIn' : post.platform === 'tiktok' ? 'Copied & marked posted' : 'Posted'}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Bulk Action Bar
// ─────────────────────────────────────────────────────────────────────────────

function BulkActionBar({ selectedCount, allPendingSelected, onSelectAll, onClear, onApproveAll, onRejectAll, bulkLoading }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid rgba(16,185,129,0.25)',
        boxShadow: '0 0 0 1px rgba(16,185,129,0.08)',
      }}
    >
      {/* Select-all checkbox */}
      <button
        onClick={allPendingSelected ? onClear : onSelectAll}
        className="flex items-center justify-center transition-colors shrink-0"
        style={{ color: allPendingSelected ? '#6ee7b7' : 'var(--text-3)' }}
        onMouseEnter={e => e.currentTarget.style.color = allPendingSelected ? '#6ee7b7' : 'var(--text)'}
        onMouseLeave={e => e.currentTarget.style.color = allPendingSelected ? '#6ee7b7' : 'var(--text-3)'}
        title={allPendingSelected ? 'Deselect all' : 'Select all pending'}
      >
        {allPendingSelected
          ? <CheckSquare className="w-4 h-4" />
          : <Square className="w-4 h-4" />}
      </button>

      <p className="text-[13px] font-semibold flex-1" style={{ color: 'var(--text)' }}>
        {selectedCount} selected
      </p>

      <button
        onClick={onApproveAll}
        disabled={bulkLoading}
        className="flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-semibold rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: 'rgba(16,185,129,0.12)',
          color: '#6ee7b7',
          border: '1px solid rgba(16,185,129,0.3)',
        }}
        onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'rgba(16,185,129,0.2)' }}
        onMouseLeave={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'rgba(16,185,129,0.12)' }}
      >
        {bulkLoading === 'approve'
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <CheckCircle2 className="w-3.5 h-3.5" />}
        Approve All
      </button>

      <button
        onClick={onRejectAll}
        disabled={bulkLoading}
        className="flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-semibold rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: 'rgba(244,63,94,0.12)',
          color: '#fda4af',
          border: '1px solid rgba(244,63,94,0.3)',
        }}
        onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'rgba(244,63,94,0.2)' }}
        onMouseLeave={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'rgba(244,63,94,0.12)' }}
      >
        {bulkLoading === 'reject'
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <XCircle className="w-3.5 h-3.5" />}
        Reject All
      </button>

      <button
        onClick={onClear}
        className="text-[12px] transition-colors"
        style={{ color: 'var(--text-3)' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
      >
        Clear
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Video card
// ─────────────────────────────────────────────────────────────────────────────

function VideoCard({ video, onDelete, onPoll }) {
  const vs = VIDEO_STATUS[video.status] ?? VIDEO_STATUS.draft
  const pm = PLATFORM_META[video.platform] ?? PLATFORM_META.instagram
  const isGenerating = video.status === 'generating'

  return (
    <div
      className="rounded-xl overflow-hidden group transition-colors"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      {/* Thumbnail area */}
      <div
        className="relative w-full flex items-center justify-center overflow-hidden"
        style={{
          background: 'var(--bg-panel)',
          aspectRatio: video.platform === 'instagram' ? '9/16' : '16/9',
          maxHeight: '160px',
        }}
      >
        {video.thumbnail_url ? (
          <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2" style={{ color: 'var(--text-4)' }}>
            <Film className="w-8 h-8" />
          </div>
        )}
        {isGenerating && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            style={{ background: 'rgba(0,0,0,0.8)' }}
          >
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#fde047' }} />
            <p className="text-[11px] font-medium" style={{ color: '#fde047' }}>Generating…</p>
            <div className="w-24 h-0.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full animate-pulse" style={{ width: '60%', background: '#f59e0b' }} />
            </div>
          </div>
        )}
        {video.status === 'ready' && video.video_url && (
          <a
            href={video.video_url} target="_blank" rel="noopener noreferrer"
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            </div>
          </a>
        )}
        {video.status === 'failed' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5" style={{ background: 'rgba(0,0,0,0.8)' }}>
            <AlertTriangle className="w-5 h-5" style={{ color: '#fda4af' }} />
            <p className="text-[11px] font-medium" style={{ color: '#fda4af' }}>Failed</p>
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="text-[13px] font-semibold leading-snug line-clamp-2 mb-2" style={{ color: 'var(--text)' }}>
          {video.title || 'Untitled video'}
        </p>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border" style={pm.style}>
            <pm.Icon className="w-2.5 h-2.5" />{pm.label}
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border" style={vs.style}>
            {vs.label}
          </span>
          {video.duration_secs && (
            <span className="text-[10px]" style={{ color: 'var(--text-4)' }}>{video.duration_secs}s</span>
          )}
        </div>

        {video.avatar_name && (
          <div className="flex items-center gap-1.5 mb-3">
            <User className="w-3 h-3" style={{ color: 'var(--text-4)' }} />
            <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>{video.avatar_name}</span>
          </div>
        )}

        {video.error_msg && (
          <p
            className="text-[11px] mb-3 rounded-lg px-2.5 py-1.5"
            style={{ color: '#fda4af', background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.2)' }}
          >
            {video.error_msg}
          </p>
        )}

        <div className="flex items-center gap-1.5">
          {video.status === 'ready' && video.video_url && (
            <a
              href={video.video_url} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-white text-[11px] font-semibold rounded-lg transition-colors"
              style={{ background: 'rgba(16,185,129,0.8)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.8)'}
            >
              <Download className="w-3 h-3" /> Download
            </a>
          )}
          {isGenerating && (
            <button
              onClick={() => onPoll(video.id)}
              className="btn-secondary flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px]"
            >
              <RefreshCw className="w-3 h-3" /> Check status
            </button>
          )}
          <button
            onClick={() => onDelete(video.id)}
            className="p-1.5 rounded-lg transition-all"
            style={{ color: 'var(--text-4)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fda4af'; e.currentTarget.style.background = 'rgba(244,63,94,0.05)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-4)'; e.currentTarget.style.background = 'transparent' }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// New Video Panel (modal) — Runway
// ─────────────────────────────────────────────────────────────────────────────

function NewVideoPanel({ onClose, onCreated }) {
  const [topic,      setTopic]      = useState('')
  const [prompt,     setPrompt]     = useState('')
  const [platform,   setPlatform]   = useState('tiktok')
  const [duration,   setDuration]   = useState(10)
  const [imageFile,  setImageFile]  = useState(null)
  const [imageUrl,   setImageUrl]   = useState('')
  const [uploading,  setUploading]  = useState(false)
  const [generating, setGenerating] = useState(false)
  const [promptLoading, setPromptLoading] = useState(false)
  const [error,      setError]      = useState('')
  const imgRef = useRef(null)

  const ratio = platform === 'tiktok' ? '9:16' : '16:9'

  async function handleImageSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setUploading(true); setError('')
    const form = new FormData()
    form.append('file', file)
    const res  = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await res.json()
    setUploading(false)
    if (res.ok) setImageUrl(data.url)
    else setError(data.error ?? 'Image upload failed')
  }

  async function generatePrompt() {
    if (!topic.trim()) { setError('Enter a topic first.'); return }
    setPromptLoading(true); setError('')
    const res  = await fetch('/api/content/videos/script', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ topic, platform }),
    })
    const data = await res.json()
    setPromptLoading(false)
    if (res.ok) setPrompt(data.script ?? '')
    else setError(data.error ?? 'Prompt generation failed')
  }

  async function handleGenerate() {
    if (!imageUrl) { setError('Upload a reference image — Runway requires one.'); return }
    if (!topic.trim() && !prompt.trim()) { setError('Enter a topic or prompt.'); return }
    setGenerating(true); setError('')
    const res  = await fetch('/api/content/videos', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ topic, prompt, image_url: imageUrl, ratio, duration, platform }),
    })
    const data = await res.json()
    setGenerating(false)
    if (res.ok) onCreated(data)
    else setError(data.error ?? 'Video generation failed')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-soft)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}>
              <Video className="w-3.5 h-3.5" style={{ color: '#c4b5fd' }} />
            </div>
            <div>
              <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>New AI Video — Powered by Runway</p>
              <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>Upload an image · describe the scene · Runway animates it</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'transparent' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Platform */}
          <div>
            <label className="block text-[11px] font-medium mb-2" style={{ color: 'var(--text-3)' }}>Platform</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: 'tiktok',   label: 'TikTok',   sub: '9:16 vertical',   color: '#5eead4', activeBg: 'rgba(20,184,166,0.1)',  activeBorder: 'rgba(20,184,166,0.3)'  },
                { v: 'linkedin', label: 'LinkedIn',  sub: '16:9 landscape',  color: '#7dd3fc', activeBg: 'rgba(14,165,233,0.1)', activeBorder: 'rgba(14,165,233,0.3)'  },
              ].map(p => (
                <button key={p.v} type="button" onClick={() => setPlatform(p.v)}
                  className="flex items-center gap-2 p-3 rounded-xl border text-left transition-all"
                  style={platform === p.v
                    ? { background: p.activeBg, borderColor: p.activeBorder }
                    : { border: '1px solid var(--border)', background: 'var(--bg-panel)' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: platform === p.v ? p.color : 'var(--text-4)' }} />
                  <div>
                    <p className="text-[12px] font-semibold" style={{ color: platform === p.v ? 'var(--text)' : 'var(--text-2)' }}>{p.label}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>{p.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Reference image */}
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>
              Reference Image <span style={{ color: '#fda4af' }}>* required by Runway</span>
            </label>
            <input ref={imgRef} type="file" accept=".jpg,.jpeg,image/jpeg" className="hidden" onChange={handleImageSelect} />
            {imageUrl ? (
              <div className="relative w-full h-32 rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(139,92,246,0.4)' }}>
                <img src={imageUrl} alt="Reference" className="w-full h-full object-cover" />
                <button
                  onClick={() => { setImageUrl(''); setImageFile(null) }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.7)' }}
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ) : (
              <button onClick={() => imgRef.current?.click()} disabled={uploading}
                className="w-full flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed text-sm transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'; e.currentTarget.style.color = 'var(--text-2)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)' }}
              >
                {uploading
                  ? <><Loader2 className="w-5 h-5 animate-spin" /><span className="text-[12px]">Uploading…</span></>
                  : <><Upload className="w-5 h-5" /><span className="text-[12px]">Upload a JPG image (product, logo, brand photo)</span></>
                }
              </button>
            )}
            <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-4)' }}>
              Upload any image — your product, storefront, logo on a background, team photo — Runway will animate it.
            </p>
          </div>

          {/* Topic */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium" style={{ color: 'var(--text-3)' }}>Topic / Description</label>
              <button onClick={generatePrompt} disabled={promptLoading}
                className="flex items-center gap-1 text-[11px] transition-colors disabled:opacity-50"
                style={{ color: '#c4b5fd' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ddd6fe'}
                onMouseLeave={e => e.currentTarget.style.color = '#c4b5fd'}
              >
                {promptLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                {promptLoading ? 'Generating…' : 'AI Generate Prompt'}
              </button>
            </div>
            <input
              type="text" value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="e.g. coffee shop morning atmosphere, gym transformation, law firm intro…"
              className="input"
              style={{ fontSize: '13px' }}
            />
          </div>

          {/* Prompt (optional override) */}
          {prompt && (
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>
                Runway Prompt <span className="font-normal opacity-60">(cinematic description — edit if needed, max 400 chars)</span>
              </label>
              <textarea
                rows={3} value={prompt} onChange={e => setPrompt(e.target.value)}
                className="input resize-none"
                style={{ fontSize: '12px', lineHeight: '1.6' }}
              />
            </div>
          )}

          {/* Duration */}
          <div>
            <label className="block text-[11px] font-medium mb-2" style={{ color: 'var(--text-3)' }}>Duration</label>
            <div className="flex gap-2">
              {[5, 10].map(d => (
                <button key={d} type="button" onClick={() => setDuration(d)}
                  className="flex-1 py-2 rounded-lg text-[12px] font-medium transition-all border"
                  style={duration === d
                    ? { background: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.4)', color: '#c4b5fd' }
                    : { background: 'var(--bg-panel)', borderColor: 'var(--border)', color: 'var(--text-3)' }}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-[12px] flex items-center gap-1.5" style={{ color: '#fda4af' }}>
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
            </p>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating || uploading || !imageUrl}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-white text-[13px] font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'rgba(139,92,246,0.85)' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'rgba(139,92,246,1)' }}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.85)'}
          >
            {generating
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting to Runway…</>
              : <><Sparkles className="w-4 h-4" /> Generate Video</>}
          </button>

          <p className="text-center text-[10px]" style={{ color: 'var(--text-4)' }}>
            Runway takes 1–3 minutes to render. You can close this and check back — it will appear in your video list.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

const POST_FILTERS = ['pending', 'approved', 'posted', 'all']

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState('posts')

  // Posts state
  const [posts,      setPosts]      = useState([])
  const [brand,      setBrand]      = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [generating, setGenerating] = useState(false)
  const [filter,     setFilter]     = useState('pending')
  const [editingId,  setEditingId]  = useState(null)
  const [editBody,   setEditBody]   = useState('')
  const [copiedId,   setCopiedId]   = useState(null)
  const [actionId,   setActionId]   = useState(null)
  const [genError,   setGenError]   = useState('')

  // Bulk selection state
  const [selectedIds,  setSelectedIds]  = useState(new Set())
  const [bulkLoading,  setBulkLoading]  = useState(null) // 'approve' | 'reject' | null

  // Videos state
  const [videos,        setVideos]        = useState([])
  const [videosLoaded,  setVideosLoaded]  = useState(false)
  const [videosLoading, setVideosLoading] = useState(false)

  // Scheduler state
  const [socialConnections, setSocialConnections] = useState([])
  const [schedulerLoaded,   setSchedulerLoaded]   = useState(false)
  const [showNewVideo,   setShowNewVideo]   = useState(false)
  const [hasRunwayKey,   setHasRunwayKey]   = useState(false)
  const [repurposePost,  setRepurposePost]  = useState(null)
  const [showVoice,      setShowVoice]      = useState(false)
  const [showHelp,       setShowHelp]       = useState(false)
  const [showTrends,     setShowTrends]     = useState(false)
  const [libView,        setLibView]        = useState('library') // 'library' | 'experiments'

  useEffect(() => { loadPosts() }, [])
  useEffect(() => { if (activeTab === 'videos' && !videosLoaded) loadVideos() }, [activeTab])
  useEffect(() => {
    if (activeTab === 'videos' && !schedulerLoaded) {
      fetch('/api/social-connections').then(r => r.ok ? r.json() : []).then(d => {
        setSocialConnections(Array.isArray(d) ? d : [])
        setSchedulerLoaded(true)
      })
    }
  }, [activeTab, schedulerLoaded])

  // Clear selection when filter changes
  useEffect(() => { setSelectedIds(new Set()) }, [filter])

  async function loadPosts() {
    setLoading(true)
    const [postsRes, brandRes] = await Promise.all([
      fetch('/api/content/posts'),
      fetch('/api/content/brand'),
    ])
    const [postsData, brandData] = await Promise.all([postsRes.json(), brandRes.json()])
    setPosts(Array.isArray(postsData) ? postsData : [])
    setBrand(brandData)
    setHasRunwayKey(!!brandData?.runway_api_key)
    setLoading(false)
  }

  async function loadVideos() {
    setVideosLoading(true)
    const res  = await fetch('/api/content/videos')
    const data = await res.json()
    const all  = Array.isArray(data) ? data : []
    // Silently remove failed videos from DB
    all.filter(v => v.status === 'failed').forEach(v =>
      fetch(`/api/content/videos/${v.id}`, { method: 'DELETE' })
    )
    setVideos(all.filter(v => v.status !== 'failed'))
    setVideosLoaded(true)
    setVideosLoading(false)
  }

  async function handleGenerate() {
    setGenerating(true); setGenError('')
    const res  = await fetch('/api/content/generate', { method: 'POST' })
    const data = await res.json()
    setGenerating(false)
    if (res.ok) { setFilter('pending'); await loadPosts() }
    else setGenError(data.error ?? 'Generation failed. Please try again.')
  }

  async function handleStatus(id, status) {
    setActionId(id)
    const res  = await fetch(`/api/content/posts/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    setActionId(null)
    if (res.ok) setPosts(prev => prev.map(p => p.id === id ? data : p))
  }

  async function handleDeletePost(id) {
    await fetch(`/api/content/posts/${id}`, { method: 'DELETE' })
    setPosts(prev => prev.filter(p => p.id !== id))
    setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next })
  }

  async function handleSaveEdit(id) {
    setActionId(id)
    const res  = await fetch(`/api/content/posts/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: editBody }),
    })
    const data = await res.json()
    setActionId(null)
    if (res.ok) { setPosts(prev => prev.map(p => p.id === id ? data : p)); setEditingId(null) }
  }

  function handleCopy(post) {
    const text = post.hashtags ? `${post.body}\n\n${post.hashtags}` : post.body
    navigator.clipboard.writeText(text)
    setCopiedId(post.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function handlePollVideo(id) {
    const res  = await fetch(`/api/content/videos/${id}`)
    const data = await res.json()
    if (res.ok) {
      if (data.status === 'failed') {
        // Auto-remove failed videos
        await fetch(`/api/content/videos/${id}`, { method: 'DELETE' })
        setVideos(prev => prev.filter(v => v.id !== id))
      } else {
        setVideos(prev => prev.map(v => v.id === id ? data : v))
      }
    }
  }

  async function handlePublish(post) {
    setActionId(post.id)
    if (post.platform === 'linkedin') {
      const res  = await fetch('/api/social/publish-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      })
      const data = await res.json()
      setActionId(null)
      if (res.ok) setPosts(prev => prev.map(p => p.id === post.id ? data : p))
      else alert(data.error ?? 'Publish failed. Check your LinkedIn connection in Settings.')
    } else {
      // TikTok: copy caption then mark as posted
      const text = post.hashtags ? `${post.body}\n\n${post.hashtags}` : post.body
      navigator.clipboard.writeText(text)
      const res  = await fetch(`/api/content/posts/${post.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'posted' }),
      })
      const data = await res.json()
      setActionId(null)
      if (res.ok) setPosts(prev => prev.map(p => p.id === post.id ? data : p))
    }
  }

  async function handleDeleteVideo(id) {
    await fetch(`/api/content/videos/${id}`, { method: 'DELETE' })
    setVideos(prev => prev.filter(v => v.id !== id))
  }

  // ── Bulk selection helpers ──────────────────────────────────────────────────

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // All pending posts on the current filtered view
  const pendingInView = filtered => filtered.filter(p => p.status === 'pending')

  function selectAllPending(filteredPosts) {
    const ids = filteredPosts.filter(p => p.status === 'pending').map(p => p.id)
    setSelectedIds(new Set(ids))
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  async function handleBulkAction(status) {
    if (selectedIds.size === 0) return
    const actionKey = status === 'approved' ? 'approve' : 'reject'
    setBulkLoading(actionKey)
    const res = await fetch('/api/content/posts/bulk', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ids: Array.from(selectedIds), status }),
    })
    const data = await res.json()
    setBulkLoading(null)
    if (res.ok && Array.isArray(data.updated)) {
      // Merge updated posts back into state
      const updatedMap = Object.fromEntries(data.updated.map(p => [p.id, p]))
      setPosts(prev => prev.map(p => updatedMap[p.id] ?? p))
    }
    setSelectedIds(new Set())
  }

  const filtered     = posts.filter(p => filter === 'all' || p.status === filter)
  const pendingCount = posts.filter(p => p.status === 'pending').length
  const hasBrand     = !!brand?.business_name
  const stats = {
    pending:  posts.filter(p => p.status === 'pending').length,
    approved: posts.filter(p => p.status === 'approved').length,
    posted:   posts.filter(p => p.status === 'posted').length,
  }

  // Derived bulk selection info
  const pendingPostsInView  = filtered.filter(p => p.status === 'pending')
  const allPendingSelected  = pendingPostsInView.length > 0 && pendingPostsInView.every(p => selectedIds.has(p.id))
  const someSelected        = selectedIds.size > 0

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--primary-text)' }} />
    </div>
  )

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: 'var(--bg-page)' }}>
      <div className="max-w-3xl mx-auto">

        {/* ── Page header ────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.25)' }}>
                <PenLine className="w-4 h-4" style={{ color: '#f9a8d4' }} />
              </div>
              <span className="section-label">Content Studio</span>
            </div>
            <h1 className="text-[22px] font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
              {{ posts: 'Posts', videos: 'Videos', funnels: 'Content Funnels', library: 'Library' }[activeTab]}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
              {{
                posts:   'AI generates your weekly posts — review, approve, and publish.',
                videos:  'Generate Runway AI videos and schedule them to TikTok or LinkedIn.',
                funnels: 'Guide your audience from Awareness → Education → Social Proof → CTA.',
                library: 'Search, reuse, and A/B test all your saved content.',
              }[activeTab]}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <Link href="/content/brand" className="btn-secondary flex items-center gap-1.5 px-3.5 py-2 text-[13px]">
              <Settings2 className="w-3.5 h-3.5" /> Brand Setup
            </Link>
            {activeTab === 'posts' && (<>
              <button
                onClick={() => setShowTrends(v => !v)}
                className="btn-secondary flex items-center gap-1.5 px-3.5 py-2 text-[13px]"
                style={showTrends ? { color: 'var(--text)', background: 'var(--bg-hover)' } : {}}
              >
                <TrendingUp className="w-3.5 h-3.5" /> Trending
              </button>
              <button
                onClick={() => setShowVoice(true)} disabled={!hasBrand}
                title={!hasBrand ? 'Complete your brand setup first' : ''}
                className="btn-secondary flex items-center gap-1.5 px-3.5 py-2 text-[13px]"
              >
                <Mic className="w-3.5 h-3.5" /> Voice
              </button>
              <button
                onClick={handleGenerate} disabled={generating || !hasBrand}
                title={!hasBrand ? 'Complete your brand setup first' : ''}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-[13px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'rgba(236,72,153,0.85)' }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'rgba(236,72,153,1)' }}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(236,72,153,0.85)'}
              >
                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Generate This Week
              </button>
            </>)}
            {activeTab === 'videos' && (
              <button
                onClick={() => setShowNewVideo(true)} disabled={!hasRunwayKey}
                title={!hasRunwayKey ? 'Add your Runway API key in Brand Setup first' : ''}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-[13px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'rgba(139,92,246,0.85)' }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'rgba(139,92,246,1)' }}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.85)'}
              >
                <Video className="w-3.5 h-3.5" /> New Video
              </button>
            )}
          </div>
        </div>

        {/* ── Tab switcher ───────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-6 min-w-0">
          <div
            className="flex items-center gap-0.5 p-1 rounded-lg overflow-x-auto shrink-0 max-w-full"
            style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', scrollbarWidth: 'none' }}
          >
            {[
              { id: 'posts',   label: 'Posts',   Icon: PenLine,    badge: pendingCount > 0 ? pendingCount : null },
              { id: 'videos',  label: 'Videos',  Icon: Video,      badge: null },
              { id: 'funnels', label: 'Funnels', Icon: GitBranch,  badge: null },
              { id: 'library', label: 'Library', Icon: Library,    badge: null },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all whitespace-nowrap shrink-0"
                style={activeTab === tab.id
                  ? { background: 'var(--bg-hover)', color: 'var(--text)' }
                  : { color: 'var(--text-3)' }
                }
              >
                <tab.Icon className="w-3 h-3 shrink-0" /> {tab.label}
                {tab.badge && (
                  <span className="ml-0.5 min-w-[16px] px-1 py-px text-white text-[9px] font-bold rounded-full leading-none text-center" style={{ background: '#f59e0b' }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowHelp(true)}
            title="What's in Content Studio?"
            className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full transition-colors"
            style={{ color: 'var(--text-3)', border: '1px solid var(--border)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--text-3)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            POSTS TAB
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'posts' && (
          <>
            {/* Trend Hijacker — inline toggle */}
            {showTrends && (
              <div className="mb-6 rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" style={{ color: '#f472b6' }} />
                    <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>Trend Hijacker</span>
                    <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>Real-time trending topics — turn any trend into a post instantly</span>
                  </div>
                  <button onClick={() => setShowTrends(false)} className="p-1 rounded-lg transition-colors" style={{ color: 'var(--text-3)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'transparent' }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4">
                  <TrendPanel brand={brand} onPostCreated={post => { setPosts(prev => [post, ...prev]); setShowTrends(false) }} />
                </div>
              </div>
            )}

            {!hasBrand && (
              <div
                className="flex items-start gap-3.5 p-4 mb-6 rounded-xl"
                style={{ background: 'var(--warning-dim)', border: '1px solid rgba(234,179,8,0.2)' }}
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#fde047' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold mb-0.5" style={{ color: 'var(--text)' }}>Brand profile not set up</p>
                  <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-3)' }}>
                    Tell NexusForge about your business, tone, and platforms so AI can generate content that sounds like you.
                  </p>
                </div>
                <Link
                  href="/content/brand"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-white text-[12px] font-semibold rounded-lg transition-colors shrink-0"
                  style={{ background: '#ca8a04' }}
                >
                  <Settings2 className="w-3 h-3" /> Set Up
                </Link>
              </div>
            )}

            {genError && (
              <div
                className="flex items-center gap-2.5 px-4 py-3 mb-6 rounded-xl"
                style={{ background: 'var(--danger-dim)', border: '1px solid rgba(244,63,94,0.2)' }}
              >
                <AlertCircle className="w-4 h-4 shrink-0" style={{ color: '#fda4af' }} />
                <p className="text-[13px] flex-1" style={{ color: '#fda4af' }}>{genError}</p>
                <button
                  onClick={() => setGenError('')}
                  style={{ color: '#fda4af' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex gap-3 mb-6">
              <StatCard label="Awaiting Review" value={stats.pending}  icon={Clock}        iconStyle={{ bg: { background: 'rgba(234,179,8,0.12)' },  color: '#fde047' }} />
              <StatCard label="Approved"        value={stats.approved} icon={CheckCircle2} iconStyle={{ bg: { background: 'rgba(99,102,241,0.12)' },  color: '#a5b4fc' }} />
              <StatCard label="Posted"          value={stats.posted}   icon={Send}         iconStyle={{ bg: { background: 'rgba(16,185,129,0.12)' },  color: '#6ee7b7' }} />
            </div>

            <div
              className="flex items-center gap-1 p-1 mb-6 rounded-lg w-fit"
              style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}
            >
              {POST_FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-4 py-1.5 rounded-md text-[12px] font-medium capitalize transition-all"
                  style={filter === f
                    ? { background: 'var(--bg-hover)', color: 'var(--text)' }
                    : { color: 'var(--text-3)' }
                  }
                >
                  {f === 'pending' && pendingCount > 0 ? `Pending (${pendingCount})` : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 rounded-xl" style={{ border: '1px dashed var(--border-soft)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: 'var(--bg-hover)' }}>
                  <FileText className="w-5 h-5" style={{ color: 'var(--text-4)' }} />
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-3)' }}>
                  {filter === 'pending' ? 'No posts awaiting approval' : `No ${filter} posts yet`}
                </p>
                {hasBrand && filter === 'pending' && (
                  <p className="text-[12px]" style={{ color: 'var(--text-4)' }}>Click &ldquo;Generate This Week&rdquo; to create your weekly content</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Bulk action bar — shown when ≥1 pending post is selected */}
                {someSelected && (
                  <BulkActionBar
                    selectedCount={selectedIds.size}
                    allPendingSelected={allPendingSelected}
                    onSelectAll={() => selectAllPending(filtered)}
                    onClear={clearSelection}
                    onApproveAll={() => handleBulkAction('approved')}
                    onRejectAll={() => handleBulkAction('rejected')}
                    bulkLoading={bulkLoading}
                  />
                )}

                {/* Header row with select-all — only shown on pending filter when there are pending posts */}
                {!someSelected && pendingPostsInView.length > 0 && (
                  <div className="flex items-center gap-2 px-1 mb-1">
                    <button
                      onClick={() => selectAllPending(filtered)}
                      className="flex items-center gap-1.5 text-[11px] transition-colors"
                      style={{ color: 'var(--text-4)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-3)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}
                    >
                      <Square className="w-3.5 h-3.5" />
                      Select all pending
                    </button>
                  </div>
                )}

                {filtered.map(post => (
                  <PostCard
                    key={post.id} post={post}
                    editingId={editingId} editBody={editBody} setEditBody={setEditBody}
                    copiedId={copiedId} actionId={actionId}
                    onEdit={p => { setEditingId(p.id); setEditBody(p.body) }}
                    onCancelEdit={() => setEditingId(null)}
                    onSaveEdit={handleSaveEdit}
                    onCopy={handleCopy} onStatus={handleStatus} onDelete={handleDeletePost}
                    onPublish={handlePublish}
                    selected={selectedIds.has(post.id)}
                    onToggleSelect={toggleSelect}
                    onRepurpose={setRepurposePost}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════
            VIDEOS TAB
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'videos' && (
          <>
            {!hasRunwayKey && (
              <div
                className="flex items-start gap-3.5 p-4 mb-6 rounded-xl"
                style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}
              >
                <Video className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#c4b5fd' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold mb-0.5" style={{ color: 'var(--text)' }}>Connect your Runway account</p>
                  <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-3)' }}>
                    Add your Runway API key in Brand Setup to start generating AI videos for any brand.
                    Upload a reference image and Runway animates it into a cinematic video.
                  </p>
                </div>
                <Link
                  href="/content/brand"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-white text-[12px] font-semibold rounded-lg transition-colors shrink-0"
                  style={{ background: 'rgba(139,92,246,0.85)' }}
                >
                  <Settings2 className="w-3 h-3" /> Add Key
                </Link>
              </div>
            )}

            {videosLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-3)' }} />
              </div>
            ) : videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 rounded-xl" style={{ border: '1px dashed var(--border-soft)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: 'var(--bg-hover)' }}>
                  <Film className="w-5 h-5" style={{ color: 'var(--text-4)' }} />
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-3)' }}>No videos yet</p>
                {hasRunwayKey && (
                  <>
                    <p className="text-[12px] mb-4" style={{ color: 'var(--text-4)' }}>
                      Click &ldquo;New Video&rdquo; to generate your first AI avatar video
                    </p>
                    <button
                      onClick={() => setShowNewVideo(true)}
                      className="flex items-center gap-1.5 px-4 py-2 text-white text-[13px] font-semibold rounded-lg transition-colors"
                      style={{ background: 'rgba(139,92,246,0.85)' }}
                    >
                      <Video className="w-3.5 h-3.5" /> New Video
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {videos.map(video => (
                  <VideoCard key={video.id} video={video} onDelete={handleDeleteVideo} onPoll={handlePollVideo} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════
            FUNNELS TAB
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'funnels' && (
          <ContentFunnels brand={brand} />
        )}

        {/* ══════════════════════════════════════════════════════════════
            LIBRARY TAB — includes Experiments sub-section
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'library' && (
          <>
            {/* Sub-tab switcher */}
            <div className="flex items-center gap-1 p-1 mb-6 rounded-lg w-fit" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
              {[
                { id: 'library',     label: 'Library',     Icon: Library      },
                { id: 'experiments', label: 'Experiments', Icon: FlaskConical },
              ].map(v => (
                <button
                  key={v.id}
                  onClick={() => setLibView(v.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all"
                  style={libView === v.id
                    ? { background: 'var(--bg-hover)', color: 'var(--text)' }
                    : { color: 'var(--text-3)' }}
                >
                  <v.Icon className="w-3 h-3" /> {v.label}
                </button>
              ))}
            </div>
            {libView === 'library'     && <AssetsLibrary initialPosts={posts} />}
            {libView === 'experiments' && <ExperimentsLab />}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════
            AUTO SCHEDULER — shown inside Videos tab
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'videos' && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <CalendarClock className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
              <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>Auto Scheduler</h2>
              <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>— schedule videos to post automatically</span>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              {schedulerLoaded
                ? <VideoScheduler connections={socialConnections} />
                : <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--primary-text)' }} /></div>
              }
            </div>
          </div>
        )}

      </div>

      {showNewVideo && (
        <NewVideoPanel
          onClose={() => setShowNewVideo(false)}
          onCreated={v => { setVideos(prev => [v, ...prev]); setShowNewVideo(false) }}
        />
      )}

      {repurposePost && (
        <RepurposeModal
          post={repurposePost}
          onClose={() => setRepurposePost(null)}
          onSaved={post => setPosts(prev => [post, ...prev])}
        />
      )}

      {showVoice && (
        <VoiceToPost
          brand={brand}
          onClose={() => setShowVoice(false)}
          onCreated={post => { setPosts(prev => [post, ...prev]); setShowVoice(false) }}
        />
      )}

      {showHelp && <ContentHelpModal onClose={() => setShowHelp(false)} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Content Studio Help Modal
// ─────────────────────────────────────────────────────────────────────────────

const HELP_FEATURES = [
  {
    icon: PenLine,
    color: '#f9a8d4',
    bg: 'rgba(236,72,153,0.1)',
    title: 'Posts',
    desc: 'AI generates a full week of LinkedIn posts and TikTok content tailored to your brand voice, pillars, and audience. Review each draft, edit inline, approve the ones you love, and reject the rest — all in one place.',
  },
  {
    icon: Video,
    color: '#a5b4fc',
    bg: 'rgba(99,102,241,0.1)',
    title: 'AI Videos',
    desc: 'Create cinematic AI videos for any brand. Upload a reference image, write a prompt, and Runway generates a professional video. Works for restaurants, gyms, law firms — any industry.',
  },
  {
    icon: TrendingUp,
    color: '#6ee7b7',
    bg: 'rgba(16,185,129,0.1)',
    title: 'Trend Hijacker',
    desc: 'Fetches what\'s trending in your industry right now via real-time search. Click any trend and AI instantly writes a post that ties it back to your brand — so you\'re always part of the conversation.',
  },
  {
    icon: GitBranch,
    color: '#7dd3fc',
    bg: 'rgba(14,165,233,0.1)',
    title: 'Funnels',
    desc: 'Build multi-stage content sequences: Awareness → Education → Social Proof → CTA. Each stage holds posts that guide your audience from discovering you to buying from you. Great for product launches and campaigns.',
  },
  {
    icon: Library,
    color: '#fde047',
    bg: 'rgba(234,179,8,0.1)',
    title: 'Library',
    desc: 'Your master archive of all saved content across every platform and status. Search by keyword, filter by platform or tag, and clone any post as a new draft — so great content never goes to waste.',
  },
  {
    icon: FlaskConical,
    color: '#fda4af',
    bg: 'rgba(244,63,94,0.1)',
    title: 'Experiments',
    desc: 'A/B test your content ideas. Write two variants of a post, run them side by side, then declare a winner. The winning variant is automatically saved to your approved drafts, ready to schedule.',
  },
  {
    icon: CalendarClock,
    color: '#c4b5fd',
    bg: 'rgba(139,92,246,0.1)',
    title: 'Auto Scheduler',
    desc: 'Connect your LinkedIn or TikTok accounts and schedule videos to post automatically at the exact time you choose. Set it and forget it — NexusForgeForge publishes on your behalf.',
  },
  {
    icon: Mic,
    color: '#86efac',
    bg: 'rgba(34,197,94,0.1)',
    title: 'Voice to Post',
    desc: 'Hit the Voice button and speak your idea out loud. NexusForge transcribes your words and transforms them into a polished, on-brand post — no typing required. Perfect for capturing ideas on the go.',
  },
  {
    icon: Repeat2,
    color: '#fdba74',
    bg: 'rgba(249,115,22,0.1)',
    title: 'Repurpose',
    desc: 'Turn any approved post into content for every other platform with one click. A LinkedIn article becomes a TikTok caption, a thread, and a short-form video script — automatically adapted for each format.',
  },
]

function ContentHelpModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-[18px] font-bold mb-1" style={{ color: 'var(--text)' }}>Content Studio — Feature Guide</h2>
            <p className="text-[13px]" style={{ color: 'var(--text-3)' }}>Everything you can do inside Content Studio, explained.</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full transition-colors ml-4"
            style={{ color: 'var(--text-3)', background: 'var(--bg-panel)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {HELP_FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
            <div
              key={title}
              className="flex gap-3 p-4 rounded-xl"
              style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}
            >
              <div
                className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg"
                style={{ background: bg }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold mb-1" style={{ color: 'var(--text)' }}>{title}</p>
                <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-3)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-5 text-center text-[11px]" style={{ color: 'var(--text-3)' }}>
          Tip: Start with <strong style={{ color: 'var(--text-2)' }}>Brand Setup</strong> so every AI feature knows your voice, audience, and goals.
        </p>
      </div>
    </div>
  )
}
