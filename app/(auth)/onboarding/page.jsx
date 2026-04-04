'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap } from 'lucide-react'

export default function OnboardingPage() {
  const [business, setBusiness] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessName: business.trim() }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Something went wrong. Check your Supabase tables are created.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl shadow-black/40">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/logo.svg" alt="NexusForge" className="w-9 h-9" />
            <span className="text-xl font-bold text-white tracking-tight">NexusForge</span>
          </div>
          <p className="text-lg font-bold text-slate-100">One last step</p>
          <p className="text-slate-500 text-sm mt-1">What&apos;s your business called?</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Business name</label>
            <input
              value={business}
              onChange={e => setBusiness(e.target.value)}
              className="input"
              placeholder="Acme Corp"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || !business.trim()}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium
              hover:bg-indigo-500 disabled:opacity-60 transition"
          >
            {loading ? 'Setting up…' : 'Launch my dashboard →'}
          </button>
        </form>
      </div>
    </div>
  )
}
