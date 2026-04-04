'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BrainCircuit,
  Search,
  Users,
  KanbanSquare,
  Mail,
  Globe,
  PenLine,
  Bot,
  BarChart3,
  Settings,
  HelpCircle,
} from 'lucide-react'

const sections = [
  {
    label: 'Main',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/advisor',   icon: BrainCircuit,    label: 'AI Advisor'  },
    ],
  },
  {
    label: 'Grow',
    items: [
      { href: '/leads',    icon: Search,       label: 'Lead Finder'    },
      { href: '/crm',      icon: Users,        label: 'CRM'            },
      { href: '/pipeline', icon: KanbanSquare, label: 'Pipeline'       },
      { href: '/outreach', icon: Mail,         label: 'Email Outreach' },
    ],
  },
  {
    label: 'Build',
    items: [
      { href: '/content',  icon: PenLine, label: 'Content Studio'  },
      { href: '/bots',     icon: Bot,     label: 'Chatbot'         },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/analytics', icon: BarChart3, label: 'Analytics' },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/settings', icon: Settings,   label: 'Settings'     },
      { href: '/help',     icon: HelpCircle, label: 'Help & Setup' },
    ],
  },
]

export default function SidebarNav({ onNavClick }) {
  const pathname = usePathname()

  function isActive(href) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <nav className="flex-1 overflow-y-auto no-scrollbar px-2 py-4 space-y-5">
      {sections.map(section => (
        <div key={section.label}>
          <p className="section-label px-3 mb-1.5">{section.label}</p>

          <div className="space-y-px">
            {section.items.map(({ href, icon: Icon, label }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavClick}
                  className="relative flex items-center gap-2.5 px-3 py-[7px] rounded-md
                    text-[13px] font-medium transition-all duration-100"
                  style={{
                    color:      active ? 'var(--text)'   : 'var(--text-3)',
                    background: active ? 'var(--bg-card)' : 'transparent',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.color      = 'var(--text-2)'
                      e.currentTarget.style.background = 'var(--bg-hover)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.color      = 'var(--text-3)'
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  {active && (
                    <span
                      className="absolute left-0 inset-y-[6px] w-[2px] rounded-r-full"
                      style={{ background: 'var(--primary)' }}
                    />
                  )}
                  <Icon
                    className="w-[15px] h-[15px] shrink-0"
                    style={{ color: active ? 'var(--primary-text)' : 'inherit' }}
                  />
                  {label}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
