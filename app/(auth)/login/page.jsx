'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [error,        setError]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [resetSent,    setResetSent]    = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const router = useRouter()

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError('Enter your email address first, then click Forgot password.')
      return
    }
    setResetLoading(true)
    setError('')
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
    })
    setResetLoading(false)
    setResetSent(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })

    if (authErr) {
      setError(authErr.message)
      setLoading(false)
      return
    }

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
          <p className="text-slate-500 text-sm">Welcome back</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input"
              type="email"
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-slate-300">Password</label>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading || resetSent}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
              >
                {resetSent ? '✓ Reset email sent' : resetLoading ? 'Sending…' : 'Forgot password?'}
              </button>
            </div>
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 disabled:opacity-60 transition mt-1"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-sm text-slate-500 text-center mt-5">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Start free trial
          </Link>
        </p>
      </div>
    </div>
  )
}
