'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BusinessNameForm({ currentName }) {
  const [name, setName] = useState(currentName)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setSaved(false)

    await fetch('/api/org', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })

    setLoading(false)
    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="text-xs text-slate-500 mb-1.5">Business name</p>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="input"
          required
        />
        <button
          type="submit"
          disabled={loading || !name.trim() || name === currentName}
          className="px-4 py-2.5 bg-indigo-600 text-white text-sm rounded-lg font-medium
            hover:bg-indigo-500 disabled:opacity-50 transition whitespace-nowrap"
        >
          {loading ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
        </button>
      </div>
    </form>
  )
}
