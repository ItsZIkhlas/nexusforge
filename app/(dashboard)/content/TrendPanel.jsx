'use client'

import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, RefreshCw, Linkedin, Video, Check, Loader2 } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// TrendPanel — inline panel showing AI-curated trend cards with post creation
// Props: { brand, onPostCreated }
// ─────────────────────────────────────────────────────────────────────────────

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-[#0d1117] border border-slate-800/60 rounded-xl p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="w-6 h-3 bg-slate-800 rounded" />
        <div className="w-32 h-3.5 bg-slate-800 rounded" />
      </div>
      <div className="space-y-1.5">
        <div className="w-full h-2.5 bg-slate-800/70 rounded" />
        <div className="w-3/4 h-2.5 bg-slate-800/70 rounded" />
      </div>
      <div className="w-5/6 h-2 bg-indigo-900/40 rounded" />
      <div className="flex gap-2 pt-1">
        <div className="w-20 h-7 bg-slate-800 rounded-lg" />
        <div className="w-20 h-7 bg-slate-800 rounded-lg" />
      </div>
    </div>
  )
}

// ── Trend card ────────────────────────────────────────────────────────────────
function TrendCard({ trend, index, onPostCreated }) {
  const [loadingPlatform, setLoadingPlatform] = useState(null) // 'linkedin' | 'tiktok' | null
  const [confirmed,       setConfirmed]       = useState(false)
  const [error,           setError]           = useState(null)

  const createPost = async (platform) => {
    if (loadingPlatform) return
    setLoadingPlatform(platform)
    setError(null)

    try {
      const res = await fetch('/api/content/from-topic', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          topic:    `${trend.title}. ${trend.angle}`,
          platform,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to create post')

      setConfirmed(true)
      if (onPostCreated) onPostCreated(json.post)

      // Reset confirmation after 2s
      setTimeout(() => setConfirmed(false), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingPlatform(null)
    }
  }

  const num = String(index + 1).padStart(2, '0')

  return (
    <div className="bg-[#0d1117] border border-slate-800/60 rounded-xl p-4 flex flex-col gap-2.5 hover:border-slate-700/80 transition-colors">

      {/* Number + title */}
      <div className="flex items-start gap-2">
        <span className="font-mono text-[10px] text-slate-600 mt-0.5 flex-shrink-0 select-none">
          {num}
        </span>
        <h3 className="text-white font-semibold text-[14px] leading-snug">
          {trend.title}
        </h3>
      </div>

      {/* Context */}
      <p
        className="text-slate-500 text-[12px] leading-relaxed line-clamp-2"
        title={trend.context}
      >
        {trend.context}
      </p>

      {/* Suggested angle */}
      <p className="text-indigo-400 text-[11px] leading-snug">
        <span className="font-medium text-indigo-500">Suggested angle: </span>
        {trend.angle}
      </p>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-[11px] leading-tight bg-red-900/10 border border-red-800/30 rounded-lg px-2.5 py-1.5">
          {error}
        </p>
      )}

      {/* Create post buttons */}
      {confirmed ? (
        <div className="flex items-center gap-1.5 text-emerald-400 text-[12px] font-medium bg-emerald-900/15 border border-emerald-800/30 rounded-lg px-3 py-1.5">
          <Check className="w-3.5 h-3.5 flex-shrink-0" />
          Added to drafts
        </div>
      ) : (
        <div className="flex gap-2 flex-wrap">
          {/* LinkedIn button */}
          <button
            onClick={() => createPost('linkedin')}
            disabled={!!loadingPlatform}
            className={[
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium border transition-all duration-150',
              loadingPlatform === 'linkedin'
                ? 'bg-sky-900/20 text-sky-400 border-sky-800/40 cursor-wait'
                : loadingPlatform
                  ? 'bg-slate-800/40 text-slate-600 border-slate-700/40 cursor-not-allowed'
                  : 'bg-sky-900/10 text-sky-400 border-sky-800/30 hover:bg-sky-900/25 hover:border-sky-700/50',
            ].join(' ')}
          >
            {loadingPlatform === 'linkedin'
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <Linkedin className="w-3 h-3" />
            }
            LinkedIn
          </button>

          {/* TikTok button */}
          <button
            onClick={() => createPost('tiktok')}
            disabled={!!loadingPlatform}
            className={[
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium border transition-all duration-150',
              loadingPlatform === 'tiktok'
                ? 'bg-slate-800/40 text-slate-300 border-slate-700/40 cursor-wait'
                : loadingPlatform
                  ? 'bg-slate-800/40 text-slate-600 border-slate-700/40 cursor-not-allowed'
                  : 'bg-slate-800/30 text-slate-300 border-slate-700/40 hover:bg-slate-700/40 hover:border-slate-600/60',
            ].join(' ')}
          >
            {loadingPlatform === 'tiktok'
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <Video className="w-3 h-3" />
            }
            TikTok
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function TrendPanel({ brand, onPostCreated }) {
  const [trends,    setTrends]    = useState([])
  const [industry,  setIndustry]  = useState(brand?.industry ?? '')
  const [loading,   setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error,     setError]     = useState(null)

  const fetchTrends = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else           setLoading(true)
    setError(null)

    try {
      const res  = await fetch('/api/content/trends')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to load trends')
      setTrends(json.trends  ?? [])
      setIndustry(json.industry ?? brand?.industry ?? '')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [brand?.industry])

  // Fetch on mount
  useEffect(() => { fetchTrends() }, [fetchTrends])

  const displayIndustry = industry
    ? industry.charAt(0).toUpperCase() + industry.slice(1)
    : 'Your Industry'

  return (
    <section className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-base leading-tight">
              Trending in {displayIndustry}
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              AI-curated topics your audience is engaging with right now
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchTrends(true)}
          disabled={loading || refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 text-xs font-medium bg-slate-800/60 border border-slate-700/50 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          <RefreshCw className={['w-3.5 h-3.5', refreshing ? 'animate-spin' : ''].join(' ')} />
          Refresh
        </button>
      </div>

      {/* ── Error state ── */}
      {error && !loading && (
        <div className="bg-red-900/15 border border-red-800/40 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            onClick={() => fetchTrends()}
            className="text-xs underline underline-offset-2 flex-shrink-0 hover:text-red-300"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : trends.map((trend, i) => (
              <TrendCard
                key={i}
                trend={trend}
                index={i}
                onPostCreated={onPostCreated}
              />
            ))
        }
      </div>

      {/* Empty state (shouldn't normally appear) */}
      {!loading && !error && trends.length === 0 && (
        <div className="text-center py-12 text-slate-600 text-sm">
          No trends found. Try refreshing.
        </div>
      )}
    </section>
  )
}
