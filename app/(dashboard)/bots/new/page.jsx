'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bot, Zap } from 'lucide-react'

export default function NewBotPage() {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/bots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      setLoading(false)
      return
    }
    router.push(`/bots/${data.id}`)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <div className="max-w-lg mx-auto px-4 py-6 sm:px-8 sm:py-10">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 mb-8 text-[12px] font-medium transition-colors"
          style={{ color: 'var(--text-3)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-2)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to chatbots
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--primary-dim)', border: '1px solid var(--primary-border)' }}
          >
            <Bot className="w-5 h-5" style={{ color: 'var(--primary-text)' }} />
          </div>
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
              New chatbot
            </h1>
            <p className="text-[12px]" style={{ color: 'var(--text-3)' }}>
              Set up your AI chat widget in under 5 minutes.
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <form onSubmit={handleCreate} className="space-y-5">

            <div className="space-y-2">
              <label className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
                Bot name
              </label>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-3)' }}>
                Visitors will see this name in the chat widget header.
              </p>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Aria — Customer Support"
                className="input"
                autoFocus
              />
            </div>

            {error && (
              <div
                className="rounded-xl px-4 py-3"
                style={{ background: 'var(--danger-dim)', border: '1px solid rgba(244,63,94,0.25)' }}
              >
                <p className="text-[13px]" style={{ color: '#fda4af' }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="btn-primary w-full justify-center disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              {loading ? 'Creating…' : 'Create chatbot'}
            </button>

          </form>
        </div>

      </div>
    </div>
  )
}
