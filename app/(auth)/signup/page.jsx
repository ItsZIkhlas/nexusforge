'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [business,  setBusiness]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [agreed,    setAgreed]    = useState(false)
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!agreed) { setError('You must agree to the Terms of Service.'); return }
    setLoading(true)
    setError('')

    const supabase = createClient()

    // 1. Create auth account
    const { error: authErr } = await supabase.auth.signUp({ email, password })
    if (authErr) {
      setError(authErr.message)
      setLoading(false)
      return
    }

    // 2. Create org + bot
    const res = await fetch('/api/onboarding', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        businessName: business.trim(),
        tosAgreedAt:  new Date().toISOString(),
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Account created but setup failed. Please log in.')
      setLoading(false)
      return
    }

    // 3. Go to dashboard
    router.refresh()
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl shadow-black/40">

        <div className="text-center mb-7">
          <div className="flex items-center justify-center gap-2 mb-3">
            <img src="/logo.svg" alt="NexusForge" className="w-9 h-9" />
            <span className="text-xl font-bold text-white tracking-tight">NexusForge</span>
          </div>
          <p className="text-slate-500 text-sm">Create your account — 14 days free</p>
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
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input"
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input"
              type="password"
              placeholder="8+ characters"
              minLength={8}
              required
            />
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer group">
            <div className="relative mt-[1px] shrink-0">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${
                agreed ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-800 border-slate-700 group-hover:border-slate-500'
              }`}>
                {agreed && (
                  <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 fill-none stroke-white stroke-[2]">
                    <path d="M1 4l2.5 2.5L9 1" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-[12px] text-slate-400 leading-relaxed">
              I agree to NexusForge&apos;s{' '}
              <a href="/terms" target="_blank" rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                onClick={e => e.stopPropagation()}>
                Terms of Service
              </a>{' '}and{' '}
              <a href="/privacy" target="_blank" rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                onClick={e => e.stopPropagation()}>
                Privacy Policy
              </a>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !business.trim() || !agreed}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 disabled:opacity-60 transition mt-1"
          >
            {loading ? 'Setting up…' : 'Start free trial'}
          </button>
        </form>

        <p className="text-sm text-slate-500 text-center mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
