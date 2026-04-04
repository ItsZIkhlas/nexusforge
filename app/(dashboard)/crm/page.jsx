'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  UserPlus, Search, Filter, Users, Mail, Building2,
  ChevronLeft, ChevronRight, Loader2,
  Download, Trash2, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_COLORS = {
  lead:        { background: 'rgba(255,255,255,0.05)', color: 'var(--text-3)',  borderColor: 'var(--border)' },
  contacted:   { background: 'rgba(14,165,233,0.12)',  color: '#7dd3fc',        borderColor: 'rgba(14,165,233,0.3)' },
  interested:  { background: 'rgba(234,179,8,0.12)',   color: '#fde047',        borderColor: 'rgba(234,179,8,0.3)' },
  negotiating: { background: 'rgba(249,115,22,0.12)',  color: '#fdba74',        borderColor: 'rgba(249,115,22,0.3)' },
  won:         { background: 'rgba(16,185,129,0.12)',  color: '#6ee7b7',        borderColor: 'rgba(16,185,129,0.3)' },
  lost:        { background: 'rgba(244,63,94,0.12)',   color: '#fda4af',        borderColor: 'rgba(244,63,94,0.3)' },
}

const STATUSES = ['lead', 'contacted', 'interested', 'negotiating', 'won', 'lost']

// Columns that can be sorted — maps to ?sort= param values
const SORT_COLUMNS = [
  { key: 'name',    label: 'Name' },
  { key: 'company', label: 'Company' },
  { key: 'email',   label: 'Email' },
  { key: 'status',  label: 'Status' },
  { key: 'added',   label: 'Added' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initials(first, last, email) {
  if (first || last) return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase()
  return (email?.[0] ?? '?').toUpperCase()
}

function fullName(c) {
  const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim()
  return name || c.email || 'Unnamed'
}

function escapeCsvCell(value) {
  if (value == null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function buildCsv(contacts) {
  const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Job Title', 'Status', 'Created At']
  const rows = contacts.map(c => [
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    c.company,
    c.job_title,
    c.status,
    c.created_at ? new Date(c.created_at).toISOString() : '',
  ].map(escapeCsvCell).join(','))
  return [headers.join(','), ...rows].join('\r\n')
}

function downloadCsv(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SortIcon({ columnKey, sort, order }) {
  if (sort !== columnKey) {
    return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-40" />
  }
  return order === 'asc'
    ? <ArrowUp   className="w-3.5 h-3.5 ml-1" style={{ color: 'var(--primary-text)' }} />
    : <ArrowDown className="w-3.5 h-3.5 ml-1" style={{ color: 'var(--primary-text)' }} />
}

function SortableHeader({ columnKey, label, sort, order, onSort, className = '' }) {
  const isActive = sort === columnKey
  return (
    <th
      className={`text-left px-4 py-3 section-label select-none cursor-pointer group/th ${className}`}
      onClick={() => onSort(columnKey)}
    >
      <span className="inline-flex items-center gap-0.5 hover:opacity-80 transition-opacity">
        <span style={isActive ? { color: 'var(--primary-text)' } : {}}>{label}</span>
        <SortIcon columnKey={columnKey} sort={sort} order={order} />
      </span>
    </th>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function CRMPage() {
  const [contacts, setContacts]       = useState([])
  const [total, setTotal]             = useState(0)
  const [page, setPage]               = useState(1)
  const [search, setSearch]           = useState('')
  const [status, setStatus]           = useState('')
  const [loading, setLoading]         = useState(true)
  const [query, setQuery]             = useState('')
  const [hoveredRow, setHoveredRow]   = useState(null)

  // Sorting
  const [sort, setSort]   = useState('added')
  const [order, setOrder] = useState('desc')

  // Bulk select
  const [selected, setSelected]           = useState(new Set())
  const [bulkStatus, setBulkStatus]       = useState('')
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false)
  const [bulkLoading, setBulkLoading]     = useState(false)
  const bulkStatusRef = useRef(null)

  // CSV export
  const [exporting, setExporting] = useState(false)

  const limit = 25

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit, sort, order })
      if (query)  params.set('search', query)
      if (status) params.set('status', status)

      const res  = await fetch(`/api/contacts?${params}`)
      const data = await res.json()
      setContacts(data.contacts ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [page, query, status, sort, order])

  useEffect(() => { fetchContacts() }, [fetchContacts])

  // Debounce search input → reset to page 1
  useEffect(() => {
    const t = setTimeout(() => { setQuery(search); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [search])

  // Close bulk status dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (bulkStatusRef.current && !bulkStatusRef.current.contains(e.target)) {
        setBulkStatusOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Clear selection when page/search/status/sort changes
  useEffect(() => { setSelected(new Set()) }, [page, query, status, sort, order])

  const totalPages = Math.ceil(total / limit)

  // -------------------------------------------------------------------------
  // Sorting
  // -------------------------------------------------------------------------

  function handleSort(columnKey) {
    if (sort === columnKey) {
      setOrder(o => (o === 'asc' ? 'desc' : 'asc'))
    } else {
      setSort(columnKey)
      setOrder('asc')
    }
    setPage(1)
  }

  // -------------------------------------------------------------------------
  // Bulk select
  // -------------------------------------------------------------------------

  const allOnPageSelected = contacts.length > 0 && contacts.every(c => selected.has(c.id))
  const someOnPageSelected = contacts.some(c => selected.has(c.id))

  function toggleSelectAll() {
    if (allOnPageSelected) {
      // Deselect all on page
      setSelected(prev => {
        const next = new Set(prev)
        contacts.forEach(c => next.delete(c.id))
        return next
      })
    } else {
      // Select all on page
      setSelected(prev => {
        const next = new Set(prev)
        contacts.forEach(c => next.add(c.id))
        return next
      })
    }
  }

  function toggleSelectRow(id, e) {
    e.stopPropagation()
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // -------------------------------------------------------------------------
  // Bulk delete
  // -------------------------------------------------------------------------

  async function handleBulkDelete() {
    if (selected.size === 0) return
    if (!window.confirm(`Delete ${selected.size} contact${selected.size !== 1 ? 's' : ''}? This cannot be undone.`)) return
    setBulkLoading(true)
    try {
      await Promise.all(
        [...selected].map(id =>
          fetch(`/api/contacts/${id}`, { method: 'DELETE' })
        )
      )
      setSelected(new Set())
      fetchContacts()
    } finally {
      setBulkLoading(false)
    }
  }

  // -------------------------------------------------------------------------
  // Bulk status change
  // -------------------------------------------------------------------------

  async function handleBulkStatusChange(newStatus) {
    if (!newStatus || selected.size === 0) return
    setBulkLoading(true)
    setBulkStatusOpen(false)
    try {
      await Promise.all(
        [...selected].map(id =>
          fetch(`/api/contacts/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
          })
        )
      )
      setSelected(new Set())
      setBulkStatus('')
      fetchContacts()
    } finally {
      setBulkLoading(false)
    }
  }

  // -------------------------------------------------------------------------
  // CSV export
  // -------------------------------------------------------------------------

  async function handleExport() {
    setExporting(true)
    try {
      const params = new URLSearchParams({ page: 1, limit: 99999 })
      if (query)  params.set('search', query)
      if (status) params.set('status', status)
      params.set('sort', sort)
      params.set('order', order)

      const res  = await fetch(`/api/contacts?${params}`)
      const data = await res.json()
      const csv  = buildCsv(data.contacts ?? [])
      const date = new Date().toISOString().slice(0, 10)
      downloadCsv(csv, `contacts-${date}.csv`)
    } finally {
      setExporting(false)
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-8 sm:py-10">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--primary-dim)', border: '1px solid var(--primary-border)' }}
              >
                <Users className="w-4 h-4" style={{ color: 'var(--primary-text)' }} />
              </div>
              <span className="section-label">CRM</span>
            </div>
            <h1 className="text-[22px] font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
              Contacts
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
              {total.toLocaleString()} contact{total !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* CSV Export */}
            <button
              onClick={handleExport}
              disabled={exporting || total === 0}
              className="btn-secondary flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Export to CSV"
            >
              {exporting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Download className="w-4 h-4" />
              }
              Export
            </button>

            <Link
              href="/crm/new"
              className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add Contact
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-3)' }} />
            <input
              type="text"
              placeholder="Search name, email, company…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-3)' }} />
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1) }}
              className="input pl-9 pr-8 appearance-none cursor-pointer"
            >
              <option value="">All statuses</option>
              {STATUSES.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selected.size > 0 && (
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg mb-4 text-sm"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--primary-border)',
              boxShadow: '0 0 0 1px var(--primary-border)',
            }}
          >
            <span className="font-medium" style={{ color: 'var(--primary-text)' }}>
              {selected.size} selected
            </span>

            <div className="h-4 w-px" style={{ background: 'var(--border)' }} />

            {/* Bulk Delete */}
            <button
              onClick={handleBulkDelete}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
              style={{
                background: 'rgba(244,63,94,0.12)',
                color: '#fda4af',
                border: '1px solid rgba(244,63,94,0.3)',
              }}
            >
              {bulkLoading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Trash2 className="w-3.5 h-3.5" />
              }
              Delete
            </button>

            {/* Bulk Change Status */}
            <div className="relative" ref={bulkStatusRef}>
              <button
                onClick={() => setBulkStatusOpen(o => !o)}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 btn-secondary"
              >
                Change Status
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {bulkStatusOpen && (
                <div
                  className="absolute left-0 top-full mt-1 z-50 rounded-lg py-1 min-w-[140px]"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  }}
                >
                  {STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => handleBulkStatusChange(s)}
                      className="w-full text-left px-3 py-2 text-xs capitalize transition-colors"
                      style={{ color: 'var(--text-2)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border capitalize"
                        style={STATUS_COLORS[s]}
                      >
                        {s}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear selection */}
            <button
              onClick={() => setSelected(new Set())}
              className="ml-auto text-xs transition-opacity opacity-60 hover:opacity-100"
              style={{ color: 'var(--text-3)' }}
            >
              Clear
            </button>
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--primary-text)' }} />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-4)' }} />
              <p className="font-medium" style={{ color: 'var(--text-3)' }}>
                {query || status ? 'No contacts match your filters' : 'No contacts yet'}
              </p>
              {!query && !status && (
                <Link href="/crm/new" className="text-sm mt-2 inline-block" style={{ color: 'var(--primary-text)' }}>
                  Add your first contact →
                </Link>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {/* Select-all checkbox */}
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      ref={el => { if (el) el.indeterminate = someOnPageSelected && !allOnPageSelected }}
                      onChange={toggleSelectAll}
                      className="cursor-pointer accent-[var(--primary)]"
                      style={{ width: 15, height: 15 }}
                      onClick={e => e.stopPropagation()}
                    />
                  </th>
                  <SortableHeader columnKey="name"    label="Name"    sort={sort} order={order} onSort={handleSort} />
                  <SortableHeader columnKey="company" label="Company" sort={sort} order={order} onSort={handleSort} className="hidden sm:table-cell" />
                  <SortableHeader columnKey="email"   label="Email"   sort={sort} order={order} onSort={handleSort} className="hidden md:table-cell" />
                  <SortableHeader columnKey="status"  label="Status"  sort={sort} order={order} onSort={handleSort} />
                  <SortableHeader columnKey="added"   label="Added"   sort={sort} order={order} onSort={handleSort} className="hidden lg:table-cell" />
                </tr>
              </thead>
              <tbody>
                {contacts.map(c => {
                  const isSelected = selected.has(c.id)
                  const isHovered  = hoveredRow === c.id
                  return (
                    <tr
                      key={c.id}
                      className="transition-colors cursor-pointer group"
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: isSelected
                          ? 'var(--primary-dim)'
                          : isHovered
                            ? 'var(--bg-card-hover)'
                            : 'transparent',
                      }}
                      onMouseEnter={() => setHoveredRow(c.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      onClick={() => { window.location.href = `/crm/${c.id}` }}
                    >
                      {/* Row checkbox */}
                      <td
                        className="px-4 py-3 w-10"
                        onClick={e => toggleSelectRow(c.id, e)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="cursor-pointer accent-[var(--primary)]"
                          style={{ width: 15, height: 15 }}
                        />
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                            style={{
                              background: 'var(--primary-dim)',
                              border: '1px solid var(--primary-border)',
                              color: 'var(--primary-text)',
                            }}
                          >
                            {initials(c.first_name, c.last_name, c.email)}
                          </div>
                          <div>
                            <p
                              className="text-sm font-medium transition-colors"
                              style={{ color: isHovered ? 'var(--primary-text)' : 'var(--text)' }}
                            >
                              {fullName(c)}
                            </p>
                            {c.job_title && (
                              <p className="text-xs" style={{ color: 'var(--text-3)' }}>{c.job_title}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Company */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {c.company ? (
                          <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-2)' }}>
                            <Building2 className="w-3.5 h-3.5" style={{ color: 'var(--text-3)' }} />
                            {c.company}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-4)' }}>—</span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        {c.email ? (
                          <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-2)' }}>
                            <Mail className="w-3.5 h-3.5" style={{ color: 'var(--text-3)' }} />
                            {c.email}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-4)' }}>—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border capitalize"
                          style={STATUS_COLORS[c.status] ?? STATUS_COLORS.lead}
                        >
                          {c.status}
                        </span>
                      </td>

                      {/* Added */}
                      <td className="px-4 py-3 text-sm hidden lg:table-cell" style={{ color: 'var(--text-3)' }}>
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>
              Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary p-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-2 text-sm" style={{ color: 'var(--text-2)' }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary p-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
