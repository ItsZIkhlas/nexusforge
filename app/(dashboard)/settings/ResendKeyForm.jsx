'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Check, Loader2, X } from 'lucide-react'

export default function ResendKeyForm({ hasKey, currentFromName, currentFromEmail }) {
  const router = useRouter()

  const [apiKey,    setApiKey]    = useState('')
  const [fromName,  setFromName]  = useState(currentFromName ?? '')
  const [fromEmail, setFromEmail] = useState(currentFromEmail ?? '')
  const [showKey,   setShowKey]   = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [removing,  setRemoving]  = useState(false)
  const [error,     setError]     = useState('')

  const inputClass = "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"

  async function handleSave(e) {
    e.preventDefault()
    setLoading(true); setSaved(false); setError('')

    const payload = {
      resend_from_name:  fromName,
      resend_from_email: fromEmail,
      ...(apiKey.trim() ? { resend_api_key: apiKey.trim() } : {}),
    }

    const res = await fetch('/api/org', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setLoading(false)
    if (res.ok) {
      setSaved(true)
      setApiKey('')   // clear after save for security
      router.refresh()
      setTimeout(() => setSaved(false), 3000)
    } else {
      const d = await res.json()
      setError(d.error ?? 'Failed to save')
    }
  }

  async function handleRemove() {
    if (!confirm('Remove your Resend API key? Emails will fall back to the platform default sender.')) return
    setRemoving(true)
    await fetch('/api/org', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resend_api_key: '', resend_from_name: '', resend_from_email: '' }),
    })
    setRemoving(false)
    setFromName(''); setFromEmail('')
    router.refresh()
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      {/* API Key */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-slate-500">
            Resend API Key
            {hasKey && (
              <span className="ml-2 text-green-500 font-medium">✓ Key saved</span>
            )}
          </label>
          {hasKey && (
            <button type="button" onClick={handleRemove} disabled={removing}
              className="text-xs text-red-500 hover:text-red-400 transition-colors flex items-center gap-1">
              {removing ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
              Remove
            </button>
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder={hasKey ? 're_•••••••••••••••••• (leave blank to keep current)' : 're_xxxxxxxxxxxxxxxxxxxx'}
            className={`${inputClass} pr-10`}
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            data-bwignore
            data-form-type="other"
            style={{ WebkitTextSecurity: showKey ? 'none' : 'disc' }}
          />
          <button
            type="button"
            onClick={() => setShowKey(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[11px] text-slate-600 mt-1">
          Get your key at{' '}
          <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
            resend.com/api-keys
          </a>
          {' '}· Your domain must be verified at{' '}
          <a href="https://resend.com/domains" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
            resend.com/domains
          </a>
        </p>
      </div>

      {/* Default From */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">Default From Name</label>
          <input value={fromName} onChange={e => setFromName(e.target.value)}
            placeholder="Your Name / Business" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">Default From Email</label>
          <input type="email" value={fromEmail} onChange={e => setFromEmail(e.target.value)}
            placeholder="you@yourdomain.com" className={inputClass} />
        </div>
      </div>
      <p className="text-[11px] text-slate-600">
        These defaults pre-fill new campaigns. You can override them per campaign.
      </p>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading || (!apiKey.trim() && fromName === (currentFromName ?? '') && fromEmail === (currentFromEmail ?? ''))}
        className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
          : saved
            ? <><Check className="w-4 h-4" /> Saved</>
            : 'Save Email Settings'
        }
      </button>
    </form>
  )
}
