'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Zap, Search, Users, Mail, PenLine, Bot,
  BrainCircuit, ArrowRight, Check, ChevronDown, KanbanSquare,
  X, Sparkles,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────

function useScrollY() {
  const [y, setY] = useState(0)
  useEffect(() => {
    const h = () => setY(window.scrollY)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])
  return y
}

function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView]
}

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

const MODULES = [
  { icon: Search,       label: 'Lead Finder',    color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.28)', desc: 'Find 275M+ verified contacts by role, industry, and location.' },
  { icon: Users,        label: 'CRM',            color: '#22d3ee', bg: 'rgba(34,211,238,0.12)',  border: 'rgba(34,211,238,0.28)', desc: 'Full contact management with activity timeline and deals.' },
  { icon: KanbanSquare, label: 'Pipeline',       color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.28)', desc: 'Drag-and-drop Kanban from Lead to Closed Won.' },
  { icon: Mail,         label: 'Email Outreach', color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.28)', desc: 'AI writes multi-step sequences. Track opens and clicks live.' },
  { icon: PenLine,      label: 'Content Studio', color: '#ec4899', bg: 'rgba(236,72,153,0.12)',  border: 'rgba(236,72,153,0.28)', desc: 'LinkedIn posts, blogs, ad copy — all sounding like you.' },
  { icon: Bot,          label: 'AI Chatbot',     color: '#a5b4fc', bg: 'rgba(165,180,252,0.12)', border: 'rgba(165,180,252,0.28)', desc: 'Smart widget that turns visitors into leads while you sleep.' },
  { icon: BrainCircuit, label: 'AI Advisor',     color: '#c084fc', bg: 'rgba(192,132,252,0.12)', border: 'rgba(192,132,252,0.28)', desc: 'Ask anything about your data. Get answers with full context.' },
]

const COMPETITORS = [
  { name: 'Apollo.io',   what: 'Lead finding',   price: 99  },
  { name: 'Instantly',   what: 'Cold email',     price: 97  },
  { name: 'Intercom',    what: 'AI chatbot',     price: 100 },
  { name: 'HubSpot CRM', what: 'CRM & pipeline', price: 50  },
]

const TOTAL_OLD = COMPETITORS.reduce((s, c) => s + c.price, 0)

// ─────────────────────────────────────────────────────────────────────────────
// Shared
// ─────────────────────────────────────────────────────────────────────────────

function GridOverlay({ opacity = 0.015 }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      backgroundImage: `linear-gradient(rgba(255,255,255,${opacity}) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,${opacity}) 1px, transparent 1px)`,
      backgroundSize: '60px 60px',
      maskImage: 'radial-gradient(ellipse 90% 90% at 50% 50%, black 30%, transparent 100%)',
    }} />
  )
}

// Fade + slide in on viewport entry
function Reveal({ children, delay = 0, from = 'bottom', style: extraStyle = {} }) {
  const [ref, inView] = useInView(0.1)
  const origin = { bottom: 'translateY(36px)', left: 'translateX(-36px)', right: 'translateX(36px)', top: 'translateY(-24px)' }
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'none' : (origin[from] ?? 'translateY(36px)'),
      transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
      ...extraStyle,
    }}>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────────────────────

const FAQS = [
  { q: 'Do I need technical skills to use NexusForge?',  a: 'None at all. Every feature is built for non-technical business owners. Click, type, done.' },
  { q: 'Can I really replace all these tools with one?', a: 'Yes. NexusForge gives you lead finding, email outreach, CRM, AI chatbot, content generation, and an AI advisor — fully integrated, under one login.' },
  { q: 'How does the 14-day free trial work?',           a: "Sign up, get full access for 14 days — no credit card required. Pick a plan when you're ready." },
  { q: 'What AI model does NexusForge use?',                  a: 'All AI features run on state-of-the-art large language models. Fast, accurate, and always improving.' },
  { q: 'Can I cancel anytime?',                          a: 'Yes. No contracts, no lock-in. Cancel from your account settings in 30 seconds.' },
]

function FAQ({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      borderRadius: 12, overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.06)',
      background: open ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)',
      transition: 'background 0.2s',
    }}>
      <button onClick={() => setOpen(v => !v)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#e4eaf8' }}>{q}</span>
        <ChevronDown style={{ width: 16, height: 16, color: '#3d4f6b', flexShrink: 0, marginLeft: 16, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      <div style={{ maxHeight: open ? 200 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
        <p style={{ padding: '0 24px 18px', fontSize: 13, color: '#3d4f6b', lineHeight: 1.75 }}>{a}</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const scrollY = useScrollY()
  const [heroVisible, setHeroVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  const navBlur = scrollY > 50

  return (
    <div style={{ minHeight: '100vh', background: '#07090f', color: '#e4eaf8', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", overflowX: 'hidden' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(32px) } to { opacity:1; transform:none } }
        @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
        @keyframes badgeIn  { from { opacity:0; transform:scale(0.88) } to { opacity:1; transform:none } }
        @keyframes floatA   { 0%,100%{transform:translateY(0px)}  50%{transform:translateY(-10px)} }
        @keyframes floatB   { 0%,100%{transform:translateY(0px)}  50%{transform:translateY(-14px)} }
        @keyframes floatC   { 0%,100%{transform:translateY(0px)}  50%{transform:translateY(-7px)} }
        @keyframes shimmer  { from{background-position:200% center} to{background-position:-200% center} }
        @keyframes pulse    { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
        .nexus-nav-link { color:#3d4f6b; text-decoration:none; font-size:13px; font-weight:500; transition:color 0.15s; }
        .nexus-nav-link:hover { color:#e4eaf8; }
        .nexus-btn-primary {
          display:inline-flex; align-items:center; gap:8px; padding:14px 28px;
          background:#5c60f5; color:#fff; border-radius:12px; font-size:14px; font-weight:700;
          text-decoration:none; transition:background 0.15s,box-shadow 0.15s,transform 0.15s;
          box-shadow:0 4px 24px rgba(92,96,245,0.38); font-family:inherit; border:none; cursor:pointer;
        }
        .nexus-btn-primary:hover { background:#7173f7; box-shadow:0 6px 32px rgba(92,96,245,0.5); transform:translateY(-1px); }
        .nexus-btn-secondary {
          display:inline-flex; align-items:center; gap:8px; padding:14px 28px;
          border:1px solid rgba(255,255,255,0.1); color:#8896b3; border-radius:12px;
          font-size:14px; font-weight:600; text-decoration:none; transition:border-color 0.15s,color 0.15s,transform 0.15s;
          font-family:inherit;
        }
        .nexus-btn-secondary:hover { border-color:rgba(255,255,255,0.22); color:#e4eaf8; transform:translateY(-1px); }
        .module-card {
          border-radius:16px; padding:24px; cursor:default;
          transition:transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .module-card:hover { transform:translateY(-4px); }
        @media (max-width: 768px) {
          .nexus-nav-links  { display: none !important; }
          .nexus-nav-login  { display: none !important; }
          .nexus-nav-inner  { padding: 0 20px !important; }
          .nexus-section    { padding-left: 20px !important; padding-right: 20px !important; }
          .nexus-problem-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .nexus-steps-grid   { grid-template-columns: repeat(2,1fr) !important; gap: 12px !important; margin-top: 40px !important; }
          .nexus-modules-grid { grid-template-columns: repeat(2,1fr) !important; }
          .nexus-pricing-grid { grid-template-columns: 1fr !important; max-width: 400px; margin-left: auto !important; margin-right: auto !important; }
        }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, height: 60,
        background: navBlur ? 'rgba(7,9,15,0.9)' : 'transparent',
        backdropFilter: navBlur ? 'blur(20px)' : 'none',
        borderBottom: navBlur ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}>
        <div className="nexus-nav-inner" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.svg" alt="NexusForge" style={{ width: 32, height: 32 }} />
            <span style={{ fontSize: 16, fontWeight: 800, color: '#e4eaf8', letterSpacing: '-0.02em' }}>NexusForge</span>
          </div>
          <div className="nexus-nav-links" style={{ display: 'flex', gap: 28 }}>
            {['#problem', '#modules', '#pricing', '#faq'].map((href, i) => (
              <a key={href} href={href} className="nexus-nav-link">
                {['The problem', 'Features', 'Pricing', 'FAQ'][i]}
              </a>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/login" className="nexus-nav-login" style={{ fontSize: 13, fontWeight: 500, color: '#4a5a78', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#e4eaf8'}
              onMouseLeave={e => e.currentTarget.style.color = '#4a5a78'}>
              Log in
            </Link>
            <Link href="/signup" className="nexus-btn-primary" style={{ padding: '9px 18px', fontSize: 13, borderRadius: 9 }}>
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingTop: 60 }}>

        {/* Glows */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, background: 'radial-gradient(ellipse, rgba(92,96,245,0.13) 0%, transparent 68%)', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(139,92,246,0.09) 0%, transparent 70%)', filter: 'blur(50px)' }} />
          <div style={{ position: 'absolute', bottom: '15%', left: '8%', width: 280, height: 280, background: 'radial-gradient(circle, rgba(236,72,153,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }} />
          <GridOverlay opacity={0.014} />
        </div>

        {/* Floating module chips */}
        {heroVisible && [
          { mod: MODULES[0], pos: { top: '20%', left: '4%' },    anim: 'floatA 4s ease-in-out infinite',   delay: '0s' },
          { mod: MODULES[2], pos: { top: '24%', right: '4%' },   anim: 'floatB 5s ease-in-out infinite',   delay: '0.7s' },
          { mod: MODULES[3], pos: { bottom: '30%', left: '3%' }, anim: 'floatC 4.5s ease-in-out infinite', delay: '1.2s' },
          { mod: MODULES[4], pos: { bottom: '20%', right: '4%'}, anim: 'floatA 5.5s ease-in-out infinite', delay: '0.9s' },
          { mod: MODULES[5], pos: { top: '60%', right: '8%' },   anim: 'floatB 4.2s ease-in-out infinite', delay: '0.4s' },
        ].map(({ mod, pos, anim, delay }, fi) => {
          const Icon = mod.icon
          return (
            <div key={fi} style={{
              position: 'absolute', display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 14px', borderRadius: 12,
              background: mod.bg, border: `1px solid ${mod.border}`,
              backdropFilter: 'blur(10px)',
              fontSize: 12, fontWeight: 600, color: mod.color,
              whiteSpace: 'nowrap', pointerEvents: 'none',
              animation: `fadeIn 0.6s ease ${delay} both, ${anim} ${delay}`,
              ...pos,
            }}>
              <Icon style={{ width: 13, height: 13 }} />
              {mod.label}
            </div>
          )
        })}

        {/* Main content */}
        <div style={{ maxWidth: 820, textAlign: 'center', position: 'relative', zIndex: 1, padding: '0 40px' }}>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 16px', borderRadius: 999, marginBottom: 32,
            background: 'rgba(92,96,245,0.1)', border: '1px solid rgba(92,96,245,0.25)',
            animation: heroVisible ? 'badgeIn 0.5s ease 0.05s both' : 'none',
          }}>
            <Sparkles style={{ width: 11, height: 11, color: '#a8abfc' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#a8abfc', letterSpacing: '0.06em' }}>THE ALL-IN-ONE BUSINESS PLATFORM</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(42px, 7vw, 88px)', fontWeight: 900, lineHeight: 1.0,
            letterSpacing: '-0.04em', marginBottom: 28,
            animation: heroVisible ? 'fadeUp 0.7s ease 0.15s both' : 'none',
          }}>
            <span style={{ color: '#e4eaf8' }}>Your entire business.</span><br />
            <span style={{
              background: 'linear-gradient(135deg, #a8abfc 0%, #8b5cf6 50%, #ec4899 100%)',
              backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundSize: '200% auto', animation: 'shimmer 4s linear infinite',
            }}>
              One platform.
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(15px, 1.8vw, 19px)', color: '#4a5a78', lineHeight: 1.65,
            maxWidth: 560, margin: '0 auto 40px',
            animation: heroVisible ? 'fadeUp 0.7s ease 0.3s both' : 'none',
          }}>
            Find leads, run email outreach, manage your CRM, generate content,
            and deploy a chatbot — all connected, all from one dashboard.
          </p>

          <div style={{
            display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap',
            animation: heroVisible ? 'fadeUp 0.7s ease 0.45s both' : 'none',
          }}>
            <Link href="/signup" className="nexus-btn-primary">
              Start free — 14 days <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
            <a href="#problem" className="nexus-btn-secondary">
              See how it works <ChevronDown style={{ width: 16, height: 16 }} />
            </a>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 48, flexWrap: 'wrap',
            animation: heroVisible ? 'fadeUp 0.7s ease 0.6s both' : 'none',
          }}>
            {['No credit card required', '14-day free trial', 'Cancel anytime'].map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check style={{ width: 8, height: 8, color: '#6ee7b7' }} />
                </div>
                <span style={{ fontSize: 12, color: '#3d4f6b', fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 36, flexWrap: 'wrap',
            animation: heroVisible ? 'fadeUp 0.7s ease 0.72s both' : 'none',
          }}>
            <span style={{ fontSize: 11, color: '#2a3550', fontWeight: 600 }}>Replaces:</span>
            {COMPETITORS.map((c, i) => (
              <span key={i} style={{ fontSize: 11, color: '#3d4f6b', fontWeight: 500, padding: '3px 10px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                {c.name}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, animation: heroVisible ? 'fadeIn 1s ease 1.2s both' : 'none' }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#1e293b' }}>Scroll</span>
          <div style={{ width: 1, height: 32, background: 'linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)' }} />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          THE PROBLEM
      ══════════════════════════════════════════ */}
      <section id="problem" className="nexus-section" style={{ position: 'relative', padding: '120px 40px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(244,63,94,0.06) 0%, transparent 70%)' }} />
        <GridOverlay opacity={0.012} />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          <Reveal style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#f43f5e', marginBottom: 14 }}>The problem</div>
            <h2 style={{ fontSize: 'clamp(30px, 4.5vw, 56px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', color: '#e4eaf8', maxWidth: 640, margin: '0 auto 16px' }}>
              You&apos;re paying for 6 tools<br />
              <span style={{ color: '#f43f5e' }}>that don&apos;t talk to each other.</span>
            </h2>
            <p style={{ fontSize: 15, color: '#4a5a78', lineHeight: 1.7, maxWidth: 440, margin: '0 auto' }}>
              Every time a lead comes in, you manually copy data between 5 different tabs.
              There&apos;s a better way.
            </p>
          </Reveal>

          <div className="nexus-problem-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center', maxWidth: 900, margin: '0 auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {COMPETITORS.map((c, i) => (
                <Reveal key={c.name} delay={i * 0.08}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 20px', borderRadius: 14,
                    background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.14)',
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#e4eaf8' }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: '#4a5a78', marginTop: 2 }}>{c.what}</div>
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#f43f5e' }}>${c.price}/mo</div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal from="right">
              <div style={{ padding: '36px', borderRadius: 24, background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.16)', textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f87171', marginBottom: 16 }}>Your monthly bill</div>
                <div style={{ fontSize: 'clamp(64px, 10vw, 100px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: '#f43f5e', marginBottom: 12 }}>
                  ${TOTAL_OLD}
                </div>
                <div style={{ fontSize: 14, color: '#4a5a78', lineHeight: 1.65 }}>
                  per month, minimum<br />
                  <span style={{ color: '#2a3550' }}>and they still don&apos;t sync</span>
                </div>
                <div style={{ marginTop: 28, padding: '14px 20px', borderRadius: 12, background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
                  <div style={{ fontSize: 13, color: '#f87171', fontWeight: 600 }}>= ${TOTAL_OLD * 12}/year wasted</div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          THE SOLUTION
      ══════════════════════════════════════════ */}
      <section className="nexus-section" style={{ position: 'relative', padding: '120px 40px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(92,96,245,0.08) 0%, transparent 70%)' }} />
        <GridOverlay opacity={0.013} />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          <Reveal style={{ textAlign: 'center', marginBottom: 72 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a8abfc', marginBottom: 14 }}>The solution</div>
            <h2 style={{ fontSize: 'clamp(30px, 4.5vw, 56px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', color: '#e4eaf8', maxWidth: 600, margin: '0 auto 16px' }}>
              One platform.<br />
              <span style={{ color: '#a8abfc' }}>Everything connected.</span>
            </h2>
            <p style={{ fontSize: 15, color: '#4a5a78', lineHeight: 1.7, maxWidth: 460, margin: '0 auto' }}>
              Find a lead, enroll them in email outreach, track them in CRM, and greet them
              with your chatbot — all automatically, all in one place.
            </p>
          </Reveal>

          <HubDiagram />

          <div className="nexus-steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 72 }}>
            {[
              { step: '01', label: 'Find leads',           color: '#8b5cf6', desc: 'Search 275M+ verified contacts by role, industry, location.' },
              { step: '02', label: 'Enroll in outreach',   color: '#fb923c', desc: 'AI writes the sequence. It sends automatically.' },
              { step: '03', label: 'Track in CRM',         color: '#22d3ee', desc: 'Every interaction logged. Pipeline updated.' },
              { step: '04', label: 'Convert with chatbot', color: '#10b981', desc: 'AI chat captures leads while you sleep.' },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div style={{ padding: '24px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: item.color, marginBottom: 10 }}>STEP {item.step}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#e4eaf8', marginBottom: 8 }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: '#4a5a78', lineHeight: 1.65 }}>{item.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          MODULES GRID
      ══════════════════════════════════════════ */}
      <section id="modules" className="nexus-section" style={{ position: 'relative', padding: '120px 40px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139,92,246,0.06) 0%, transparent 70%)' }} />
        <GridOverlay opacity={0.012} />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          <Reveal style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8b5cf6', marginBottom: 14 }}>7 modules</div>
            <h2 style={{ fontSize: 'clamp(30px, 4.5vw, 52px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', color: '#e4eaf8', maxWidth: 560, margin: '0 auto 16px' }}>
              Every tool your business needs.<br />
              <span style={{ color: '#a8abfc' }}>Built in.</span>
            </h2>
          </Reveal>

          <div className="nexus-modules-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {MODULES.map((mod, i) => {
              const Icon = mod.icon
              return (
                <Reveal key={mod.label} delay={i * 0.06}>
                  <div className="module-card" style={{ background: mod.bg, border: `1px solid ${mod.border}` }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 32px ${mod.color}20`; e.currentTarget.style.borderColor = mod.color + '60' }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = mod.border }}>
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: `${mod.color}18`, border: `1px solid ${mod.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                      <Icon style={{ width: 18, height: 18, color: mod.color }} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#e4eaf8', marginBottom: 8 }}>{mod.label}</div>
                    <div style={{ fontSize: 12, color: '#4a5a78', lineHeight: 1.65 }}>{mod.desc}</div>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════ */}
      <section id="pricing" className="nexus-section" style={{ position: 'relative', padding: '120px 40px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(16,185,129,0.06) 0%, transparent 70%)' }} />
        <GridOverlay opacity={0.012} />

        <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          <Reveal style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6ee7b7', marginBottom: 14 }}>Pricing</div>
            <h2 style={{ fontSize: 'clamp(30px, 4.5vw, 52px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', color: '#e4eaf8', marginBottom: 16 }}>
              Cancel 4 subscriptions.<br />
              <span style={{ color: '#6ee7b7' }}>Start one.</span>
            </h2>
            <p style={{ fontSize: 15, color: '#4a5a78', lineHeight: 1.65, maxWidth: 440, margin: '0 auto' }}>
              Everything those tools cost you ${TOTAL_OLD}/mo combined. NexusForge starts at $99.
            </p>
          </Reveal>

          <div className="nexus-pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              {
                name: 'Starter', price: 99, highlight: false,
                features: ['200 lead credits/mo', '1,000 contacts', '3,000 email sends/mo', '1 chatbot', 'Content Studio', 'AI Advisor'],
              },
              {
                name: 'Pro', price: 199, highlight: true,
                features: ['1,000 lead credits/mo', '10,000 contacts', '25,000 email sends/mo', '5 chatbots', 'Priority support', 'Everything in Starter'],
              },
              {
                name: 'Business', price: 299, highlight: false,
                features: ['5,000 lead credits/mo', 'Unlimited contacts', 'Unlimited email sends', 'Unlimited chatbots', 'Dedicated support', 'Everything in Pro'],
              },
            ].map((plan, i) => (
              <Reveal key={plan.name} delay={i * 0.1}>
                <div style={{
                  borderRadius: 20, padding: '32px 28px', position: 'relative',
                  background: plan.highlight ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${plan.highlight ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  boxShadow: plan.highlight ? '0 0 60px rgba(139,92,246,0.12)' : 'none',
                  display: 'flex', flexDirection: 'column',
                }}>
                  {plan.highlight && (
                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', padding: '4px 14px', borderRadius: 999, background: '#8b5cf6', fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                      MOST POPULAR
                    </div>
                  )}
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#e4eaf8', marginBottom: 4 }}>{plan.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 24, marginTop: 8 }}>
                    <span style={{ fontSize: 42, fontWeight: 900, color: '#e4eaf8', letterSpacing: '-0.03em' }}>${plan.price}</span>
                    <span style={{ fontSize: 13, color: '#3d4f6b' }}>/mo</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, flex: 1 }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: plan.highlight ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${plan.highlight ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Check style={{ width: 9, height: 9, color: plan.highlight ? '#a78bfa' : '#52525b' }} />
                        </div>
                        <span style={{ fontSize: 13, color: '#8896b3' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/signup" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '13px', borderRadius: 12, fontWeight: 700, fontSize: 14,
                    background: plan.highlight ? '#8b5cf6' : 'rgba(255,255,255,0.05)',
                    color: plan.highlight ? '#fff' : '#8896b3',
                    border: `1px solid ${plan.highlight ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
                    textDecoration: 'none', transition: 'all 0.15s',
                    boxShadow: plan.highlight ? '0 4px 20px rgba(139,92,246,0.4)' : 'none',
                  }}>
                    Get started <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <p style={{ textAlign: 'center', fontSize: 13, color: '#2a3550', marginTop: 28 }}>
              All plans include a 14-day free trial · No credit card required · Cancel anytime
            </p>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════ */}
      <section id="faq" className="nexus-section" style={{ maxWidth: 720, margin: '0 auto', padding: '80px 40px 120px' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#5c60f5', marginBottom: 12 }}>FAQ</div>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 800, letterSpacing: '-0.02em', color: '#e4eaf8' }}>Common questions</h2>
        </Reveal>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FAQS.map((faq, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <FAQ q={faq.q} a={faq.a} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════ */}
      <section className="nexus-section" style={{ position: 'relative', overflow: 'hidden', padding: '100px 40px 140px', textAlign: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(92,96,245,0.10) 0%, transparent 70%)' }} />
        <GridOverlay opacity={0.012} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 560, margin: '0 auto' }}>
          <Reveal>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#5c60f5', marginBottom: 16 }}>Get started today</div>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 60px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', color: '#e4eaf8', marginBottom: 20 }}>
              One platform.<br />
              <span style={{ color: '#a8abfc' }}>Zero tool chaos.</span>
            </h2>
            <p style={{ fontSize: 15, color: '#3d4f6b', lineHeight: 1.7, maxWidth: 400, margin: '0 auto 36px' }}>
              14-day free trial. No credit card required. Every module, from day one.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/signup" className="nexus-btn-primary">
                Start free trial <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
              <Link href="/pricing" className="nexus-btn-secondary">View pricing</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="nexus-section" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '32px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo.svg" alt="NexusForge" style={{ width: 24, height: 24 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#e4eaf8' }}>NexusForge</span>
          </div>
          <p style={{ fontSize: 12, color: '#2a3550' }}>© 2025 NexusForge. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms',   href: '/terms' },
              { label: 'Contact', href: 'mailto:hello@usenexus.app' },
            ].map(({ label, href }) => (
              <a key={label} href={href} style={{ fontSize: 12, color: '#2a3550', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#e4eaf8'}
                onMouseLeave={e => e.currentTarget.style.color = '#2a3550'}>{label}</a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Hub Diagram
// ─────────────────────────────────────────────────────────────────────────────

function HubDiagram() {
  const [ref, inView] = useInView(0.2)

  return (
    <div ref={ref} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: 380 }}>

      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
        {MODULES.map((mod, i) => {
          const angle = (i / MODULES.length) * 2 * Math.PI - Math.PI / 2
          const rx    = 38
          const ry    = 42
          const x2    = 50 + Math.cos(angle) * rx
          const y2    = 50 + Math.sin(angle) * ry
          return (
            <line key={i}
              x1="50%" y1="50%"
              x2={`${x2}%`} y2={`${y2}%`}
              stroke={mod.color}
              strokeWidth="1"
              strokeDasharray="160"
              strokeDashoffset={inView ? 0 : 160}
              opacity={inView ? 0.3 : 0}
              style={{ transition: `stroke-dashoffset 0.7s ease ${0.2 + i * 0.07}s, opacity 0.4s ease ${0.2 + i * 0.07}s` }}
            />
          )
        })}
      </svg>

      {/* Center hub */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: 80, height: 80, borderRadius: 22,
        background: 'linear-gradient(135deg, #1e1b4b, #2e1065)',
        boxShadow: inView ? '0 0 60px rgba(92,96,245,0.5)' : '0 0 0px rgba(92,96,245,0)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: inView ? 'scale(1)' : 'scale(0.4)',
        transition: 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.1s, box-shadow 0.6s ease 0.1s',
        border: '1px solid rgba(139,92,246,0.35)',
      }}>
        <img src="/logo.svg" alt="NexusForge" style={{ width: 48, height: 48 }} />
        <div style={{
          position: 'absolute', inset: -8, borderRadius: 30,
          border: '1px solid rgba(92,96,245,0.4)',
          animation: inView ? 'pulse 2.5s ease-in-out infinite' : 'none',
        }} />
      </div>

      {/* Module icons */}
      {MODULES.map((mod, i) => {
        const angle = (i / MODULES.length) * 2 * Math.PI - Math.PI / 2
        const rx    = 38
        const ry    = 42
        const x     = 50 + Math.cos(angle) * rx
        const y     = 50 + Math.sin(angle) * ry
        const Icon  = mod.icon
        return (
          <div key={mod.label} style={{
            position: 'absolute',
            left: `${x}%`, top: `${y}%`,
            transform: inView ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0)',
            opacity: inView ? 1 : 0,
            transition: `transform 0.5s cubic-bezier(0.34,1.4,0.64,1) ${0.25 + i * 0.07}s, opacity 0.4s ease ${0.25 + i * 0.07}s`,
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 13,
              background: mod.bg, border: `1px solid ${mod.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 16px ${mod.color}22`,
            }}>
              <Icon style={{ width: 18, height: 18, color: mod.color }} />
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: mod.color, textAlign: 'center', marginTop: 5, whiteSpace: 'nowrap' }}>
              {mod.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}
