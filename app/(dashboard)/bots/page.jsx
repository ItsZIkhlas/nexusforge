'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Plus, Bot, Zap, MessageSquare, LayoutGrid,
  MessagesSquare, HelpCircle, RefreshCw,
  Search, Filter, ChevronDown, ChevronUp,
  AlertTriangle, User, Clock, Sparkles,
  BookOpen, CheckCircle,
} from 'lucide-react'

const TABS = [
  { id: 'bots',          label: 'My Bots',       Icon: LayoutGrid     },
  { id: 'conversations', label: 'Conversations',  Icon: MessagesSquare },
  { id: 'gaps',          label: 'AI Gaps',        Icon: HelpCircle     },
]

const UNCERTAIN_PHRASES = [
  "i don't know", "i'm not sure", "i don't have",
  "i'm unable to", "i cannot", "i can't find",
  "i'm sorry, i don't", "unfortunately, i", "i'm not aware",
  "i have no information", "outside of my", "beyond my knowledge",
  "i lack", "no information about", "not in my knowledge",
]
function isUnansweredMsg(content) {
  const lower = (content ?? '').toLowerCase()
  return UNCERTAIN_PHRASES.some(p => lower.includes(p))
}

export default function BotsPage() {
  const [tab, setTab]             = useState('bots')
  const [bots, setBots]           = useState([])
  const [convData, setConvData]   = useState(null)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [botFilter, setBotFilter] = useState('all')
  const [expanded, setExpanded]   = useState(null)

  async function load() {
    setLoading(true)
    try {
      const [botsRes, convRes] = await Promise.all([
        fetch('/api/bots'),
        fetch('/api/bots/conversations'),
      ])
      setBots(await botsRes.json())
      setConvData(await convRes.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const allConvs = convData?.conversations ?? []
  const stats    = convData?.stats         ?? {}
  const botNames = [...new Set(allConvs.map(c => c.bot_name))]

  const filtered = allConvs.filter(c => {
    const matchBot    = botFilter === 'all' || c.bot_name === botFilter
    const matchSearch = !search ||
      c.messages.some(m => m.content.toLowerCase().includes(search.toLowerCase())) ||
      c.bot_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.visitor_id ?? '').toLowerCase().includes(search.toLowerCase())
    return matchBot && matchSearch
  })

  const unanswered = allConvs
    .filter(c => c.has_gap)
    .filter(c => botFilter === 'all' || c.bot_name === botFilter)

  function timeAgo(iso) {
    if (!iso) return '—'
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1)  return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  const headings = {
    bots:          { title: 'Your Chatbots',  sub: 'AI chat widgets — capture leads, answer questions, qualify visitors.' },
    conversations: { title: 'Conversations',  sub: 'Every conversation your bots have had with visitors.' },
    gaps:          { title: 'AI Gaps',         sub: "Questions your AI couldn't answer — fix them in your Knowledge Base." },
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-8 sm:py-10">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--primary-dim)', border: '1px solid var(--primary-border)' }}
              >
                <Bot className="w-4 h-4" style={{ color: 'var(--primary-text)' }} />
              </div>
              <span className="section-label">Chatbot</span>
            </div>
            <h1 className="text-[26px] font-extrabold tracking-tight leading-tight mb-1" style={{ color: 'var(--text)' }}>
              {headings[tab].title}
            </h1>
            <p className="text-[13px]" style={{ color: 'var(--text-3)' }}>
              {headings[tab].sub}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {tab === 'bots' && (
              <Link href="/bots/new" className="btn-primary">
                <Plus className="w-3.5 h-3.5" /> New chatbot
              </Link>
            )}
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition disabled:opacity-40"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-3)' }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── Tab navigation ── */}
        <div className="overflow-x-auto mb-6">
          <div
            className="flex gap-1 p-1 rounded-xl w-fit"
            style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}
          >
            {TABS.map(t => {
              const active = tab === t.id
              const badge  = t.id === 'gaps' && !loading && (stats.unanswered_count ?? 0) > 0
                ? stats.unanswered_count : null
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-medium transition whitespace-nowrap shrink-0"
                  style={active
                    ? { background: 'var(--bg-hover)', color: 'var(--text)' }
                    : { color: 'var(--text-3)' }}
                >
                  <t.Icon className="w-3.5 h-3.5" />
                  {t.label}
                  {badge && (
                    <span className="ml-0.5 min-w-[1rem] h-4 px-1 rounded-full text-[10px] flex items-center justify-center font-bold"
                      style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>
                      {badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <RefreshCw className="w-5 h-5 animate-spin" style={{ color: 'var(--primary-text)' }} />
            <p className="text-[13px]" style={{ color: 'var(--text-3)' }}>Loading…</p>
          </div>
        )}

        {/* ════ MY BOTS TAB ════ */}
        {!loading && tab === 'bots' && (
          <>
            {!bots?.length ? (
              <div
                className="rounded-2xl py-20 px-8 text-center"
                style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-strong)' }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'var(--primary-dim)', border: '1px solid var(--primary-border)' }}
                >
                  <Bot className="w-7 h-7" style={{ color: 'var(--primary-text)' }} />
                </div>
                <h2 className="text-[17px] font-bold mb-2" style={{ color: 'var(--text)' }}>No chatbots yet</h2>
                <p className="text-[13px] mb-6 max-w-sm mx-auto leading-relaxed" style={{ color: 'var(--text-3)' }}>
                  Create your first AI chatbot and embed it on your website in under 5 minutes.
                </p>
                <Link href="/bots/new" className="btn-primary inline-flex">
                  <Zap className="w-3.5 h-3.5" /> Create your first bot
                </Link>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {bots.map(bot => <BotCard key={bot.id} bot={bot} />)}
              </div>
            )}
          </>
        )}

        {/* ════ CONVERSATIONS TAB ════ */}
        {!loading && tab === 'conversations' && (
          <div className="space-y-4">

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-3)' }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search messages or visitor…"
                  className="w-full pl-9 pr-4 py-2 rounded-lg text-[13px] focus:outline-none transition"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                />
              </div>
              {botNames.length > 1 && (
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--text-3)' }} />
                  <select
                    value={botFilter}
                    onChange={e => setBotFilter(e.target.value)}
                    className="pl-9 pr-8 py-2 rounded-lg text-[13px] focus:outline-none appearance-none transition"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  >
                    <option value="all">All bots</option>
                    {botNames.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              )}
              <p className="text-[12px] ml-auto" style={{ color: 'var(--text-3)' }}>
                {filtered.length} conversation{filtered.length !== 1 ? 's' : ''}
              </p>
            </div>

            {filtered.length === 0 && (
              <ConvEmpty allConvs={allConvs} />
            )}

            <div className="space-y-2">
              {filtered.map(conv => {
                const isOpen       = expanded === conv.id
                const firstUserMsg = conv.messages.find(m => m.role === 'user')
                return (
                  <div
                    key={conv.id}
                    className="rounded-xl overflow-hidden transition"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  >
                    <button
                      onClick={() => setExpanded(prev => prev === conv.id ? null : conv.id)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 text-left"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: conv.bot_color + '22', border: `1px solid ${conv.bot_color}44` }}
                      >
                        <Bot className="w-4 h-4" style={{ color: conv.bot_color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{conv.bot_name}</span>
                          {conv.has_gap && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                              style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>
                              AI gap
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] truncate" style={{ color: 'var(--text-3)' }}>
                          {firstUserMsg?.content ?? 'No messages recorded'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-[12px] font-medium" style={{ color: 'var(--text-2)' }}>
                            {conv.message_count} msg{conv.message_count !== 1 ? 's' : ''}
                          </p>
                          <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>{timeAgo(conv.last_message_at)}</p>
                        </div>
                        {isOpen
                          ? <ChevronUp   className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
                          : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-3)' }} />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t px-5 py-4 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-page)' }}>
                        <div className="flex items-center gap-4 text-[11px] mb-1" style={{ color: 'var(--text-3)' }}>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {conv.visitor_id ? `Visitor ${conv.visitor_id.slice(0, 8)}` : 'Anonymous visitor'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(conv.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        {conv.messages.map(msg => (
                          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'assistant' && (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                                style={{ background: conv.bot_color + '22' }}>
                                <Sparkles className="w-3 h-3" style={{ color: conv.bot_color }} />
                              </div>
                            )}
                            <div
                              className="max-w-[75%] rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed"
                              style={msg.role === 'user'
                                ? { background: 'var(--primary)', color: '#fff', borderRadius: '16px 16px 4px 16px' }
                                : isUnansweredMsg(msg.content)
                                  ? { background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#fde68a', borderRadius: '16px 16px 16px 4px' }
                                  : { background: 'var(--bg-card)', color: 'var(--text-2)', borderRadius: '16px 16px 16px 4px' }
                              }
                            >
                              {msg.content}
                              {msg.role === 'assistant' && isUnansweredMsg(msg.content) && (
                                <div className="flex items-center gap-1 mt-1.5 text-[10px]" style={{ color: '#fbbf24' }}>
                                  <AlertTriangle className="w-2.5 h-2.5" /> AI gap detected
                                </div>
                              )}
                            </div>
                            {msg.role === 'user' && (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                                style={{ background: 'var(--bg-hover)' }}>
                                <User className="w-3 h-3" style={{ color: 'var(--text-3)' }} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ════ AI GAPS TAB ════ */}
        {!loading && tab === 'gaps' && (
          <div className="space-y-4">

            <div className="rounded-xl px-5 py-4 flex gap-3"
              style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
              <div>
                <p className="text-[13px] font-semibold mb-0.5" style={{ color: '#fde68a' }}>AI Knowledge Gaps</p>
                <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(253,230,138,0.7)' }}>
                  These are questions your AI couldn&apos;t answer confidently. Add them to your bot&apos;s
                  Knowledge Base so it can answer them correctly next time.
                </p>
              </div>
            </div>

            {botNames.length > 1 && (
              <div className="relative w-fit">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--text-3)' }} />
                <select
                  value={botFilter}
                  onChange={e => setBotFilter(e.target.value)}
                  className="pl-9 pr-8 py-2 rounded-lg text-[13px] focus:outline-none appearance-none"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  <option value="all">All bots</option>
                  {botNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            )}

            {unanswered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <CheckCircle className="w-6 h-6" style={{ color: '#34d399' }} />
                </div>
                <p className="text-[14px] font-semibold mb-1" style={{ color: '#34d399' }}>No gaps found</p>
                <p className="text-[12px] max-w-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>
                  Your AI answered all conversations confidently. Nice work!
                </p>
              </div>
            )}

            <div className="space-y-3">
              {unanswered.map(conv => (
                <div key={conv.id} className="rounded-xl overflow-hidden"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: conv.bot_color + '22', border: `1px solid ${conv.bot_color}44` }}>
                      <Bot className="w-3.5 h-3.5" style={{ color: conv.bot_color }} />
                    </div>
                    <div className="flex-1">
                      <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{conv.bot_name}</span>
                      <span className="text-[11px] ml-2" style={{ color: 'var(--text-3)' }}>{timeAgo(conv.last_message_at)}</span>
                    </div>
                    <a
                      href={`/bots/${conv.bot_id}#knowledge`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition"
                      style={{ background: 'var(--primary-dim)', border: '1px solid var(--primary-border)', color: 'var(--primary-text)' }}
                    >
                      <BookOpen className="w-3 h-3" /> Add to KB
                    </a>
                  </div>

                  <div>
                    {conv.gaps.map((gap, i) => (
                      <div key={i} className="px-5 py-4 space-y-3"
                        style={i > 0 ? { borderTop: '1px solid var(--border-soft)' } : {}}>
                        {gap.userQuestion && (
                          <div className="flex gap-2.5">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                              style={{ background: 'var(--bg-hover)' }}>
                              <User className="w-2.5 h-2.5" style={{ color: 'var(--text-3)' }} />
                            </div>
                            <div>
                              <p className="text-[10px] mb-1 uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Customer asked</p>
                              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text)' }}>{gap.userQuestion}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2.5">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                            style={{ background: 'rgba(245,158,11,0.15)' }}>
                            <AlertTriangle className="w-2.5 h-2.5" style={{ color: '#fbbf24' }} />
                          </div>
                          <div>
                            <p className="text-[10px] mb-1 uppercase tracking-wide" style={{ color: 'rgba(253,230,138,0.5)' }}>AI responded</p>
                            <p className="text-[13px] leading-relaxed line-clamp-3" style={{ color: 'rgba(253,230,138,0.8)' }}>{gap.aiResponse}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function ConvEmpty({ allConvs }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <MessageSquare className="w-6 h-6" style={{ color: 'var(--text-3)' }} />
      </div>
      <p className="text-[14px] font-semibold mb-1" style={{ color: 'var(--text-2)' }}>
        {allConvs.length === 0 ? 'No conversations yet' : 'No conversations found'}
      </p>
      <p className="text-[12px] max-w-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>
        {allConvs.length === 0
          ? 'Once visitors start chatting with your bots, conversations will appear here.'
          : 'Try adjusting your search or filter.'}
      </p>
    </div>
  )
}

function BotCard({ bot }) {
  const initial = bot.name?.[0]?.toUpperCase() ?? '?'
  return (
    <Link
      href={`/bots/${bot.id}`}
      className="hov-card hov-indigo group flex flex-col rounded-xl p-5"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-extrabold text-[15px] shrink-0"
          style={{ background: bot.color ?? 'var(--primary)' }}
        >
          {initial}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-[14px] font-bold leading-snug truncate" style={{ color: 'var(--text)' }}>
            {bot.name}
          </p>
          <div className="mt-1">
            {bot.is_active
              ? <span className="badge badge-success"><span className="w-1 h-1 rounded-full bg-emerald-400" />Live</span>
              : <span className="badge badge-muted">Inactive</span>
            }
          </div>
        </div>
      </div>
      <p className="text-[12px] leading-relaxed line-clamp-2 flex-1 mb-4" style={{ color: 'var(--text-3)' }}>
        {bot.welcome_message ?? 'No welcome message set.'}
      </p>
      <div className="flex items-center gap-2 pt-3" style={{ borderTop: '1px solid var(--border-soft)' }}>
        <MessageSquare className="w-3 h-3" style={{ color: 'var(--text-3)' }} />
        <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>View settings & embed</span>
        <span className="hov-reveal ml-auto text-[11px] font-semibold" style={{ color: 'var(--primary-text)' }}>Open →</span>
      </div>
    </Link>
  )
}
