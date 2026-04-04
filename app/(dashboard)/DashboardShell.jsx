'use client'

import { useState } from 'react'
import { Zap, LogOut, Menu, X } from 'lucide-react'
import SidebarNav from './SidebarNav'

export default function DashboardShell({ children, orgName, initials, username, email }) {
  const [open, setOpen] = useState(false)

  function close() { setOpen(false) }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-page)' }}>

      {/* ── Mobile top bar ──────────────────────────────────────────── */}
      <header
        className="lg:hidden fixed top-0 inset-x-0 h-14 z-20 flex items-center justify-between px-4"
        style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-soft)' }}
      >
        <button
          onClick={() => setOpen(true)}
          className="p-2 -ml-1 rounded-lg transition-colors"
          style={{ color: 'var(--text-3)' }}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Centre logo */}
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="NexusForge" className="w-6 h-6 shrink-0" />
          <span className="text-[14px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            NexusForge
          </span>
        </div>

        {/* User avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--primary), #8b5cf6)' }}
        >
          {initials}
        </div>
      </header>

      {/* ── Mobile overlay ──────────────────────────────────────────── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30 backdrop-blur-sm"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 w-[228px] flex flex-col',
          'transition-transform duration-200 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
        ].join(' ')}
        style={{ background: 'var(--bg-panel)', borderRight: '1px solid var(--border-soft)' }}
      >
        {/* Logo */}
        <div
          className="h-14 px-4 flex items-center justify-between shrink-0"
          style={{ borderBottom: '1px solid var(--border-soft)' }}
        >
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="NexusForge" className="w-7 h-7 shrink-0" />
            <span className="text-[15px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              NexusForge
            </span>
          </div>
          {/* Close button — mobile only */}
          <button
            className="lg:hidden p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-3)' }}
            onClick={close}
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace badge */}
        <div
          className="px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid var(--border-soft)' }}
        >
          <p className="section-label mb-1.5">Workspace</p>
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: 'var(--secondary)', boxShadow: '0 0 6px rgba(16,185,129,0.6)' }}
            />
            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-2)' }}>
              {orgName}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <SidebarNav onNavClick={close} />

        {/* User footer */}
        <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--border-soft)' }}>
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg mb-0.5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg, var(--primary), #8b5cf6)' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium truncate" style={{ color: 'var(--text-2)' }}>
                {username}
              </p>
              <p className="text-[10px] truncate" style={{ color: 'var(--text-3)' }}>
                {email}
              </p>
            </div>
          </div>
          <form action="/api/auth/signout" method="post">
            <button
              className="flex w-full items-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors"
              style={{ color: 'var(--text-3)' }}
            >
              <LogOut className="w-3 h-3 shrink-0" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="flex-1 ml-0 lg:ml-[228px] min-h-screen overflow-auto pt-14 lg:pt-0">
        {children}
      </main>

    </div>
  )
}
