'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Save, Loader2, Check, Linkedin,
  AlertCircle, CheckCircle2, Camera, Settings2, X, Video, Eye, EyeOff, ExternalLink,
} from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────────────────────

const TONES = [
  { value: 'professional', label: 'Professional', desc: 'Formal, authoritative, trustworthy'  },
  { value: 'casual',       label: 'Casual',       desc: 'Conversational, approachable, friendly' },
  { value: 'bold',         label: 'Bold',         desc: 'Confident, direct, no-nonsense'      },
  { value: 'friendly',     label: 'Friendly',     desc: 'Warm, encouraging, positive'          },
]

const INDUSTRIES = [
  'Marketing & Advertising', 'Technology & SaaS', 'E-commerce & Retail',
  'Real Estate', 'Finance & Accounting', 'Legal Services',
  'Health & Wellness', 'Coaching & Consulting', 'Hospitality & Food',
  'Construction & Trades', 'Education & Training', 'Other',
]

// ── Shared input class ────────────────────────────────────────────────────────

const INPUT = `w-full bg-slate-900 border border-slate-800/60 rounded-lg px-3.5 py-2.5
  text-sm text-white placeholder:text-slate-600
  focus:outline-none focus:ring-1 focus:ring-pink-500/50 focus:border-pink-500/40
  transition`

// ── Toggle component ──────────────────────────────────────────────────────────

function Toggle({ checked, onChange, color = 'bg-pink-600' }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${checked ? color : 'bg-slate-700'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ label, children }) {
  return (
    <div className="bg-[#0d1117] border border-slate-800/60 rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-800/60">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{label}</p>
      </div>
      <div className="px-5 py-5 space-y-4">
        {children}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BrandSetupPage() {
  const searchParams = useSearchParams()

  const [form, setForm] = useState({
    business_name:    '',
    industry:         '',
    description:      '',
    audience:         '',
    tone:             'professional',
    keywords_include: '',
    keywords_exclude: '',
    content_pillars:  [],
    positioning:      '',
    brand_mission:    '',
    platforms:        ['linkedin'],
    posts_per_week:   { linkedin: 2, tiktok: 3 },
    runway_api_key:   '',
  })

  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [error,        setError]        = useState('')
  const [linkedinName, setLinkedinName] = useState(null)
  const [showHeygenKey, setShowHeygenKey] = useState(false)

  const linkedinConnected = searchParams.get('linkedin_connected') === '1'
  const linkedinError     = searchParams.get('linkedin_error')

  useEffect(() => { load() }, [])

  async function load() {
    const res  = await fetch('/api/content/brand')
    const data = await res.json()
    if (data?.business_name) {
      setForm({
        business_name:    data.business_name ?? '',
        industry:         data.industry ?? '',
        description:      data.description ?? '',
        audience:         data.audience ?? '',
        tone:             data.tone ?? 'professional',
        keywords_include: (data.keywords_include ?? []).join(', '),
        keywords_exclude: (data.keywords_exclude ?? []).join(', '),
        content_pillars:  data.content_pillars ?? [],
        positioning:      data.positioning ?? '',
        brand_mission:    data.brand_mission ?? '',
        platforms:        data.platforms ?? ['linkedin'],
        posts_per_week:   data.posts_per_week ?? { linkedin: 2, tiktok: 3 },
        runway_api_key:   data.runway_api_key ?? '',
      })
      if (data.linkedin_name) setLinkedinName(data.linkedin_name)
    }
    setLoading(false)
  }

  function field(key) {
    return {
      value:    form[key],
      onChange: e => setForm(f => ({ ...f, [key]: e.target.value })),
    }
  }

  function toggle(platform) {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(platform)
        ? f.platforms.filter(p => p !== platform)
        : [...f.platforms, platform],
    }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true); setError(''); setSaved(false)

    const payload = {
      ...form,
      keywords_include: form.keywords_include.split(',').map(s => s.trim()).filter(Boolean),
      keywords_exclude: form.keywords_exclude.split(',').map(s => s.trim()).filter(Boolean),
      content_pillars:  form.content_pillars.filter(p => p.trim()),
      positioning:      form.positioning,
      brand_mission:    form.brand_mission,
    }

    const res  = await fetch('/api/content/brand', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    const data = await res.json()
    setSaving(false)

    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500) }
    else setError(data.error ?? 'Save failed')
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
    </div>
  )

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">

        {/* ── Page header ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/content"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Settings2 className="w-3.5 h-3.5 text-pink-400" />
              <span className="text-[11px] font-medium text-pink-400 uppercase tracking-widest">Content Studio</span>
            </div>
            <h1 className="text-xl font-semibold text-slate-100 tracking-tight">Brand Setup</h1>
            <p className="text-sm text-slate-500 mt-0.5">Set this up once — AI uses it for every post it writes</p>
          </div>
        </div>

        {/* ── OAuth toasts ─────────────────────────────────────────── */}
        {linkedinConnected && (
          <div className="flex items-center gap-3 px-4 py-3 mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-[13px] text-emerald-300 flex-1">
              LinkedIn connected — posts will auto-publish when you approve them.
            </p>
          </div>
        )}
        {linkedinError && (
          <div className="flex items-center gap-3 px-4 py-3 mb-6 rounded-xl border border-red-500/20 bg-red-500/5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-[13px] text-red-300 flex-1">
              LinkedIn connection failed: {linkedinError}. Please try again.
            </p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">

          {/* ── Business Info ───────────────────────────────────────── */}
          <Section label="Business Info">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                  Business Name <span className="text-pink-500">*</span>
                </label>
                <input
                  required
                  className={INPUT}
                  placeholder="Acme Corp"
                  {...field('business_name')}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Industry</label>
                <select
                  className={INPUT}
                  value={form.industry}
                  onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                >
                  <option value="">Select industry…</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                What does your business do? <span className="text-pink-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                className={INPUT + ' resize-none'}
                placeholder="We help small businesses automate their operations using AI tools…"
                {...field('description')}
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                Who is your target audience?
              </label>
              <input
                className={INPUT}
                placeholder="Small business owners aged 30–50, non-technical, UK-based…"
                {...field('audience')}
              />
            </div>
          </Section>

          {/* ── Brand Tone ──────────────────────────────────────────── */}
          <Section label="Brand Tone">
            <div className="grid grid-cols-2 gap-2.5">
              {TONES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, tone: t.value }))}
                  className={`text-left px-4 py-3.5 rounded-lg border transition-all ${
                    form.tone === t.value
                      ? 'bg-pink-500/10 border-pink-500/30 text-white'
                      : 'bg-slate-900 border-slate-800/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[13px] font-semibold">{t.label}</p>
                    {form.tone === t.value && (
                      <div className="w-4 h-4 rounded-full bg-pink-500 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">{t.desc}</p>
                </button>
              ))}
            </div>
          </Section>

          {/* ── Keywords ────────────────────────────────────────────── */}
          <Section label="Keywords">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                Always include
                <span className="ml-1.5 text-slate-600 font-normal">comma-separated</span>
              </label>
              <input
                className={INPUT}
                placeholder="automation, AI, small business, growth…"
                {...field('keywords_include')}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                Never use
                <span className="ml-1.5 text-slate-600 font-normal">comma-separated</span>
              </label>
              <input
                className={INPUT}
                placeholder="cheap, discount, hustle…"
                {...field('keywords_exclude')}
              />
            </div>
          </Section>

          {/* ── Personal Brand OS ───────────────────────────────────── */}
          <div className="bg-[#0d1117] border border-indigo-500/20 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-indigo-500/20 bg-indigo-500/5">
              <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest">Personal Brand OS</p>
            </div>
            <div className="px-5 py-5 space-y-5">

              {/* Content Pillars */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-0.5">
                  Content Pillars
                </label>
                <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                  The 3–5 core topics you always post about. AI will make sure every post ties back to one of these.
                </p>
                <div className="space-y-2">
                  {form.content_pillars.map((pillar, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg"
                      style={{
                        background: 'rgba(99,102,241,0.08)',
                        border: '1px solid rgba(99,102,241,0.25)',
                      }}
                    >
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ background: 'rgba(99,102,241,0.25)', color: '#a5b4fc' }}>
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={pillar}
                        onChange={e => {
                          const next = [...form.content_pillars]
                          next[idx] = e.target.value
                          setForm(f => ({ ...f, content_pillars: next }))
                        }}
                        placeholder={`Pillar ${idx + 1}…`}
                        className="flex-1 bg-transparent text-[13px] text-[#a5b4fc] placeholder:text-indigo-900
                          outline-none focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setForm(f => ({
                          ...f,
                          content_pillars: f.content_pillars.filter((_, i) => i !== idx),
                        }))}
                        className="text-indigo-600 hover:text-indigo-400 transition-colors shrink-0"
                        aria-label="Remove pillar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                {form.content_pillars.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, content_pillars: [...f.content_pillars, ''] }))}
                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium
                      text-indigo-400 hover:text-indigo-300 transition-colors"
                    style={{ border: '1px dashed rgba(99,102,241,0.35)' }}
                  >
                    <span className="text-base leading-none">+</span> Add pillar
                    {form.content_pillars.length > 0 && (
                      <span className="ml-1 text-indigo-700">{form.content_pillars.length}/5</span>
                    )}
                  </button>
                )}
                {form.content_pillars.length === 5 && (
                  <p className="mt-2 text-[11px] text-indigo-700">Maximum of 5 pillars reached.</p>
                )}
              </div>

              {/* Brand Positioning */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-0.5">
                  Brand Positioning
                  <span className="ml-1.5 text-slate-600 font-normal">One sentence</span>
                </label>
                <input
                  type="text"
                  className={INPUT}
                  placeholder="e.g. The only CRM built specifically for freelance consultants who hate admin work."
                  value={form.positioning}
                  onChange={e => setForm(f => ({ ...f, positioning: e.target.value }))}
                />
              </div>

              {/* Brand Mission */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-0.5">
                  Brand Mission
                  <span className="ml-1.5 text-slate-600 font-normal">Who you help and how</span>
                </label>
                <input
                  type="text"
                  className={INPUT}
                  placeholder="e.g. I help early-stage founders build repeatable sales systems without hiring a full team."
                  value={form.brand_mission}
                  onChange={e => setForm(f => ({ ...f, brand_mission: e.target.value }))}
                />
              </div>

            </div>
          </div>

          {/* ── Platforms ───────────────────────────────────────────── */}
          <Section label="Platforms & Frequency">

            {/* LinkedIn */}
            <div className={`rounded-lg border transition-all ${
              form.platforms.includes('linkedin')
                ? 'border-sky-500/25 bg-sky-500/5'
                : 'border-slate-800/60 bg-slate-900/40'
            }`}>
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center">
                    <Linkedin className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-200">LinkedIn</p>
                    <p className="text-[11px] text-slate-500">Auto-publishes on approval</p>
                  </div>
                </div>
                <Toggle
                  checked={form.platforms.includes('linkedin')}
                  onChange={() => toggle('linkedin')}
                  color="bg-sky-600"
                />
              </div>

              {form.platforms.includes('linkedin') && (
                <div className="px-4 pb-4 space-y-3">
                  {/* Posts per week */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Posts per week</span>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n} type="button"
                          onClick={() => setForm(f => ({ ...f, posts_per_week: { ...f.posts_per_week, linkedin: n } }))}
                          className={`w-7 h-7 rounded-md text-[12px] font-semibold transition-colors ${
                            form.posts_per_week.linkedin === n
                              ? 'bg-sky-600 text-white'
                              : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* LinkedIn connect */}
                  <div className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border ${
                    linkedinName
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-slate-900 border-slate-800/60'
                  }`}>
                    {linkedinName ? (
                      <>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[12px] text-emerald-300 font-medium">Connected as {linkedinName}</span>
                        </div>
                        <span className="text-[11px] text-slate-600">Posts auto-publish on approval</span>
                      </>
                    ) : (
                      <>
                        <span className="text-[12px] text-slate-400">Connect to auto-publish posts</span>
                        <a
                          href="/api/auth/linkedin"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500
                                     text-white text-[11px] font-semibold rounded-md transition-colors"
                        >
                          <Linkedin className="w-3 h-3" /> Connect LinkedIn
                        </a>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Instagram — Coming Soon */}
            <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 opacity-50 cursor-not-allowed pointer-events-none">
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-pink-500/10 flex items-center justify-center">
                    <Camera className="w-3.5 h-3.5 text-pink-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-slate-200">Instagram</p>
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-700/60 text-slate-500 border border-slate-600/40">SOON</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Coming Soon</p>
                  </div>
                </div>
                <Toggle
                  checked={false}
                  onChange={() => {}}
                  color="bg-pink-600"
                />
              </div>
            </div>

          </Section>

          {/* ── AI Video (Runway) ───────────────────────────────────── */}
          <Section label="AI Video — Runway">
            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-800/50 border border-slate-700/40 mb-2">
              <Video className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <div className="text-[12px] text-slate-400 leading-relaxed space-y-1">
                <p>Generate cinematic AI videos for TikTok and LinkedIn — works for any brand, any industry.</p>
                <p className="text-slate-500">
                  Upload a reference image (your product, logo, location) and Runway animates it into a professional video.
                  You pay Runway directly for the credits you use.
                </p>
                <a
                  href="https://dev.runwayml.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Get a Runway API key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                Runway API Key
                <span className="ml-1.5 text-slate-600 font-normal">stored securely, never shared</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  className={INPUT + ' pr-10'}
                  placeholder="••••••••••••••••••••••••"
                  value={form.runway_api_key}
                  onChange={e => setForm(f => ({ ...f, runway_api_key: e.target.value }))}
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-bwignore
                  data-form-type="other"
                  style={{ WebkitTextSecurity: showHeygenKey ? 'none' : 'disc' }}
                />
                <button
                  type="button"
                  onClick={() => setShowHeygenKey(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showHeygenKey
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.runway_api_key && (
                <p className="flex items-center gap-1.5 mt-1.5 text-[11px] text-emerald-400">
                  <Check className="w-3 h-3" /> API key saved — AI Videos tab is unlocked
                </p>
              )}
            </div>
          </Section>

          {/* ── Error ───────────────────────────────────────────────── */}
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-[13px] text-red-300 flex-1">{error}</p>
              <button type="button" onClick={() => setError('')} className="text-red-500 hover:text-red-300 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ── Save ────────────────────────────────────────────────── */}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-pink-600 hover:bg-pink-500
                       text-white text-[13px] font-semibold rounded-lg transition-colors
                       disabled:opacity-50 shadow-sm shadow-pink-600/20"
          >
            {saving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : saved
                ? <Check className="w-4 h-4" />
                : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : 'Save Brand Profile'}
          </button>

        </form>
      </div>
    </div>
  )
}
