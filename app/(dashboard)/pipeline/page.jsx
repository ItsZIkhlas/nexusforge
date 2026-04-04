'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragOverlay, useDroppable
} from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import {
  KanbanSquare, Plus, X, Loader2, DollarSign, User, Trophy, Search, Trash2
} from 'lucide-react'

// ── Stage config ────────────────────────────────────────────────────────────

const STAGES = [
  { id: 'lead',        label: 'Lead',        topColor: 'rgba(148,163,184,0.6)', dotColor: '#94a3b8' },
  { id: 'contacted',   label: 'Contacted',   topColor: 'rgba(14,165,233,0.7)',  dotColor: '#38bdf8' },
  { id: 'interested',  label: 'Interested',  topColor: 'rgba(234,179,8,0.7)',   dotColor: '#facc15' },
  { id: 'negotiating', label: 'Negotiating', topColor: 'rgba(249,115,22,0.7)',  dotColor: '#fb923c' },
  { id: 'won',         label: 'Won',         topColor: 'rgba(16,185,129,0.7)',  dotColor: '#34d399' },
  { id: 'lost',        label: 'Lost',        topColor: 'rgba(244,63,94,0.7)',   dotColor: '#fb7185' },
]

// ── Deal Card ────────────────────────────────────────────────────────────────

function DealCard({ deal, isDragging = false, onClick }) {
  const contactName = deal.contact
    ? `${deal.contact.first_name ?? ''} ${deal.contact.last_name ?? ''}`.trim() || deal.contact.email
    : null

  return (
    <div
      className={`rounded-lg p-3 select-none transition-all cursor-pointer group ${isDragging ? 'shadow-2xl opacity-90 rotate-1' : ''}`}
      style={{
        background: 'var(--bg-card)',
        border: isDragging ? '2px solid var(--primary)' : '1px solid var(--border)',
        outline: isDragging ? '2px solid rgba(92,96,245,0.25)' : 'none',
      }}
      onMouseEnter={e => { if (!isDragging) e.currentTarget.style.background = 'var(--bg-card-hover)' }}
      onMouseLeave={e => { if (!isDragging) e.currentTarget.style.background = 'var(--bg-card)' }}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <p className="text-sm font-medium leading-snug flex-1" style={{ color: 'var(--text)' }}>{deal.title}</p>
      </div>
      <div className="mt-2 flex items-center justify-between">
        {contactName ? (
          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-3)' }}>
            <User className="w-3 h-3 flex-shrink-0" />
            <span className="truncate max-w-[100px]">{contactName}</span>
          </div>
        ) : <span />}
        {deal.value != null && (
          <div className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: '#34d399' }}>
            <DollarSign className="w-3 h-3" />
            {Number(deal.value).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Draggable wrapper ────────────────────────────────────────────────────────

function DraggableDeal({ deal, onEdit }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: deal.id, data: { deal } })

  // Separate dnd-kit's onPointerDown so we can call it alongside our own tracker.
  const { onPointerDown: dndPointerDown, ...restListeners } = listeners ?? {}

  const pointerDownPos = useRef(null)

  function handlePointerDown(e) {
    pointerDownPos.current = { x: e.clientX, y: e.clientY }
    dndPointerDown?.(e) // forward to dnd-kit — required for drag to work
  }

  function handlePointerUp(e) {
    if (!pointerDownPos.current) return
    const dx = Math.abs(e.clientX - pointerDownPos.current.x)
    const dy = Math.abs(e.clientY - pointerDownPos.current.y)
    pointerDownPos.current = null
    if (dx < 5 && dy < 5 && !isDragging) {
      onEdit(deal)
    }
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...restListeners}
      className={isDragging ? 'opacity-30' : ''}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <DealCard deal={deal} isDragging={isDragging} />
    </div>
  )
}

// ── Droppable column ─────────────────────────────────────────────────────────

function KanbanColumn({ stage, deals, onAddDeal, onEdit, totalValue }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  return (
    <div className="flex flex-col min-w-[220px] w-[220px] flex-shrink-0">
      {/* Column header */}
      <div
        className="rounded-t-xl px-3 py-2.5"
        style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderTop: `2px solid ${stage.topColor}` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: stage.dotColor }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>{stage.label}</span>
            <span
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{ background: 'var(--bg-card-hover)', color: 'var(--text-3)' }}
            >
              {deals.length}
            </span>
          </div>
          {/* + Add button in column header */}
          <button
            onClick={() => onAddDeal(stage.id)}
            className="flex items-center justify-center w-5 h-5 rounded transition-colors"
            style={{ color: 'var(--text-3)' }}
            title={`Add deal to ${stage.label}`}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary-text)'; e.currentTarget.style.background = 'var(--primary-dim)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'transparent' }}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        {totalValue > 0 && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
            ${totalValue.toLocaleString()} pipeline
          </p>
        )}
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className="flex-1 min-h-[80px] rounded-b-xl border border-t-0 p-2 space-y-2 transition-colors"
        style={{
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: isOver ? 'var(--primary-border)' : 'var(--border)',
          background: isOver ? 'var(--primary-dim)' : 'var(--bg-page)',
        }}
      >
        {deals.map(deal => (
          <DraggableDeal key={deal.id} deal={deal} onEdit={onEdit} />
        ))}
      </div>
    </div>
  )
}

// ── Add Deal Modal ────────────────────────────────────────────────────────────

function AddDealModal({ initialStage, contacts, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', value: '', stage: initialStage, contact_id: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          value: form.value ? parseFloat(form.value) : null,
          contact_id: form.contact_id || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed'); return }
      onCreated(data)
      onClose()
    } catch { setError('Network error') }
    finally { setSaving(false) }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>New Deal</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-hover)'; e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-3)' }}>Deal Title *</label>
            <input
              type="text"
              placeholder="Website redesign for Acme"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className="input"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-3)' }}>Value ($)</label>
              <input
                type="number"
                placeholder="5000"
                value={form.value}
                onChange={e => set('value', e.target.value)}
                className="input"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-3)' }}>Stage</label>
              <select value={form.stage} onChange={e => set('stage', e.target.value)} className="input">
                {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {contacts.length > 0 && (
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-3)' }}>Contact (optional)</label>
              <select value={form.contact_id} onChange={e => set('contact_id', e.target.value)} className="input">
                <option value="">No contact linked</option>
                {contacts.map(c => {
                  const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || c.email || c.id
                  return <option key={c.id} value={c.id}>{name}{c.company ? ` — ${c.company}` : ''}</option>
                })}
              </select>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2 text-sm font-medium">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Add Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Edit Deal Modal ───────────────────────────────────────────────────────────

function EditDealModal({ deal, contacts, onClose, onSaved, onDeleted }) {
  const [form, setForm] = useState({
    title: deal.title ?? '',
    value: deal.value != null ? String(deal.value) : '',
    stage: deal.stage ?? 'lead',
    contact_id: deal.contact_id ?? '',
    contact_name: deal.contact
      ? `${deal.contact.first_name ?? ''} ${deal.contact.last_name ?? ''}`.trim() || deal.contact.email || ''
      : '',
  })
  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError]     = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')
    try {
      const body = {
        title: form.title.trim(),
        value: form.value !== '' ? parseFloat(form.value) : null,
        stage: form.stage,
        contact_id: form.contact_id || null,
      }
      const res = await fetch(`/api/deals/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to save'); return }
      onSaved(data)
      onClose()
    } catch { setError('Network error') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      const res = await fetch(`/api/deals/${deal.id}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to delete')
        setDeleting(false)
        return
      }
      onDeleted(deal.id)
      onClose()
    } catch { setError('Network error'); setDeleting(false) }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Edit Deal</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-hover)'; e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-3)' }}>Deal Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className="input"
              autoFocus
            />
          </div>

          {/* Value + Stage */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-3)' }}>Value ($)</label>
              <input
                type="number"
                placeholder="0"
                value={form.value}
                onChange={e => set('value', e.target.value)}
                className="input"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-3)' }}>Stage</label>
              <select value={form.stage} onChange={e => set('stage', e.target.value)} className="input">
                {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Contact */}
          {contacts.length > 0 ? (
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-3)' }}>Contact</label>
              <select value={form.contact_id} onChange={e => set('contact_id', e.target.value)} className="input">
                <option value="">No contact linked</option>
                {contacts.map(c => {
                  const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || c.email || c.id
                  return <option key={c.id} value={c.id}>{name}{c.company ? ` — ${c.company}` : ''}</option>
                })}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-3)' }}>Contact</label>
              <input
                type="text"
                placeholder="Contact name"
                value={form.contact_name}
                onChange={e => set('contact_name', e.target.value)}
                className="input"
                readOnly={!!deal.contact}
              />
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {/* Delete confirmation message */}
          {confirmDelete && (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Click Delete again to confirm. This cannot be undone.
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            {/* Delete button */}
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
              style={{
                background: confirmDelete ? '#ef4444' : 'transparent',
                color: confirmDelete ? '#fff' : '#f87171',
                border: `1px solid ${confirmDelete ? '#ef4444' : '#f87171'}`,
              }}
              onMouseEnter={e => {
                if (!confirmDelete) {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.12)'
                }
              }}
              onMouseLeave={e => {
                if (!confirmDelete) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {confirmDelete ? 'Confirm Delete' : 'Delete'}
            </button>

            <div className="flex gap-2 flex-1">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1 py-2 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Pipeline Page ────────────────────────────────────────────────────────

export default function PipelinePage() {
  const [deals,       setDeals]       = useState([])
  const [contacts,    setContacts]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [activeId,    setActiveId]    = useState(null)
  const [modalStage,  setModalStage]  = useState(null)   // open AddDealModal when not null
  const [editingDeal, setEditingDeal] = useState(null)   // open EditDealModal when not null
  const [search,      setSearch]      = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const fetchDeals = useCallback(async () => {
    const res = await fetch('/api/deals')
    if (res.ok) setDeals(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchDeals()
    fetch('/api/contacts?limit=200')
      .then(r => r.ok ? r.json() : { contacts: [] })
      .then(d => setContacts(d.contacts ?? []))
  }, [fetchDeals])

  // Client-side search filter
  const query = search.trim().toLowerCase()
  const filteredDeals = query
    ? deals.filter(d => {
        const title = (d.title ?? '').toLowerCase()
        const contactName = d.contact
          ? `${d.contact.first_name ?? ''} ${d.contact.last_name ?? ''}`.trim().toLowerCase() ||
            (d.contact.email ?? '').toLowerCase()
          : ''
        return title.includes(query) || contactName.includes(query)
      })
    : deals

  // Group filtered deals by stage
  const byStage = STAGES.reduce((acc, s) => {
    acc[s.id] = filteredDeals.filter(d => d.stage === s.id)
    return acc
  }, {})

  // Stats (always from all deals, not filtered)
  const totalPipeline = deals
    .filter(d => !['won', 'lost'].includes(d.stage))
    .reduce((sum, d) => sum + (Number(d.value) || 0), 0)
  const wonValue = deals
    .filter(d => d.stage === 'won')
    .reduce((sum, d) => sum + (Number(d.value) || 0), 0)

  // Drag handlers
  function handleDragStart({ active }) { setActiveId(active.id) }

  async function handleDragEnd({ active, over }) {
    setActiveId(null)
    if (!over || active.id === over.id) return

    const deal = deals.find(d => d.id === active.id)
    const newStage = over.id  // over.id is the column (stage) id

    if (!deal || deal.stage === newStage) return

    // Optimistic update
    setDeals(prev => prev.map(d => d.id === active.id ? { ...d, stage: newStage } : d))

    // Persist
    await fetch(`/api/deals/${active.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    })
  }

  function handleDealCreated(deal) {
    setDeals(prev => [...prev, deal])
  }

  function handleDealSaved(updated) {
    setDeals(prev => prev.map(d => d.id === updated.id ? updated : d))
  }

  function handleDealDeleted(dealId) {
    setDeals(prev => prev.filter(d => d.id !== dealId))
  }

  const activeDeal = deals.find(d => d.id === activeId)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--primary-text)' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <div className="px-4 py-6 sm:px-8 sm:py-10 h-full flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4 flex-shrink-0 flex-wrap">
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <KanbanSquare className="w-6 h-6" style={{ color: 'var(--primary-text)' }} />
              Pipeline
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                {deals.length} deal{deals.length !== 1 ? 's' : ''}
              </p>
              {totalPipeline > 0 && (
                <p className="text-sm font-medium" style={{ color: 'var(--primary-text)' }}>
                  ${totalPipeline.toLocaleString()} in pipeline
                </p>
              )}
              {wonValue > 0 && (
                <p className="text-sm font-medium flex items-center gap-1" style={{ color: '#4ade80' }}>
                  <Trophy className="w-3.5 h-3.5" />
                  ${wonValue.toLocaleString()} won
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setModalStage('lead')}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Deal
          </button>
        </div>

        {/* Search bar */}
        <div className="mb-5 flex-shrink-0 max-w-xs relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: 'var(--text-3)' }}
          />
          <input
            type="text"
            placeholder="Search by title or contact…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9 pr-8 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors"
              style={{ color: 'var(--text-3)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Kanban board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
            {STAGES.map(stage => {
              const stageDeals = byStage[stage.id] ?? []
              const stageValue = stageDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0)
              return (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  deals={stageDeals}
                  totalValue={stageValue}
                  onAddDeal={setModalStage}
                  onEdit={setEditingDeal}
                />
              )
            })}
          </div>

          {/* Drag overlay — renders ghost card while dragging */}
          <DragOverlay>
            {activeDeal ? <DealCard deal={activeDeal} isDragging /> : null}
          </DragOverlay>
        </DndContext>

        {/* Add deal modal */}
        {modalStage !== null && (
          <AddDealModal
            initialStage={modalStage}
            contacts={contacts}
            onClose={() => setModalStage(null)}
            onCreated={handleDealCreated}
          />
        )}

        {/* Edit deal modal */}
        {editingDeal !== null && (
          <EditDealModal
            deal={editingDeal}
            contacts={contacts}
            onClose={() => setEditingDeal(null)}
            onSaved={handleDealSaved}
            onDeleted={handleDealDeleted}
          />
        )}
      </div>
    </div>
  )
}
