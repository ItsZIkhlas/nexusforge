'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BillingButtons({ hasCustomer, status }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function openPortal() {
    setLoading(true)
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const { url, error } = await res.json()
    if (error) { alert(error); setLoading(false); return }
    window.location.href = url
  }

  async function goToPricing() {
    router.push('/pricing')
  }

  if (hasCustomer && status === 'active') {
    return (
      <button
        onClick={openPortal}
        disabled={loading}
        className="border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white
          text-sm px-4 py-2 rounded-lg transition disabled:opacity-50"
      >
        {loading ? 'Opening…' : 'Manage billing'}
      </button>
    )
  }

  return (
    <button
      onClick={goToPricing}
      className="border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10
        text-sm px-4 py-2 rounded-lg transition"
    >
      {status === 'canceled' ? 'Resubscribe' : 'View plans'}
    </button>
  )
}
