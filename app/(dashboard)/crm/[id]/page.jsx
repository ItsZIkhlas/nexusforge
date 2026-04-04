'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Mail, Phone, Building2, Briefcase, Globe, Linkedin,
  Pencil, Trash2, Loader2, Check, X, MessageSquare, PhoneCall,
  SendHorizonal, CalendarDays, ClipboardList, Plus, Tag
} from 'lucide-react'

const STATUS_COLORS = {
  lead:        'bg-slate-700 text-slate-200',
  contacted:   'bg-blue-900/60 text-blue-300',
  interested:  'bg-yellow-900/60 text-yellow-300',
  negotiating: 'bg-orange-900/60 text-orange-300',
  won:         'bg-green-900/60 text-green-300',
  lost:        'bg-red-900/60 text-red-300',
}

const STATUSES = ['lead','contacted','interested','negotiating','won','lost']

const ACTIVITY_ICONS = {
  note:          { icon: MessageSquare, color: 'text-slate-400', bg: 'bg-slate-700' },
  call:          { icon: PhoneCall,     color: 'text-green-400',  bg: 'bg-green-900/40' },
  email_sent:    { icon: SendHorizonal, color: 'text-blue-400',   bg: 'bg-blue-900/40' },
  meeting:       { icon: CalendarDays,  color: 'text-purple-400', bg: 'bg-purple-900/40' },
  task:          { icon: ClipboardList, color: 'text-yellow-400', bg: 'bg-yellow-900/40' },
  status_change: { icon: Check,         color: 'text-indigo-400', bg: 'bg-indigo-900/40' },
}

function ActivityIcon({ type }) {
  const cfg = ACTIVITY_ICONS[type] ?? ACTIVITY_ICONS.note
  const Icon = cfg.icon
  return (
    <div className={`w-7 h-7 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
    </div>
  )
}

function fullName(c) {
  const n = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim()
  return n || c.email || 'Unnamed'
}
function initials(c) {
  if (c.first_name || c.last_name) {
    return `${c.first_name?.[0] ?? ''}${c.last_name?.[0] ?? ''}`.toUpperCase()
  }
  return (c.email?.[0] ?? '?').toUpperCase()
}

export default function ContactDetailPage({ params }) {
  const { id } = use(params)
  const router  = useRouter()

  const [contact,    setContact]    = useState(null)
  const [activities, setActivities] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [editing,    setEditing]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [editForm,   setEditForm]   = useState({})

  // Activity log form
  const [actType,    setActType]    = useState('note')
  const [actContent, setActContent] = useState('')
  const [actSaving,  setActSaving]  = useState(false)

  useEffect(() => {
    async function load() {
      const [cRes, aRes] = await Promise.all([
        fetch(`/api/contacts/${id}`),
        fetch(`/api/contacts/${id}/activities`),
      ])
      if (cRes.ok) {
        const c = await cRes.json()
        setContact(c)
        setEditForm(c)
      }
      if (aRes.ok) setActivities(await aRes.json())
      setLoading(false)
    }
    load()
  }, [id])

  async function saveEdit() {
    setSaving(true)
    const res = await fetch(`/api/contacts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    if (res.ok) {
      const updated = await res.json()
      setContact(updated)
      // Refresh activities (status change might have been logged)
      const aRes = await fetch(`/api/contacts/${id}/activities`)
      if (aRes.ok) setActivities(await aRes.json())
      setEditing(false)
    }
    setSaving(false)
  }

  async function deleteContact() {
    if (!confirm('Delete this contact? This cannot be undone.')) return
    setDeleting(true)
    await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
    router.push('/crm')
  }

  async function logActivity(e) {
    e.preventDefault()
    if (!actContent.trim()) return
    setActSaving(true)
    const res = await fetch(`/api/contacts/${id}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: actType, content: actContent }),
    })
    if (res.ok) {
      const a = await res.json()
      setActivities(prev => [a, ...prev])
      setActContent('')
    }
    setActSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--primary-text)' }} />
      </div>
    )
  }
  if (!contact) {
    return (
      <div className="p-6 text-center" style={{ color: 'var(--text-3)' }}>
        Contact not found. <Link href="/crm" style={{ color: 'var(--primary-text)' }}>Back to CRM</Link>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Back */}
      <Link href="/crm" className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors" style={{ color: 'var(--text-3)' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
      >
        <ArrowLeft className="w-4 h-4" /> Back to CRM
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — Contact info */}
        <div className="lg:col-span-1 space-y-4">
          {/* Identity card */}
          <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 aspect-square"
                  style={{
                    background: 'var(--primary-dim)',
                    border: '1px solid var(--primary-border)',
                    color: 'var(--primary-text)',
                  }}
                >
                  {initials(contact)}
                </div>
                <div>
                  {editing ? (
                    <div className="space-y-1">
                      <input
                        value={editForm.first_name ?? ''}
                        onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))}
                        placeholder="First"
                        className="input"
                      />
                      <input
                        value={editForm.last_name ?? ''}
                        onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))}
                        placeholder="Last"
                        className="input"
                      />
                    </div>
                  ) : (
                    <>
                      <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{fullName(contact)}</h1>
                      {contact.job_title && <p className="text-sm" style={{ color: 'var(--text-3)' }}>{contact.job_title}</p>}
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5">
                {editing ? (
                  <>
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ background: 'var(--primary)', color: '#fff' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => { setEditing(false); setEditForm(contact) }}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ background: 'var(--bg-card-hover)', color: 'var(--text-2)' }}
                      onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.15)'}
                      onMouseLeave={e => e.currentTarget.style.filter = ''}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditing(true)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ background: 'var(--bg-card-hover)', color: 'var(--text-2)' }}
                      onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.15)'}
                      onMouseLeave={e => e.currentTarget.style.filter = ''}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={deleteContact}
                      disabled={deleting}
                      className="p-1.5 rounded-lg transition-colors hover:bg-red-900/50 hover:text-red-400"
                      style={{ background: 'var(--bg-card-hover)', color: 'var(--text-2)' }}
                    >
                      {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="mb-4">
              {editing ? (
                <select
                  value={editForm.status}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                  className="input"
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              ) : (
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[contact.status] ?? STATUS_COLORS.lead}`}>
                  {contact.status}
                </span>
              )}
            </div>

            {/* Contact fields */}
            <div className="space-y-3">
              {editing ? (
                <>
                  {[
                    { key: 'email',        label: 'Email',     type: 'email' },
                    { key: 'phone',        label: 'Phone',     type: 'tel' },
                    { key: 'company',      label: 'Company',   type: 'text' },
                    { key: 'job_title',    label: 'Job Title', type: 'text' },
                    { key: 'linkedin_url', label: 'LinkedIn',  type: 'url' },
                    { key: 'website',      label: 'Website',   type: 'url' },
                  ].map(({ key, label, type }) => (
                    <div key={key}>
                      <label className="block text-xs mb-0.5" style={{ color: 'var(--text-3)' }}>{label}</label>
                      <input
                        type={type}
                        value={editForm[key] ?? ''}
                        onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                        className="input"
                      />
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm group transition-colors"
                      style={{ color: 'var(--text-2)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}
                    >
                      <Mail className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
                      {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-sm group transition-colors"
                      style={{ color: 'var(--text-2)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}
                    >
                      <Phone className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
                      {contact.phone}
                    </a>
                  )}
                  {contact.company && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-2)' }}>
                      <Building2 className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
                      {contact.company}
                    </div>
                  )}
                  {contact.job_title && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-2)' }}>
                      <Briefcase className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
                      {contact.job_title}
                    </div>
                  )}
                  {contact.linkedin_url && (
                    <a href={contact.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm group transition-colors"
                      style={{ color: 'var(--text-2)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}
                    >
                      <Linkedin className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
                      LinkedIn Profile
                    </a>
                  )}
                  {contact.website && (
                    <a href={contact.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm group transition-colors"
                      style={{ color: 'var(--text-2)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}
                    >
                      <Globe className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
                      {contact.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </>
              )}
            </div>

            {/* Tags */}
            {(contact.tags?.length > 0 || editing) && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Tag className="w-3.5 h-3.5" style={{ color: 'var(--text-3)' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>Tags</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {contact.tags?.map(tag => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: 'var(--primary-dim)',
                        color: 'var(--primary-text)',
                        border: '1px solid var(--primary-border)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {(contact.notes || editing) && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>Notes</p>
                {editing ? (
                  <textarea
                    rows={3}
                    value={editForm.notes ?? ''}
                    onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                    className="input resize-none"
                  />
                ) : (
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{contact.notes}</p>
                )}
              </div>
            )}

            {/* Meta */}
            <div className="mt-4 pt-4 text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-3)' }}>
              Added {new Date(contact.created_at).toLocaleDateString()} · via {contact.source}
            </div>
          </div>

          {/* Deals */}
          {contact.deals?.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-2)' }}>Deals</h3>
              <div className="space-y-2">
                {contact.deals.map(d => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg p-2.5" style={{ background: 'var(--bg-card-hover)' }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{d.title}</p>
                      <p className="text-xs capitalize" style={{ color: 'var(--text-3)' }}>{d.stage}</p>
                    </div>
                    {d.value && (
                      <span className="text-sm font-semibold" style={{ color: 'var(--primary-text)' }}>
                        ${Number(d.value).toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Activity timeline */}
        <div className="lg:col-span-2 space-y-4">
          {/* Log activity form */}
          <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-2)' }}>Log Activity</h3>
            <form onSubmit={logActivity} className="space-y-3">
              {/* Type selector */}
              <div className="flex flex-wrap gap-2">
                {[
                  { type: 'note',       label: 'Note',    icon: MessageSquare },
                  { type: 'call',       label: 'Call',    icon: PhoneCall },
                  { type: 'email_sent', label: 'Email',   icon: SendHorizonal },
                  { type: 'meeting',    label: 'Meeting', icon: CalendarDays },
                  { type: 'task',       label: 'Task',    icon: ClipboardList },
                ].map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setActType(type)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={
                      actType === type
                        ? { background: 'var(--primary)', color: '#fff' }
                        : { background: 'var(--bg-card-hover)', color: 'var(--text-2)' }
                    }
                    onMouseEnter={e => {
                      if (actType !== type) e.currentTarget.style.filter = 'brightness(1.15)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.filter = ''
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  placeholder={`Add a ${actType.replace('_', ' ')}…`}
                  value={actContent}
                  onChange={e => setActContent(e.target.value)}
                  className="input flex-1 resize-none"
                />
                <button
                  type="submit"
                  disabled={actSaving || !actContent.trim()}
                  className="px-3 py-2 rounded-lg transition-colors disabled:opacity-50 self-end"
                  style={{ background: 'var(--primary)', color: '#fff' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
                >
                  {actSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>
            </form>
          </div>

          {/* Activity feed */}
          <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-2)' }}>
              Activity Timeline
              <span className="ml-2 text-xs font-normal" style={{ color: 'var(--text-3)' }}>({activities.length})</span>
            </h3>
            {activities.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-3)' }}>No activity logged yet</p>
            ) : (
              <div className="space-y-4">
                {activities.map((a, i) => (
                  <div key={a.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <ActivityIcon type={a.type} />
                      {i < activities.length - 1 && (
                        <div className="w-px flex-1 mt-2" style={{ background: 'var(--border)' }} />
                      )}
                    </div>
                    <div className="pb-4 flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium capitalize" style={{ color: 'var(--text-3)' }}>
                          {a.type.replace('_', ' ')}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                          {new Date(a.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{a.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
