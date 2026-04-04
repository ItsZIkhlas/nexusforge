'use client'

import { use, useState, useEffect, useRef } from 'react'

export default function EmbedPage({ params }) {
  const { botId } = use(params)

  const [bot, setBot] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    fetch(`/api/bots/${botId}/public`)
      .then(r => r.json())
      .then(data => {
        setBot(data)
        setMessages([{ role: 'assistant', content: data.welcome_message }])
      })
      .catch(() => setBot({ name: 'Assistant', color: '#5c60f5', welcome_message: 'Hi! How can I help?' }))
  }, [botId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || streaming) return

    const userMsg = { role: 'user', content: text }
    const history = [...messages, userMsg]

    setMessages(history)
    setInput('')
    setStreaming(true)
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId,
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
      })

      if (!res.ok) throw new Error('API error')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let reply = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        reply += decoder.decode(value, { stream: true })
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: reply },
        ])
      }
    } catch {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: "Sorry, something went wrong. Please try again." },
      ])
    } finally {
      setStreaming(false)
      inputRef.current?.focus()
    }
  }

  if (!bot) {
    return (
      <div style={styles.loadWrap}>
        <style>{fontImport}</style>
        <div style={styles.spinner} />
      </div>
    )
  }

  const accent = bot.color || '#5c60f5'
  const initial = bot.name?.[0]?.toUpperCase() ?? '?'

  return (
    <div style={{ ...styles.shell, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <style>{fontImport + scrollbarCss}</style>

      {/* ── Header ─────────────────────────────────── */}
      <div style={{ ...styles.header, background: accent }}>
        <div style={styles.headerGlow(accent)} />
        <div style={styles.avatar}>
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={styles.botName}>{bot.name}</p>
          <span style={styles.onlineRow}>
            <span style={styles.onlineDot} />
            <span style={styles.onlineText}>Online</span>
          </span>
        </div>
      </div>

      {/* ── Messages ───────────────────────────────── */}
      <div style={styles.messages} className="nexus-scroll">
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user'
          const isLastAssistant = !isUser && i === messages.length - 1
          const isEmpty = !msg.content

          return (
            <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
              {!isUser && (
                <div style={{ ...styles.msgAvatar, background: accent }}>
                  {initial}
                </div>
              )}
              <div
                style={isUser
                  ? { ...styles.bubble, ...styles.bubbleUser, background: accent }
                  : { ...styles.bubble, ...styles.bubbleBot }
                }
              >
                {isEmpty && streaming && isLastAssistant
                  ? <TypingDots />
                  : msg.content
                }
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ──────────────────────────────────── */}
      <form onSubmit={send} style={styles.inputWrap}>
        <div style={styles.inputRow}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message…"
            disabled={streaming}
            autoComplete="off"
            style={styles.input}
            onFocus={e => { e.target.style.borderColor = accent; e.target.style.boxShadow = `0 0 0 3px ${accent}22` }}
            onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || streaming}
            style={{ ...styles.sendBtn, background: accent, opacity: (!input.trim() || streaming) ? 0.4 : 1 }}
            aria-label="Send"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
        <p style={styles.branding}>
          Powered by <strong style={{ color: '#6b7280' }}>NexusForge</strong>
        </p>
      </form>
    </div>
  )
}

function TypingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', height: 16 }}>
      <style>{`
        @keyframes nexusBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
      {[0, 150, 300].map(delay => (
        <span
          key={delay}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#9ca3af',
            display: 'inline-block',
            animation: `nexusBounce 1.2s ease-in-out infinite`,
            animationDelay: `${delay}ms`,
          }}
        />
      ))}
    </span>
  )
}

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`

const scrollbarCss = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .nexus-scroll { scrollbar-width: thin; scrollbar-color: #e5e7eb transparent; }
  .nexus-scroll::-webkit-scrollbar { width: 4px; }
  .nexus-scroll::-webkit-scrollbar-track { background: transparent; }
  .nexus-scroll::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 99px; }
`

const styles = {
  loadWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#f9fafb',
  },
  spinner: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    border: '2.5px solid #e5e7eb',
    borderTopColor: '#5c60f5',
    animation: 'spin 0.7s linear infinite',
  },
  shell: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#f9fafb',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    flexShrink: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  headerGlow: (accent) => ({
    position: 'absolute',
    inset: 0,
    background: `linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.08) 100%)`,
    pointerEvents: 'none',
  }),
  avatar: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.22)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: 15,
    flexShrink: 0,
    border: '2px solid rgba(255,255,255,0.3)',
    backdropFilter: 'blur(4px)',
  },
  botName: {
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    lineHeight: 1.3,
    margin: 0,
  },
  onlineRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#86efac',
    boxShadow: '0 0 6px #86efac',
    flexShrink: 0,
  },
  onlineText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: 500,
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 14px',
  },
  msgAvatar: {
    width: 26,
    height: 26,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: 10,
    flexShrink: 0,
    marginRight: 7,
    marginTop: 2,
  },
  bubble: {
    maxWidth: '80%',
    padding: '10px 14px',
    fontSize: 13.5,
    lineHeight: 1.55,
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
  },
  bubbleUser: {
    borderRadius: '18px 18px 4px 18px',
    color: '#fff',
    fontWeight: 500,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  bubbleBot: {
    borderRadius: '18px 18px 18px 4px',
    background: '#fff',
    color: '#1f2937',
    border: '1px solid #f0f0f0',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  inputWrap: {
    flexShrink: 0,
    padding: '10px 12px 12px',
    background: '#fff',
    borderTop: '1px solid #f0f0f0',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    padding: '10px 16px',
    fontSize: 13.5,
    borderRadius: 999,
    border: '1.5px solid #e5e7eb',
    background: '#f9fafb',
    color: '#111827',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    fontFamily: 'inherit',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'opacity 0.15s, transform 0.1s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  branding: {
    textAlign: 'center',
    fontSize: 10,
    color: '#d1d5db',
    margin: '7px 0 0',
  },
}
