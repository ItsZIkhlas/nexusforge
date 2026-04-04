'use client'

import { use, useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Bot, Check, Trash2, Copy, ExternalLink,
  BookOpen, Code2, Settings2, Sparkles,
  Download, Upload, AlertCircle,
} from 'lucide-react'

const TABS = [
  { id: 'General',         icon: Settings2,  label: 'General' },
  { id: 'AI Instructions', icon: Sparkles,   label: 'AI Instructions' },
  { id: 'Knowledge Base',  icon: BookOpen,   label: 'Knowledge Base' },
  { id: 'Embed Code',      icon: Code2,      label: 'Embed Code' },
]

// ── CSV helpers ──────────────────────────────────────────────────────────────

function parseCsv(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const rows = []
  for (const line of lines) {
    if (!line.trim()) continue
    const cols = []
    let cur = ''
    let inQuote = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++ }
        else inQuote = !inQuote
      } else if (ch === ',' && !inQuote) {
        cols.push(cur); cur = ''
      } else {
        cur += ch
      }
    }
    cols.push(cur)
    rows.push(cols)
  }
  return rows
}

function buildCsv(faqs) {
  const esc = (s) => {
    const str = String(s ?? '')
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str
  }
  const lines = ['question,answer']
  for (const faq of faqs) {
    lines.push(`${esc(faq.question)},${esc(faq.answer)}`)
  }
  return lines.join('\n')
}

// ── Main component ───────────────────────────────────────────────────────────

export default function BotEditorPage({ params }) {
  const { id } = use(params)
  const router = useRouter()

  const [tab, setTab]           = useState('General')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied]     = useState(false)
  const [isDirty, setIsDirty]   = useState(false)

  const [name, setName]                 = useState('')
  const [color, setColor]               = useState('#5c60f5')
  const [welcome, setWelcome]           = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [domains, setDomains]           = useState('')
  const [active, setActive]             = useState(true)
  const [faqs, setFaqs]                 = useState([])
  const [newQ, setNewQ]                 = useState('')
  const [newA, setNewA]                 = useState('')

  // CSV import state
  const csvInputRef                               = useRef(null)
  const [importPreview, setImportPreview]         = useState(null) // { items: [...] }
  const [importing, setImporting]                 = useState(false)

  // ── Load bot data ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/bots/${id}`)
      .then(r => r.json())
      .then(d => {
        setName(d.name ?? '')
        setColor(d.color ?? '#5c60f5')
        setWelcome(d.welcome_message ?? '')
        setSystemPrompt(d.system_prompt ?? '')
        setDomains((d.allowed_domains ?? []).join('\n'))
        setActive(d.is_active ?? true)
        setFaqs(d.faq_items ?? [])
        setIsDirty(false)
      })
  }, [id])

  // ── Dirty helpers ──────────────────────────────────────────────────────────
  function markDirty(setter) {
    return (val) => {
      setter(val)
      setIsDirty(true)
    }
  }

  // ── beforeunload warning ───────────────────────────────────────────────────
  useEffect(() => {
    function handleBeforeUnload(e) {
      if (!isDirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // ── Save ───────────────────────────────────────────────────────────────────
  async function save() {
    setSaving(true)
    await fetch(`/api/bots/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        color,
        welcome_message: welcome,
        system_prompt: systemPrompt,
        allowed_domains: domains.split('\n').map(s => s.trim()).filter(Boolean),
        is_active: active,
      }),
    })
    setSaving(false)
    setSaved(true)
    setIsDirty(false)
    setTimeout(() => setSaved(false), 2500)
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function deleteBot() {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeleting(true)
    await fetch(`/api/bots/${id}`, { method: 'DELETE' })
    router.push('/bots')
    router.refresh()
  }

  // ── Back navigation with dirty check ──────────────────────────────────────
  function goBack() {
    if (isDirty && !window.confirm('You have unsaved changes. Leave without saving?')) return
    router.push('/bots')
  }

  // ── FAQ helpers ────────────────────────────────────────────────────────────
  async function addFaq(e) {
    e.preventDefault()
    if (!newQ.trim() || !newA.trim()) return
    const res = await fetch(`/api/bots/${id}/faq`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: newQ.trim(), answer: newA.trim() }),
    })
    const item = await res.json()
    setFaqs(prev => [...prev, item])
    setNewQ('')
    setNewA('')
  }

  async function deleteFaq(faqId) {
    await fetch(`/api/bots/${id}/faq`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ faqId }),
    })
    setFaqs(prev => prev.filter(f => f.id !== faqId))
  }

  // ── CSV Export ─────────────────────────────────────────────────────────────
  function exportCsv() {
    const csv = buildCsv(faqs)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(name || 'bot').replace(/\s+/g, '-').toLowerCase()}-faq.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── CSV Import (file picked) ───────────────────────────────────────────────
  function handleCsvFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target.result
      const rows = parseCsv(text)
      // skip header row (question,answer)
      const items = []
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        if (i === 0 && row[0]?.toLowerCase().trim() === 'question') continue
        const question = row[0]?.trim()
        const answer   = row[1]?.trim()
        if (question && answer) items.push({ question, answer })
      }
      if (items.length === 0) {
        alert('No valid FAQ items found in the CSV file.')
        return
      }
      setImportPreview({ items })
    }
    reader.readAsText(file)
    // reset so same file can be selected again
    e.target.value = ''
  }

  // ── CSV Import (confirmed) ─────────────────────────────────────────────────
  async function confirmImport() {
    if (!importPreview) return
    setImporting(true)
    const added = []
    for (const { question, answer } of importPreview.items) {
      const res = await fetch(`/api/bots/${id}/faq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer }),
      })
      const item = await res.json()
      added.push(item)
    }
    setFaqs(prev => [...prev, ...added])
    setImportPreview(null)
    setImporting(false)
  }

  // ── Embed ──────────────────────────────────────────────────────────────────
  const appUrl = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL || 'https://nexus.app')
  const embedCode = `<script src="${appUrl}/widget.js" data-bot-id="${id}" defer></script>`

  function copyEmbed() {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const initial = name?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-8 sm:py-10">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="mb-8">
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 mb-4 text-[12px] font-medium transition-colors"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-2)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All chatbots
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-extrabold text-[16px] shrink-0"
                style={{ background: color }}
              >
                {initial}
              </div>
              <div>
                <h1 className="text-[22px] font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
                  {name || 'Bot Editor'}
                </h1>
                <div className="mt-0.5">
                  {active
                    ? <span className="badge badge-success"><span className="w-1 h-1 rounded-full bg-emerald-400" />Live</span>
                    : <span className="badge badge-muted">Inactive</span>
                  }
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Unsaved changes indicator */}
              {isDirty && (
                <div
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg"
                  style={{
                    color: '#fcd34d',
                    background: 'rgba(252,211,77,0.08)',
                    border: '1px solid rgba(252,211,77,0.2)',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: '#fcd34d' }}
                  />
                  Unsaved changes
                </div>
              )}

              <button
                onClick={deleteBot}
                disabled={deleting}
                className="btn-secondary text-[12px] disabled:opacity-60"
                style={{ color: 'var(--danger)', borderColor: 'rgba(244,63,94,0.2)' }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="btn-primary disabled:opacity-60"
              >
                {saved
                  ? <><Check className="w-3.5 h-3.5" /> Saved</>
                  : saving ? 'Saving…' : 'Save changes'
                }
              </button>
            </div>
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────── */}
        <div
          className="flex gap-0.5 p-1 rounded-xl mb-7"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {TABS.map(({ id: tid, icon: Icon, label }) => (
            <button
              key={tid}
              onClick={() => setTab(tid)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-semibold rounded-lg transition-all"
              style={tab === tid
                ? { background: 'var(--bg-page)', color: 'var(--text)', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }
                : { color: 'var(--text-3)' }
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ── General ────────────────────────────────────────────── */}
        {tab === 'General' && (
          <div
            className="rounded-2xl p-6 space-y-6"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <Field label="Bot name" hint="This is how the bot will introduce itself.">
              <input
                value={name}
                onChange={e => markDirty(setName)(e.target.value)}
                className="input"
                placeholder="e.g. Aria"
              />
            </Field>

            <Field label="Brand color" hint="Used for the chat bubble and widget header.">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="color"
                    value={color}
                    onChange={e => markDirty(setColor)(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer opacity-0 absolute inset-0"
                  />
                  <div
                    className="w-10 h-10 rounded-lg border pointer-events-none"
                    style={{ background: color, borderColor: 'var(--border-strong)' }}
                  />
                </div>
                <input
                  value={color}
                  onChange={e => markDirty(setColor)(e.target.value)}
                  className="input w-28 font-mono text-[12px]"
                  placeholder="#5c60f5"
                />
                <div className="flex gap-2 ml-1">
                  {['#5c60f5', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'].map(c => (
                    <button
                      key={c}
                      onClick={() => markDirty(setColor)(c)}
                      className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                      style={{
                        background: c,
                        outline: color === c ? `2px solid ${c}` : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
              </div>
            </Field>

            <Field label="Welcome message" hint="The first message visitors see when they open the widget.">
              <input
                value={welcome}
                onChange={e => markDirty(setWelcome)(e.target.value)}
                className="input"
                placeholder="Hi! How can I help you today?"
              />
            </Field>

            <Field label="Widget status" hint="Toggle whether the chat widget appears on your site.">
              <label className="flex items-center gap-3 cursor-pointer w-fit">
                <div
                  onClick={() => { setActive(v => !v); setIsDirty(true) }}
                  className="w-11 h-6 rounded-full transition-colors relative shrink-0"
                  style={{ background: active ? 'var(--primary)' : 'var(--border-strong)', cursor: 'pointer' }}
                >
                  <div
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                    style={{ transform: active ? 'translateX(20px)' : 'translateX(2px)' }}
                  />
                </div>
                <span className="text-[13px]" style={{ color: active ? 'var(--text-2)' : 'var(--text-3)' }}>
                  {active ? 'Widget is live on your site' : 'Widget is hidden'}
                </span>
              </label>
            </Field>
          </div>
        )}

        {/* ── AI Instructions ────────────────────────────────────── */}
        {tab === 'AI Instructions' && (
          <div
            className="rounded-2xl p-6 space-y-6"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <Field
              label="System prompt"
              hint="Tell the AI who it is and what it should focus on. Leave blank to use the default."
            >
              <textarea
                value={systemPrompt}
                onChange={e => markDirty(setSystemPrompt)(e.target.value)}
                rows={10}
                className="input font-mono text-[12px] resize-y"
                placeholder={`You are ${name || 'Aria'}, a helpful assistant for [Your Business].\nBe friendly, professional, and concise.\nFocus on helping customers with [specific topics].`}
              />
            </Field>

            <Field
              label="Allowed domains"
              hint="One domain per line. Leave blank to allow all. Prevents other sites from using your bot."
            >
              <textarea
                value={domains}
                onChange={e => markDirty(setDomains)(e.target.value)}
                rows={4}
                className="input font-mono text-[12px] resize-y"
                placeholder={"yourdomain.com\nwww.yourdomain.com"}
              />
            </Field>
          </div>
        )}

        {/* ── Knowledge Base ─────────────────────────────────────── */}
        {tab === 'Knowledge Base' && (
          <div className="space-y-4">
            {/* Header card with Import/Export */}
            <div
              className="rounded-2xl p-5"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[13px] leading-relaxed mb-1" style={{ color: 'var(--text-2)' }}>
                    Add Q&amp;A pairs to train your bot on business-specific information.
                  </p>
                  <p className="text-[12px]" style={{ color: 'var(--text-3)' }}>
                    The AI will use these to answer questions accurately.
                  </p>
                </div>

                {/* CSV Import / Export buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* hidden file input */}
                  <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleCsvFile}
                  />
                  <button
                    onClick={() => csvInputRef.current?.click()}
                    className="btn-secondary text-[12px] flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Import FAQ
                  </button>
                  {faqs.length > 0 && (
                    <button
                      onClick={exportCsv}
                      className="btn-secondary text-[12px] flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export FAQ
                    </button>
                  )}
                </div>
              </div>

              {/* Import preview banner */}
              {importPreview && (
                <div
                  className="mt-4 rounded-xl p-4 flex items-center justify-between gap-3"
                  style={{
                    background: 'rgba(252,211,77,0.07)',
                    border: '1px solid rgba(252,211,77,0.25)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" style={{ color: '#fcd34d' }} />
                    <p className="text-[12px] font-medium" style={{ color: '#fcd34d' }}>
                      Import {importPreview.items.length} FAQ {importPreview.items.length === 1 ? 'item' : 'items'}?
                      {' '}These will be appended to your existing knowledge base.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setImportPreview(null)}
                      className="btn-secondary text-[11px]"
                      disabled={importing}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmImport}
                      disabled={importing}
                      className="btn-primary text-[11px] disabled:opacity-60"
                    >
                      {importing ? 'Importing…' : 'Confirm import'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {faqs.length === 0 && (
              <div
                className="rounded-xl py-10 text-center"
                style={{ border: '1px dashed var(--border-strong)', background: 'var(--bg-card)' }}
              >
                <BookOpen className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--text-3)' }} />
                <p className="text-[12px]" style={{ color: 'var(--text-3)' }}>No knowledge base items yet.</p>
              </div>
            )}

            <div className="space-y-2.5">
              {faqs.map(faq => (
                <div
                  key={faq.id}
                  className="rounded-xl p-4"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold mb-1" style={{ color: 'var(--text)' }}>
                        Q: {faq.question}
                      </p>
                      <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-2)' }}>
                        A: {faq.answer}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteFaq(faq.id)}
                      className="text-[11px] font-medium shrink-0 transition-colors"
                      style={{ color: 'var(--text-3)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={addFaq}
              className="rounded-2xl p-5 space-y-3"
              style={{ border: '1px dashed var(--border-strong)', background: 'var(--bg-card)' }}
            >
              <p className="text-[12px] font-semibold" style={{ color: 'var(--text-2)' }}>
                Add a Q&amp;A pair
              </p>
              <input
                value={newQ}
                onChange={e => setNewQ(e.target.value)}
                className="input"
                placeholder="Question — e.g. What are your hours?"
              />
              <textarea
                value={newA}
                onChange={e => setNewA(e.target.value)}
                className="input resize-y"
                rows={3}
                placeholder="Answer — e.g. We're open Mon–Fri, 9am–5pm EST."
              />
              <button
                type="submit"
                disabled={!newQ.trim() || !newA.trim()}
                className="btn-primary disabled:opacity-50"
              >
                Add to knowledge base
              </button>
            </form>
          </div>
        )}

        {/* ── Embed Code ─────────────────────────────────────────── */}
        {tab === 'Embed Code' && (
          <div className="space-y-4">
            <div
              className="rounded-2xl p-6"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-2)' }}>
                Paste this snippet just before the{' '}
                <code
                  className="px-1.5 py-0.5 rounded text-[11px] font-mono"
                  style={{ background: 'var(--bg-page)', border: '1px solid var(--border-strong)', color: 'var(--primary-text)' }}
                >
                  &lt;/body&gt;
                </code>{' '}
                tag on your website. The chat widget will appear automatically.
              </p>
            </div>

            <div
              className="rounded-2xl p-5 relative group"
              style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}
            >
              <pre
                className="text-[12px] overflow-x-auto whitespace-pre-wrap break-all leading-relaxed pr-16 font-mono"
                style={{ color: '#6ee7b7' }}
              >
                {embedCode}
              </pre>
              <button
                onClick={copyEmbed}
                className="absolute top-3.5 right-3.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                style={{
                  background: copied ? 'rgba(16,185,129,0.15)' : 'var(--bg-card)',
                  border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'var(--border-strong)'}`,
                  color: copied ? 'var(--secondary-text)' : 'var(--text-2)',
                }}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div
              className="rounded-2xl p-5"
              style={{ background: 'var(--primary-dim)', border: '1px solid var(--primary-border)' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[13px] font-semibold mb-1" style={{ color: 'var(--primary-text)' }}>
                    Test your bot
                  </p>
                  <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-3)' }}>
                    Preview the chat widget before adding it to your website.
                  </p>
                </div>
                <a
                  href={`/embed/${id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary shrink-0 text-[12px]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open preview
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-2">
      <div>
        <label className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{label}</label>
        {hint && <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'var(--text-3)' }}>{hint}</p>}
      </div>
      {children}
    </div>
  )
}
