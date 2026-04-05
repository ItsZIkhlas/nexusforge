'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  BrainCircuit, Plus, Search, SlidersHorizontal, X, Send,
  PanelLeftClose, PanelLeftOpen, Trash2, Check, RotateCcw,
  TrendingUp, Users, Mail, BarChart3, PenLine, Zap,
} from 'lucide-react'

// ── Tone presets ───────────────────────────────────────────────────────────────
const TONES = [
  { id: 'direct',     label: 'Direct',     desc: 'Short and punchy. Facts and next actions only.' },
  { id: 'analytical', label: 'Analytical', desc: 'Data-first — numbers, percentages, comparisons.' },
  { id: 'coaching',   label: 'Coaching',   desc: 'Reflective — helps you think, not just tells you.' },
  { id: 'executive',  label: 'Executive',  desc: 'High-level synthesis. Priorities and decisions.' },
]

// ── Suggested prompts ──────────────────────────────────────────────────────────
const PROMPTS = [
  { n: '01', label: 'Business overview',    icon: BarChart3,   color: 'indigo',  text: "Give me a complete overview of how my business is doing — key metrics, what's working, and what needs immediate attention." },
  { n: '02', label: 'Follow-up list',       icon: Users,       color: 'violet',  text: "Who should I be following up with right now? Find stale leads and contacts that haven't been touched in too long." },
  { n: '03', label: 'Pipeline analysis',    icon: TrendingUp,  color: 'cyan',    text: "Analyze my sales pipeline. Where are deals getting stuck? What's the total value and what should I prioritize closing first?" },
  { n: '04', label: 'Email performance',    icon: Mail,        color: 'emerald', text: "How is my email outreach performing? Break down open rates, click rates, and which sequences are most effective." },
  { n: '05', label: 'Write a follow-up',    icon: PenLine,     color: 'amber',   text: "Find my most recently contacted lead and write a warm, personalized follow-up email I can send today." },
  { n: '06', label: "This week's focus",    icon: Zap,         color: 'rose',    text: "Based on my current data, what are the 3 highest-impact actions I should take this week to grow my business?" },
]

const CHIP_COLORS = {
  indigo:  'border-indigo-500/25 bg-indigo-500/5 text-indigo-300 hover:bg-indigo-500/12 hover:border-indigo-500/40',
  violet:  'border-violet-500/25 bg-violet-500/5 text-violet-300 hover:bg-violet-500/12 hover:border-violet-500/40',
  cyan:    'border-cyan-500/25 bg-cyan-500/5 text-cyan-300 hover:bg-cyan-500/12 hover:border-cyan-500/40',
  emerald: 'border-emerald-500/25 bg-emerald-500/5 text-emerald-300 hover:bg-emerald-500/12 hover:border-emerald-500/40',
  amber:   'border-amber-500/25 bg-amber-500/5 text-amber-300 hover:bg-amber-500/12 hover:border-amber-500/40',
  rose:    'border-rose-500/25 bg-rose-500/5 text-rose-300 hover:bg-rose-500/12 hover:border-rose-500/40',
}

// ── Settings storage (localStorage only — device preference) ──────────────────
const LS_SETTINGS  = 'nexus_advisor_v1_settings'
const DEFAULT_SETTINGS = { tone: 'direct', memory: '' }

function lsGet(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

// ── Conversation API helpers ───────────────────────────────────────────────────
const api = {
  list:   ()           => fetch('/api/advisor/conversations').then(r => r.json()),
  create: (title, messages) => fetch('/api/advisor/conversations', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, messages }),
  }).then(r => r.json()),
  update: (id, patch)  => fetch(`/api/advisor/conversations/${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }).then(r => r.json()),
  delete: (id)         => fetch(`/api/advisor/conversations/${id}`, { method: 'DELETE' }),
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7) }

function makeTitle(text) {
  return text.length > 52 ? text.slice(0, 49) + '…' : text
}

function ago(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 60)   return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  const d = Math.floor(s / 86400)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Message renderer ───────────────────────────────────────────────────────────
function MsgContent({ text }) {
  const lines = text.split('\n')
  const groups = []
  let bullets = []

  for (const raw of lines) {
    const isBullet = /^[-*•] /.test(raw) || /^\d+\. /.test(raw)
    if (isBullet) {
      bullets.push(raw.replace(/^[-*•] /, '').replace(/^\d+\. /, ''))
    } else {
      if (bullets.length) { groups.push({ t: 'ul', items: bullets }); bullets = [] }
      if (raw.trim()) groups.push({ t: 'p', text: raw })
    }
  }
  if (bullets.length) groups.push({ t: 'ul', items: bullets })

  const inline = (str, k) => {
    const parts = str.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
    return (
      <span key={k}>
        {parts.map((p, i) => {
          if (p.startsWith('**') && p.endsWith('**'))
            return <strong key={i} className="text-slate-100 font-semibold">{p.slice(2, -2)}</strong>
          if (p.startsWith('`') && p.endsWith('`'))
            return <code key={i} className="mono text-[11.5px] bg-[#1a1f2e] text-indigo-300 px-1.5 py-[1px] rounded border border-indigo-500/20">{p.slice(1, -1)}</code>
          return p
        })}
      </span>
    )
  }

  return (
    <div className="space-y-[7px] text-[13px] leading-[1.75] text-slate-300">
      {groups.map((g, i) => {
        if (g.t === 'ul') return (
          <ul key={i} className="space-y-[5px]">
            {g.items.map((item, j) => (
              <li key={j} className="flex gap-2.5 items-baseline">
                <span className="w-1 h-1 rounded-full bg-indigo-400/50 shrink-0 mt-[7px]" />
                <span>{inline(item, j)}</span>
              </li>
            ))}
          </ul>
        )
        if (g.text?.startsWith('## '))
          return <p key={i} className="font-semibold text-slate-100 text-[14.5px] mt-1">{g.text.slice(3)}</p>
        if (g.text?.startsWith('### '))
          return <p key={i} className="font-medium text-slate-200 mt-0.5">{g.text.slice(4)}</p>
        return <p key={i}>{inline(g.text, i)}</p>
      })}
    </div>
  )
}

// ── Waveform thinking animation ────────────────────────────────────────────────
function Thinking() {
  const HEIGHTS = [10, 18, 14, 22, 10, 16, 12, 20, 8, 18]
  const DELAYS  = [0, 0.15, 0.3, 0.1, 0.25, 0.05, 0.35, 0.2, 0.4, 0.0]

  return (
    <div className="flex gap-3 items-start py-1">
      <div className="w-6 h-6 rounded-md bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0 mt-[3px]">
        <BrainCircuit className="w-3 h-3 text-indigo-400" />
      </div>
      <div className="flex items-center gap-[3px] pt-1.5">
        {HEIGHTS.map((h, i) => (
          <div
            key={i}
            className="w-[2.5px] bg-indigo-400/60 rounded-full animate-pulse"
            style={{ height: h, animationDelay: `${DELAYS[i]}s`, animationDuration: '1.1s' }}
          />
        ))}
        <span className="mono text-[10px] text-slate-700 ml-2 tracking-wide">analyzing</span>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function AdvisorClient({ orgName }) {
  const [convos, setConvos]             = useState([])
  const [activeId, setActiveId]         = useState(null)
  const [input, setInput]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState(null)
  const [historyOpen, setHistoryOpen]   = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [search, setSearch]             = useState('')
  const [settings, setSettings]         = useState(DEFAULT_SETTINGS)
  const [draft, setDraft]               = useState(DEFAULT_SETTINGS)
  const [saved, setSaved]               = useState(false)

  const taRef     = useRef(null)
  const bottomRef = useRef(null)

  const active   = convos.find(c => c.id === activeId) ?? null
  const messages = active?.messages ?? []
  const isEmpty  = messages.length === 0

  // ── Bootstrap — load from DB ───────────────────────────────────────────────
  useEffect(() => {
    const cfg = lsGet(LS_SETTINGS, DEFAULT_SETTINGS)
    setSettings(cfg)
    setDraft(cfg)

    api.list().then(data => {
      if (Array.isArray(data)) {
        const normalized = data.map(c => ({
          ...c,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
          messages:  Array.isArray(c.messages) ? c.messages : [],
        }))
        setConvos(normalized)
        if (normalized.length) setActiveId(normalized[0].id)
      }
    }).catch(() => {})
  }, [])

  // ── Scroll ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // ── Auto-resize textarea ───────────────────────────────────────────────────
  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 144) + 'px'
  }, [input])

  // ── New conversation ───────────────────────────────────────────────────────
  const newConvo = useCallback(async () => {
    const now = new Date().toISOString()
    // Optimistic placeholder
    const placeholder = { id: `tmp-${Date.now()}`, title: 'New conversation', messages: [], createdAt: now, updatedAt: now }
    setConvos(prev => [placeholder, ...prev])
    setActiveId(placeholder.id)
    setError(null)
    setInput('')

    const saved = await api.create('New conversation', []).catch(() => null)
    if (saved?.id) {
      setConvos(prev => prev.map(c => c.id === placeholder.id
        ? { ...saved, createdAt: saved.created_at, updatedAt: saved.updated_at, messages: [] }
        : c
      ))
      setActiveId(saved.id)
    }
  }, [])

  // ── Send ───────────────────────────────────────────────────────────────────
  const send = useCallback(async (text) => {
    const t = (text ?? input).trim()
    if (!t || loading) return

    // Ensure there's an active conversation
    let cid  = activeId
    let prev = messages

    if (!cid || cid.startsWith('tmp-')) {
      // Create a real DB conversation first
      const saved = await api.create(makeTitle(t), []).catch(() => null)
      if (!saved?.id) { setError('Failed to create conversation'); return }
      const newC = { ...saved, createdAt: saved.created_at, updatedAt: saved.updated_at, messages: [] }
      if (cid?.startsWith('tmp-')) {
        setConvos(p => p.map(c => c.id === cid ? newC : c))
      } else {
        setConvos(p => [newC, ...p])
      }
      setActiveId(saved.id)
      cid  = saved.id
      prev = []
    }

    setInput('')
    setError(null)

    const userMsg = { role: 'user', content: t }
    const updated = [...prev, userMsg]
    const isFirst = prev.length === 0
    const newTitle = isFirst ? makeTitle(t) : null

    // Optimistic update
    setConvos(p => p.map(c => c.id !== cid ? c : {
      ...c,
      messages:  updated,
      title:     newTitle ?? c.title,
      updatedAt: new Date().toISOString(),
    }))

    setLoading(true)
    try {
      const res  = await fetch('/api/advisor', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: updated.map(m => ({ role: m.role, content: m.content })), settings }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')

      const aiMsg   = { role: 'assistant', content: data.content }
      const final   = [...updated, aiMsg]

      setConvos(p => p.map(c => c.id !== cid ? c : {
        ...c,
        messages:  final,
        updatedAt: new Date().toISOString(),
      }))

      // Persist to DB
      const patch = { messages: final }
      if (newTitle) patch.title = newTitle
      api.update(cid, patch).catch(() => {})
    } catch (err) {
      setError(err.message)
      setConvos(p => p.map(c => c.id !== cid ? c : { ...c, messages: prev }))
    } finally {
      setLoading(false)
    }
  }, [input, messages, loading, activeId, settings])

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const deleteConvo = (id, e) => {
    e.stopPropagation()
    const next = convos.filter(c => c.id !== id)
    setConvos(next)
    if (activeId === id) setActiveId(next[0]?.id ?? null)
    if (!id.startsWith('tmp-')) api.delete(id).catch(() => {})
  }

  const saveSettings = () => {
    setSettings(draft)
    lsSet(LS_SETTINGS, draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }

  const filtered = convos.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&family=Outfit:wght@400;500;600&display=swap');
        .adv { font-family: 'Outfit', system-ui, sans-serif; }
        .mono { font-family: 'Fira Code', ui-monospace, monospace !important; }
        .adv-bg {
          background:
            radial-gradient(ellipse 80% 25% at 50% 0%, rgba(99,102,241,0.07) 0%, transparent 55%),
            #080c10;
        }
        .adv-scrollbar::-webkit-scrollbar { width: 3px; }
        .adv-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .adv-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 99px; }
        .adv-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.12); }
        .chipbar::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="adv relative flex h-[calc(100dvh-56px)] sm:h-[calc(100vh-56px)] overflow-hidden bg-[#080c10]">

        {/* Backdrops — close sidebar when clicking outside */}
        {historyOpen  && <div className="absolute inset-0 z-10 bg-black/50" onClick={() => setHistoryOpen(false)} />}
        {settingsOpen && <div className="absolute inset-0 z-10 bg-black/50" onClick={() => setSettingsOpen(false)} />}

        {/* ──────────── History Sidebar ──────────────────────────────────── */}
        <div className={`absolute inset-y-0 left-0 z-20 w-[258px] flex flex-col border-r border-white/[0.05]
          bg-[#060810] transition-transform duration-200 ease-in-out
          ${historyOpen ? 'translate-x-0' : '-translate-x-full'}`}>

          <div className="flex flex-col h-full">

            {/* Sidebar header */}
            <div className="px-4 pt-[18px] pb-3 border-b border-white/[0.04]">
              <div className="flex items-center justify-between mb-4">
                <span className="mono text-[9.5px] tracking-[0.18em] text-slate-700 uppercase">
                  Conversations
                </span>
                <button
                  onClick={newConvo}
                  title="New conversation"
                  className="w-6 h-6 rounded-md bg-white/[0.04] border border-white/[0.07] flex items-center justify-center
                    hover:bg-indigo-500/15 hover:border-indigo-500/30 transition-all group"
                >
                  <Plus className="w-3 h-3 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-700 pointer-events-none" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="mono w-full bg-white/[0.025] border border-white/[0.05] rounded-lg
                    pl-7 pr-3 py-[7px] text-[11px] text-slate-500 placeholder:text-slate-700
                    focus:outline-none focus:border-indigo-500/25 focus:bg-white/[0.04] transition-all"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto adv-scrollbar px-2 py-2 space-y-px">
              {filtered.length === 0 && (
                <p className="mono text-[10px] text-slate-700 text-center pt-10 px-4 leading-relaxed">
                  {search ? 'No matches found' : 'No conversations yet.\nStart one below.'}
                </p>
              )}
              {filtered.map((c, idx) => {
                const isActive = c.id === activeId
                return (
                  <div
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => { setActiveId(c.id); setError(null) }}
                    onKeyDown={e => e.key === 'Enter' && setActiveId(c.id)}
                    className={`group w-full text-left rounded-lg px-3 py-2.5 transition-all duration-100 relative cursor-pointer
                      ${isActive
                        ? 'bg-indigo-600/10 border-l-[2px] border-indigo-500 pl-[10px]'
                        : 'hover:bg-white/[0.03] border-l-[2px] border-transparent'}`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-[2px]">
                          <span className={`mono text-[9px] font-medium tabular-nums
                            ${isActive ? 'text-indigo-500' : 'text-slate-700'}`}>
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                        </div>
                        <p className={`text-[12px] leading-snug truncate transition-colors
                          ${isActive ? 'text-slate-200' : 'text-slate-600 group-hover:text-slate-400'}`}>
                          {c.title}
                        </p>
                        <p className="mono text-[9.5px] text-slate-700 mt-[3px]">{ago(c.updatedAt)}</p>
                      </div>
                      <button
                        onClick={(e) => deleteConvo(c.id, e)}
                        className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center
                          rounded text-slate-700 hover:text-rose-400 transition-all shrink-0 mt-[2px]"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

          </div>
        </div>

        {/* ──────────── Chat Area ────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden adv-bg relative">

          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04] shrink-0">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setHistoryOpen(h => !h)}
                className="w-7 h-7 rounded-md flex items-center justify-center text-slate-700
                  hover:text-slate-300 hover:bg-white/[0.05] transition-all"
                title={historyOpen ? 'Hide history' : 'Show history'}
              >
                {historyOpen
                  ? <PanelLeftClose className="w-3.5 h-3.5" />
                  : <PanelLeftOpen  className="w-3.5 h-3.5" />}
              </button>

              <div className="w-px h-4 bg-white/[0.05]" />

              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-600/20 border border-indigo-500/25 flex items-center justify-center">
                  <BrainCircuit className="w-3 h-3 text-indigo-400" />
                </div>
                <span className="text-[13px] font-semibold text-slate-300 tracking-tight">AI Advisor</span>
                <span className={`mono text-[9px] px-1.5 py-[2px] rounded border
                  text-slate-600 border-white/[0.06] bg-white/[0.02]`}>
                  {settings.tone}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {!isEmpty && (
                <button
                  onClick={newConvo}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium
                    text-slate-600 hover:text-slate-300 hover:bg-white/[0.05] transition-all"
                >
                  <RotateCcw className="w-3 h-3" />
                  New
                </button>
              )}
              <button
                onClick={() => { setSettingsOpen(s => !s); setDraft(settings) }}
                className={`w-7 h-7 rounded-md flex items-center justify-center transition-all
                  ${settingsOpen
                    ? 'bg-indigo-500/15 border border-indigo-500/25 text-indigo-400'
                    : 'text-slate-700 hover:text-slate-300 hover:bg-white/[0.05]'}`}
                title="Advisor settings"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages / Empty state */}
          <div className="flex-1 overflow-y-auto adv-scrollbar">
            {isEmpty ? (
              <div className="max-w-[860px] mx-auto px-6 pt-10 pb-6">
                {/* Intro */}
                <div className="mb-7 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/15 border border-indigo-500/25
                    flex items-center justify-center shrink-0 mt-0.5">
                    <BrainCircuit className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-[14px] font-semibold text-slate-200 mb-1">NexusForge Advisor</p>
                    <p className="text-[12.5px] text-slate-500 leading-relaxed max-w-[420px]">
                      I have live access to your CRM, pipeline, email outreach, chatbot conversations, and content.
                      Ask me anything — or pick a starting point below.
                    </p>
                    {settings.memory && (
                      <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-1
                        bg-indigo-500/8 border border-indigo-500/15 rounded-md">
                        <div className="w-1 h-1 rounded-full bg-indigo-400" />
                        <span className="mono text-[9.5px] text-indigo-400/70">Memory active</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Prompt grid */}
                <div className="grid grid-cols-3 gap-[7px]">
                  {PROMPTS.map(p => {
                    const Icon = p.icon
                    return (
                      <button
                        key={p.n}
                        onClick={() => send(p.text)}
                        className={`group text-left p-3.5 rounded-xl border transition-all duration-150 ${CHIP_COLORS[p.color]}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <Icon className="w-3.5 h-3.5 mt-[1px] shrink-0 opacity-80" />
                          <span className="mono text-[8.5px] opacity-30 tabular-nums">{p.n}</span>
                        </div>
                        <p className="text-[12px] font-medium leading-snug">{p.label}</p>
                      </button>
                    )
                  })}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 mt-8">
                  <div className="flex-1 h-px bg-white/[0.04]" />
                  <span className="mono text-[9px] text-slate-700 tracking-widest">OR TYPE BELOW</span>
                  <div className="flex-1 h-px bg-white/[0.04]" />
                </div>
              </div>

            ) : (
              <div className="max-w-[860px] mx-auto px-6 py-6 space-y-5">
                {messages.map((msg, i) => {
                  if (msg.role === 'user') {
                    return (
                      <div key={i} className="flex justify-end">
                        <div className="bg-[#1a1f2e] border border-white/[0.07] rounded-2xl rounded-tr-[4px]
                          px-4 py-[10px] max-w-[68%]">
                          <p className="text-[13px] text-slate-200 leading-[1.7]">{msg.content}</p>
                        </div>
                      </div>
                    )
                  }
                  return (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-md bg-indigo-600/15 border border-indigo-500/25
                        flex items-center justify-center shrink-0 mt-[3px]">
                        <BrainCircuit className="w-3 h-3 text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0 pt-[2px] border-l border-indigo-500/15 pl-3 -ml-[2px]">
                        <MsgContent text={msg.content} />
                      </div>
                    </div>
                  )
                })}

                {loading && <Thinking />}

                {error && (
                  <div className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-md bg-rose-500/15 border border-rose-500/20
                      flex items-center justify-center shrink-0 mt-[3px]">
                      <X className="w-3 h-3 text-rose-400" />
                    </div>
                    <p className="text-[12px] text-rose-400/80 pt-[3px] leading-relaxed">
                      {error} — please try again.
                    </p>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="shrink-0 border-t border-white/[0.04] px-5 py-4">
            {/* Quick chips */}
            {!isEmpty && !loading && (
              <div className="flex gap-1.5 mb-3 overflow-x-auto chipbar max-w-[860px] mx-auto">
                {['What needs attention?', 'Who to follow up?', 'Pipeline summary', 'Write a follow-up email'].map(q => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="mono shrink-0 text-[10px] px-2.5 py-[5px] rounded-full border
                      border-white/[0.06] text-slate-700 hover:text-slate-400 hover:border-indigo-500/25
                      transition-all whitespace-nowrap"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div className="max-w-[860px] mx-auto flex gap-2.5 items-end">
              <div className="flex-1">
                <textarea
                  ref={taRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={onKey}
                  placeholder="Ask anything about your business…"
                  rows={1}
                  disabled={loading}
                  className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl
                    px-4 py-[11px] text-[13px] text-slate-200 placeholder:text-slate-700 resize-none
                    focus:outline-none focus:border-indigo-500/35 focus:ring-1 focus:ring-indigo-500/10
                    transition-all disabled:opacity-40"
                  style={{ minHeight: '44px', maxHeight: '144px' }}
                />
              </div>
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 mb-[2px]
                  disabled:opacity-30 disabled:cursor-not-allowed
                  flex items-center justify-center transition-all shrink-0 shadow-lg shadow-indigo-600/20"
              >
                <Send className="w-[15px] h-[15px] text-white" />
              </button>
            </div>

            <p className="mono text-[9.5px] text-slate-800 text-center mt-2">
              Enter to send · Shift+Enter for new line · AI responses may be inaccurate — verify before acting
            </p>
          </div>
        </div>

        {/* ──────────── Settings Panel ───────────────────────────────────── */}
        <div className={`absolute inset-y-0 right-0 z-20 w-[300px] flex flex-col border-l border-white/[0.05]
          bg-[#060810] transition-transform duration-200 ease-in-out overflow-hidden
          ${settingsOpen ? 'translate-x-0' : 'translate-x-full'}`}>

          <div className="flex flex-col h-full overflow-y-auto adv-scrollbar">

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-[18px] pb-3.5 border-b border-white/[0.04]">
              <div>
                <p className="text-[13px] font-semibold text-slate-300">Advisor Settings</p>
                <p className="mono text-[9.5px] text-slate-700 mt-[2px]">Personalize how it responds</p>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="w-6 h-6 rounded-md text-slate-700 hover:text-slate-300 hover:bg-white/[0.05]
                  flex items-center justify-center transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 px-5 py-5 space-y-7">

              {/* ── Response style ─────────────────────────────────────── */}
              <div>
                <p className="mono text-[9.5px] tracking-[0.14em] uppercase text-slate-600 mb-3">
                  Response Style
                </p>
                <div className="space-y-[6px]">
                  {TONES.map(t => {
                    const on = draft.tone === t.id
                    return (
                      <button
                        key={t.id}
                        onClick={() => setDraft(d => ({ ...d, tone: t.id }))}
                        className={`w-full text-left p-3 rounded-xl border transition-all duration-100
                          ${on
                            ? 'bg-indigo-600/10 border-indigo-500/35 text-slate-200'
                            : 'bg-white/[0.02] border-white/[0.05] text-slate-600 hover:text-slate-400 hover:border-white/[0.09]'}`}
                      >
                        <div className="flex items-center justify-between mb-[3px]">
                          <span className="text-[12.5px] font-medium">{t.label}</span>
                          {on && (
                            <div className="w-[14px] h-[14px] rounded-full bg-indigo-500/20 border border-indigo-400/40
                              flex items-center justify-center shrink-0">
                              <Check className="w-[9px] h-[9px] text-indigo-400" />
                            </div>
                          )}
                        </div>
                        <p className="text-[10.5px] leading-relaxed opacity-50">{t.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ── Memory ─────────────────────────────────────────────── */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="mono text-[9.5px] tracking-[0.14em] uppercase text-slate-600">
                    Memory
                  </p>
                  {draft.memory.trim() && (
                    <span className="mono text-[9px] text-indigo-500/60">Active</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed mb-2.5">
                  Anything the advisor should always know — your business context, goals, or audience.
                </p>
                <textarea
                  value={draft.memory}
                  onChange={e => setDraft(d => ({ ...d, memory: e.target.value }))}
                  placeholder={'e.g. "B2B SaaS targeting law firms. Goal: 20 paying customers this quarter. Main ICP is operations managers at 50–200 person firms."'}
                  rows={6}
                  className="w-full bg-white/[0.025] border border-white/[0.06] rounded-xl
                    px-3.5 py-3 text-[11.5px] text-slate-300 placeholder:text-slate-700 resize-none
                    focus:outline-none focus:border-indigo-500/25 transition-all leading-relaxed"
                />
              </div>

            </div>

            {/* Save */}
            <div className="px-5 pb-5">
              <button
                onClick={saveSettings}
                className={`w-full py-[10px] rounded-xl text-[12.5px] font-medium transition-all duration-200
                  ${saved
                    ? 'bg-emerald-500/12 border border-emerald-500/25 text-emerald-400'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'}`}
              >
                {saved ? '✓  Settings saved' : 'Save Settings'}
              </button>
              <p className="mono text-[9px] text-slate-700 text-center mt-2">
                Settings apply to new messages only
              </p>
            </div>

          </div>
        </div>

      </div>
    </>
  )
}
