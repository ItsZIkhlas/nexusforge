'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Search, Zap, MapPin, Building2, Briefcase,
  Linkedin, Instagram, Facebook, Twitter,
  UserPlus, Check, AlertCircle, Loader2, ChevronLeft, ChevronRight,
  RefreshCw, Settings
} from 'lucide-react'

const PLATFORM_LIST = [
  { value: 'linkedin',  label: 'LinkedIn',   Icon: Linkedin,  color: 'text-blue-400' },
  { value: 'instagram', label: 'Instagram',  Icon: Instagram, color: 'text-pink-400', comingSoon: true },
  { value: 'facebook',  label: 'Facebook',   Icon: Facebook,  color: 'text-blue-500' },
  { value: 'twitter',   label: 'X / Twitter',Icon: Twitter,   color: 'text-sky-400'  },
]

function platformIcon(platform) {
  return PLATFORM_LIST.find(p => p.value === platform) ?? PLATFORM_LIST[0]
}

// ── Credit Bar ───────────────────────────────────────────────────────────────

function CreditBar({ credits, onRefresh }) {
  if (!credits) return null
  const { used, total, remaining, resetAt, planName } = credits
  const pct = Math.min(100, Math.round((used / total) * 100))
  const resetDate = resetAt
    ? new Date(resetAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  return (
    <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4" style={{ color: 'var(--primary-text)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>Lead Credits</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'var(--bg-card-hover)', color: 'var(--text-3)' }}
          >{planName}</span>
        </div>
        <div className="flex items-center gap-3">
          {resetDate && <span className="text-xs" style={{ color: 'var(--text-3)' }}>Resets {resetDate}</span>}
          <button
            onClick={onRefresh}
            className="p-1 rounded transition-colors"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-hover)'; e.currentTarget.style.color = 'var(--text-2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-full h-2" style={{ background: 'var(--border-strong)' }}>
          <div
            className={`h-2 rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-indigo-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="whitespace-nowrap text-right">
          <span className={`text-sm font-semibold ${pct >= 90 ? 'text-red-400' : pct >= 70 ? 'text-yellow-400' : ''}`}
            style={pct < 70 ? { color: 'var(--text-2)' } : undefined}
          >
            {used.toLocaleString()} <span className="font-normal" style={{ color: 'var(--text-3)' }}>used</span>
          </span>
          <span className="mx-1.5" style={{ color: 'var(--text-4)' }}>·</span>
          <span className="text-sm" style={{ color: 'var(--text-3)' }}>{remaining.toLocaleString()} left</span>
        </div>
      </div>
      {remaining === 0 && (
        <p className="text-xs text-red-400 mt-2">
          Credits exhausted —{' '}
          <Link href="/settings" className="underline hover:text-red-300">upgrade your plan</Link>
          {' '}or wait for the monthly reset.
        </p>
      )}
    </div>
  )
}

// ── Result Card ──────────────────────────────────────────────────────────────

function ResultCard({ result, onSave, saved, saving, enriched }) {
  const initials = `${result.first_name?.[0] ?? ''}${result.last_name?.[0] ?? ''}`.toUpperCase() || '?'
  const location = [result.city, result.state, result.country].filter(Boolean).join(', ')
  const plat     = platformIcon(result.platform)
  const profileUrl = result.profile_url ?? result.linkedin_url

  return (
    <div
      className="rounded-xl p-4 transition-all flex flex-col gap-3"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden"
          style={{
            background: 'var(--primary-dim)',
            border: '1px solid var(--primary-border)',
            color: 'var(--primary-text)',
          }}
        >
          {result.photo_url
            ? <img src={result.photo_url} alt="" className="w-10 h-10 object-cover" onError={e => { e.currentTarget.style.display='none' }} />
            : initials
          }
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
            {result.name || `${result.first_name} ${result.last_name}`.trim() || 'Unknown'}
          </p>
          {result.title && <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{result.title}</p>}
        </div>
        {profileUrl && (
          <a
            href={profileUrl} target="_blank" rel="noreferrer"
            onClick={e => e.stopPropagation()}
            className={`p-1.5 rounded transition-colors flex-shrink-0 hover:${plat.color}`}
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <plat.Icon className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {result.company && (
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-3)' }}>
          <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate font-medium" style={{ color: 'var(--text-2)' }}>{result.company}</span>
          {result.company_industry && (
            <span className="truncate" style={{ color: 'var(--text-4)' }}>· {result.company_industry}</span>
          )}
        </div>
      )}

      {location && (
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-3)' }}>
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{location}</span>
        </div>
      )}

      {result.email && (
        <div className="text-xs rounded px-2 py-1 truncate" style={{ color: 'var(--text-3)', background: 'var(--bg-card-hover)' }}>
          {result.email}
        </div>
      )}

      <button
        onClick={() => !saved && !saving && onSave(result)}
        disabled={saved || saving}
        className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all
          ${saved
            ? 'bg-green-900/40 border border-green-700/50 text-green-400 cursor-default'
            : saving
              ? 'cursor-wait'
              : 'hover:opacity-80'
          }`}
        style={saved ? undefined : saving
          ? { background: 'var(--bg-card-hover)', color: 'var(--text-3)' }
          : {
              background: 'var(--primary-dim)',
              border: '1px solid var(--primary-border)',
              color: 'var(--primary-text)',
            }
        }
      >
        {saved ? (
          <>
            <Check className="w-3.5 h-3.5" /> Saved to CRM
            {enriched && <span className="ml-1 text-green-500/60 text-[10px] font-normal">· email found</span>}
          </>
        ) : saving ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
        ) : (
          <><UserPlus className="w-3.5 h-3.5" /> Save to CRM</>
        )}
      </button>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

const COMPANY_SIZES = ['1-10','11-50','51-200','201-500','501-1000','1000+']

export default function LeadsPage() {
  const [credits, setCredits]               = useState(null)
  const [creditsLoading, setCreditsLoading] = useState(true)
  const [platform,    setPlatform]          = useState('linkedin')
  const [keyword,     setKeyword]           = useState('')
  const [titlesInput, setTitlesInput]       = useState('')
  const [location,    setLocation]          = useState('')
  const [industry,    setIndustry]          = useState('')
  const [companySize, setCompanySize]       = useState('')
  const [results,     setResults]           = useState([])
  const [pagination,  setPagination]        = useState(null)
  const [page,        setPage]              = useState(1)
  const [searching,   setSearching]         = useState(false)
  const [searchError, setSearchError]       = useState('')
  const [hasSearched, setHasSearched]       = useState(false)
  const [savedIds,      setSavedIds]        = useState(new Set())
  const [enrichedIds,   setEnrichedIds]     = useState(new Set())  // Icypeas found email
  const [savingId,      setSavingId]        = useState(null)
  const [saveError,     setSaveError]       = useState('')
  const [noKey,         setNoKey]           = useState(false)
  const [notActivated,  setNotActivated]    = useState(false)

  async function loadCredits() {
    setCreditsLoading(true)
    try {
      const res = await fetch('/api/leads/credits')
      if (res.ok) setCredits(await res.json())
    } finally { setCreditsLoading(false) }
  }

  useEffect(() => { loadCredits() }, [])

  async function handleSearch(e, overridePage) {
    if (e) e.preventDefault()
    setSearching(true)
    setSearchError('')
    setSaveError('')
    const currentPage = overridePage ?? page

    const titles = titlesInput.split(',').map(t => t.trim()).filter(Boolean)

    try {
      const res = await fetch('/api/leads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, titles, location, industry, companySize, platform, page: currentPage }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.error?.includes('SERPER_API_KEY')) setNoKey(true)
        else setSearchError(data.error ?? 'Search failed')
        return
      }
      // Provider not yet activated — show polished state, not an error
      if (data.not_activated) {
        setNotActivated(true)
        return
      }
      setNotActivated(false)
      setResults(data.results ?? [])
      setPagination(data.pagination ?? null)
      setHasSearched(true)
      setNoKey(false)
    } catch {
      setSearchError('Network error — please try again')
    } finally { setSearching(false) }
  }

  async function handleSave(result) {
    if (!credits || credits.remaining <= 0) {
      setSaveError('No credits remaining. Upgrade your plan or wait for the monthly reset.')
      return
    }
    setSaveError('')
    setSavingId(result.apollo_id)
    try {
      const res = await fetch('/api/leads/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      })
      const data = await res.json()
      if (!res.ok) { setSaveError(data.error ?? 'Failed to save'); return }
      setSavedIds(prev => new Set([...prev, result.apollo_id]))
      if (data.emailEnriched) {
        setEnrichedIds(prev => new Set([...prev, result.apollo_id]))
      }
      if (data.creditUsed && credits) {
        setCredits(c => c ? { ...c, used: c.used + 1, remaining: c.remaining - 1 } : c)
      }
    } catch {
      setSaveError('Network error — please try again')
    } finally { setSavingId(null) }
  }

  async function goToPage(newPage) {
    setPage(newPage)
    await handleSearch(null, newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <div className="px-4 py-6 sm:px-8 sm:py-10 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Search className="w-6 h-6" style={{ color: 'var(--primary-text)' }} />
              Lead Finder
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
              Search millions of business contacts. 1 credit per contact saved to CRM.
            </p>
          </div>
        </div>

        {!creditsLoading && <CreditBar credits={credits} onRefresh={loadCredits} />}

        {noKey && (
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-300">Serper API key not configured</p>
              <p className="text-xs text-yellow-500 mt-1">
                Add <code className="bg-yellow-900/40 px-1 rounded">SERPER_API_KEY=your_key</code> to{' '}
                <code className="bg-yellow-900/40 px-1 rounded">.env.local</code> and restart the server.
                Free key (2,500 searches/mo) at{' '}
                <a href="https://serper.dev" target="_blank" rel="noreferrer" className="underline hover:text-yellow-300">
                  serper.dev
                </a>.
              </p>
            </div>
          </div>
        )}

        {notActivated && (
          <div
            className="rounded-2xl p-10 mb-6 text-center"
            style={{ background: 'var(--primary-dim)', border: '1px solid var(--primary-border)' }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--primary-dim)', border: '1px solid var(--primary-border)' }}
            >
              <Search className="w-7 h-7" style={{ color: 'var(--primary-text)' }} />
            </div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>Lead Finder — Coming Soon</h2>
            <p className="text-sm max-w-sm mx-auto" style={{ color: 'var(--text-3)' }}>
              We're activating access to our contact database of 275M+ professionals.
              This feature will be available shortly.
            </p>
            <div className="mt-6 flex items-center justify-center gap-8 text-xs" style={{ color: 'var(--text-3)' }}>
              <span>✦ 275M+ contacts</span>
              <span>✦ Filter by role, location & industry</span>
              <span>✦ 1-click save to CRM</span>
            </div>
          </div>
        )}

        <div className={`grid grid-cols-1 lg:grid-cols-4 gap-6 ${notActivated ? 'hidden' : ''}`}>
          {/* Search filters sidebar */}
          <div className="lg:col-span-1">
            <form
              onSubmit={handleSearch}
              className="rounded-xl p-4 space-y-4 lg:sticky lg:top-6"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-2)' }}>
                <Settings className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
                Filters
              </h2>

              {/* Platform selector */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>Platform</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PLATFORM_LIST.map(({ value, label, Icon, color, comingSoon }) => (
                    comingSoon ? (
                      <div
                        key={value}
                        className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium opacity-50 cursor-not-allowed pointer-events-none"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-3)' }}
                      >
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        {label}
                        <span className="ml-auto text-[8px] font-semibold px-1 py-0.5 rounded-full bg-slate-700/60 text-slate-500 border border-slate-600/40">SOON</span>
                      </div>
                    ) : (
                      <button
                        key={value}
                        type="button"
                        onClick={() => { setPlatform(value); setResults([]); setHasSearched(false) }}
                        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                          platform === value ? color : ''
                        }`}
                        style={platform === value
                          ? { background: 'var(--bg-card-hover)', border: '1px solid var(--border-strong)' }
                          : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-3)' }
                        }
                      >
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        {label}
                      </button>
                    )
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>Keyword</label>
                <input type="text" placeholder="e.g. SaaS, e-commerce…" value={keyword}
                  onChange={e => setKeyword(e.target.value)} className="input" />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>Job Titles</label>
                <input type="text" placeholder="CEO, Founder, CMO" value={titlesInput}
                  onChange={e => setTitlesInput(e.target.value)} className="input" />
                <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>Comma-separated</p>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>Location</label>
                <input type="text" placeholder="New York, London…" value={location}
                  onChange={e => setLocation(e.target.value)} className="input" />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>Industry</label>
                <input type="text" placeholder="Software, Healthcare…" value={industry}
                  onChange={e => setIndustry(e.target.value)} className="input" />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>
                  Company Size
                  <span className="font-normal ml-1" style={{ color: 'var(--text-4)' }}>(approx.)</span>
                </label>
                <select value={companySize} onChange={e => setCompanySize(e.target.value)} className="input">
                  <option value="">Any size</option>
                  {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                </select>
              </div>

              <button
                type="submit"
                disabled={searching || (credits && credits.remaining <= 0)}
                className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {searching
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Searching…</>
                  : <><Search className="w-4 h-4" /> Search</>
                }
              </button>
            </form>
          </div>

          {/* Results panel */}
          <div className="lg:col-span-3">
            {searchError && (
              <div className="bg-red-900/20 border border-red-800 rounded-xl p-3 mb-4 flex items-center gap-2 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {searchError}
              </div>
            )}
            {saveError && (
              <div className="bg-red-900/20 border border-red-800 rounded-xl p-3 mb-4 flex items-center gap-2 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {saveError}
              </div>
            )}

            {!hasSearched && !searching && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--primary-dim)', border: '1px solid var(--primary-border)' }}
                >
                  <Search className="w-8 h-8" style={{ color: 'var(--primary-text)' }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-2)' }}>Find your ideal prospects</h3>
                <p className="text-sm max-w-sm" style={{ color: 'var(--text-3)' }}>
                  Search by keyword, job title, location, industry, or company size.
                  Save contacts directly to your CRM — 1 credit per contact.
                </p>
                <div className="mt-6 grid grid-cols-3 gap-3 text-xs" style={{ color: 'var(--text-3)' }}>
                  {[
                    { icon: Briefcase, label: 'Filter by role' },
                    { icon: Building2, label: 'Filter by company' },
                    { icon: MapPin,    label: 'Filter by location' },
                  ].map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center gap-1.5 rounded-lg p-3"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                    >
                      <Icon className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searching && (
              <div className="flex items-center justify-center py-24">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: 'var(--primary-text)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>Searching {platformIcon(platform).label} profiles…</p>
                </div>
              </div>
            )}

            {!searching && hasSearched && results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Search className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-4)' }} />
                <p className="font-medium" style={{ color: 'var(--text-3)' }}>No results found</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>Try broader search terms or remove some filters</p>
              </div>
            )}

            {!searching && results.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                    {pagination?.total ? `${pagination.total.toLocaleString()} results` : `${results.length} results`}
                    {pagination?.total_pages > 1 && (
                      <span className="ml-1" style={{ color: 'var(--text-4)' }}>— page {pagination.page} of {pagination.total_pages}</span>
                    )}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>1 credit per save</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {results.map(result => (
                    <ResultCard
                      key={result.apollo_id}
                      result={result}
                      saved={savedIds.has(result.apollo_id)}
                      saving={savingId === result.apollo_id}
                      enriched={enrichedIds.has(result.apollo_id)}
                      onSave={handleSave}
                    />
                  ))}
                </div>

                {pagination && pagination.total_pages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-8">
                    <button
                      onClick={() => goToPage(page - 1)}
                      disabled={page <= 1 || searching}
                      className="btn-secondary p-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm" style={{ color: 'var(--text-2)' }}>Page {page} of {pagination.total_pages}</span>
                    <button
                      onClick={() => goToPage(page + 1)}
                      disabled={page >= pagination.total_pages || searching}
                      className="btn-secondary p-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
