'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react'

const STATUSES = ['lead','contacted','interested','negotiating','won','lost']

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputClass = "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"

export default function NewContactPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [tagInput, setTagInput] = useState('')

  const [form, setForm] = useState({
    first_name:   '',
    last_name:    '',
    email:        '',
    phone:        '',
    company:      '',
    job_title:    '',
    linkedin_url: '',
    website:      '',
    status:       'lead',
    tags:         [],
    notes:        '',
  })

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function addTag(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const tag = tagInput.trim().replace(/,$/, '')
      if (tag && !form.tags.includes(tag)) {
        set('tags', [...form.tags, tag])
      }
      setTagInput('')
    }
  }

  function removeTag(tag) {
    set('tags', form.tags.filter(t => t !== tag))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to save'); return }
      router.push(`/crm/${data.id}`)
    } catch {
      setError('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/crm" className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">New Contact</h1>
          <p className="text-slate-400 text-sm">Add someone to your CRM</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="First Name">
            <input
              type="text"
              placeholder="John"
              value={form.first_name}
              onChange={e => set('first_name', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Last Name">
            <input
              type="text"
              placeholder="Smith"
              value={form.last_name}
              onChange={e => set('last_name', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email">
            <input
              type="email"
              placeholder="john@company.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Phone">
            <input
              type="tel"
              placeholder="+1 555 000 0000"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        {/* Company info */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Company">
            <input
              type="text"
              placeholder="Acme Corp"
              value={form.company}
              onChange={e => set('company', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Job Title">
            <input
              type="text"
              placeholder="Head of Marketing"
              value={form.job_title}
              onChange={e => set('job_title', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="LinkedIn URL">
            <input
              type="url"
              placeholder="https://linkedin.com/in/…"
              value={form.linkedin_url}
              onChange={e => set('linkedin_url', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Website">
            <input
              type="url"
              placeholder="https://company.com"
              value={form.website}
              onChange={e => set('website', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        {/* Status */}
        <Field label="Status">
          <select
            value={form.status}
            onChange={e => set('status', e.target.value)}
            className={inputClass}
          >
            {STATUSES.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </Field>

        {/* Tags */}
        <Field label="Tags (press Enter or comma to add)">
          <div className={`${inputClass} min-h-[40px] flex flex-wrap gap-1.5 items-center`}>
            {form.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 bg-indigo-600/30 text-indigo-300 text-xs px-2 py-0.5 rounded-full"
              >
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-white">×</button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder={form.tags.length ? '' : 'e.g. enterprise, inbound…'}
              className="bg-transparent outline-none text-sm text-white placeholder-slate-500 flex-1 min-w-[120px]"
            />
          </div>
        </Field>

        {/* Notes */}
        <Field label="Notes">
          <textarea
            rows={3}
            placeholder="Any context about this contact…"
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            className={`${inputClass} resize-none`}
          />
        </Field>

        {error && (
          <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Link href="/crm" className="flex-1 text-center py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 text-sm font-medium transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save Contact'}
          </button>
        </div>
      </form>
    </div>
  )
}
