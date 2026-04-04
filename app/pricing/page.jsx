import Link from 'next/link'
import { Zap, Check, ArrowLeft } from 'lucide-react'

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 99,
    description: 'Perfect for solo founders and small businesses getting started.',
    highlight: false,
    features: [
      '1 chatbot',
      '200 lead credits/month',
      '1,000 contacts in CRM',
      '3,000 emails/month',
      'Content Studio (all templates)',
      'AI Advisor',
      'Analytics dashboard',
      '14-day free trial',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 199,
    description: 'For growing businesses that need more reach and automation.',
    highlight: true,
    features: [
      '5 chatbots',
      '1,000 lead credits/month',
      '10,000 contacts in CRM',
      '25,000 emails/month',
      'Content Studio (all templates)',
      'AI Advisor',
      'Analytics dashboard',
      'Priority support',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 299,
    description: 'Unlimited everything for scaling teams and agencies.',
    highlight: false,
    features: [
      'Unlimited chatbots',
      '5,000 lead credits/month',
      'Unlimited contacts',
      'Unlimited emails',
      'Content Studio (all templates)',
      'AI Advisor',
      'Full analytics + weekly digest',
      'Priority support',
    ],
  },
]

function PricingCard({ plan }) {
  return (
    <div className={`relative flex flex-col rounded-2xl p-8 border transition-colors
      ${plan.highlight
        ? 'bg-indigo-600 border-indigo-500 shadow-2xl shadow-indigo-500/20'
        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
      }`}
    >
      {plan.highlight && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-white text-indigo-700 text-xs font-bold px-4 py-1.5 rounded-full">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className={`text-lg font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-slate-100'}`}>
          {plan.name}
        </h3>
        <p className={`text-sm leading-relaxed ${plan.highlight ? 'text-indigo-200' : 'text-slate-400'}`}>
          {plan.description}
        </p>
      </div>

      <div className="mb-6">
        <span className={`text-5xl font-bold ${plan.highlight ? 'text-white' : 'text-slate-100'}`}>
          ${plan.price}
        </span>
        <span className={`text-sm ml-1 ${plan.highlight ? 'text-indigo-200' : 'text-slate-400'}`}>/month</span>
      </div>

      <PricingButton plan={plan} />

      <ul className="mt-6 space-y-3 flex-1">
        {plan.features.map(f => (
          <li key={f} className="flex items-start gap-2.5">
            <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlight ? 'text-white' : 'text-indigo-400'}`} />
            <span className={`text-sm ${plan.highlight ? 'text-indigo-100' : 'text-slate-300'}`}>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PricingButton({ plan }) {
  const base = 'w-full py-3 rounded-xl font-semibold text-sm transition mt-1'

  if (plan.highlight) {
    return (
      <CheckoutButton planId={plan.id} className={`${base} bg-white text-indigo-700 hover:bg-indigo-50`} />
    )
  }

  return (
    <CheckoutButton planId={plan.id} className={`${base} border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white`} />
  )
}

// Client component wrapper
function CheckoutButton({ planId, className }) {
  // This will be a server-rendered link for now; can be made client for direct checkout
  return (
    <Link href="/signup" className={`${className} block text-center`}>
      Start free trial
    </Link>
  )
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* Navbar */}
      <nav className="border-b border-slate-800/60 bg-slate-950">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-white tracking-tight">NexusForge</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-500 transition"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-12 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-100 mb-4">
          Simple, honest pricing
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Starter includes a 14-day free trial. No credit card required.
          Cancel any time.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-sm text-indigo-400">
          <Zap className="w-3.5 h-3.5 fill-indigo-400" />
          Replaces $158–385/mo in separate tools
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map(plan => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>

        {/* Comparison footnote */}
        <div className="mt-10 text-center">
          <p className="text-slate-500 text-sm">
            All plans replace: Apollo.io · Instantly · Intercom/Tidio · HubSpot CRM · Jasper.ai
          </p>
        </div>
      </div>

      {/* FAQ section */}
      <div className="max-w-2xl mx-auto px-6 pb-20 space-y-4">
        <h2 className="text-2xl font-bold text-slate-100 text-center mb-8">
          Billing questions
        </h2>

        {[
          {
            q: 'What happens after the 14-day trial?',
            a: "You'll be asked to choose a plan. If you don't, your account is paused — no charges.",
          },
          {
            q: 'Can I switch plans later?',
            a: 'Yes. Upgrade or downgrade any time. Changes take effect immediately and are prorated.',
          },
          {
            q: 'Do lead credits roll over?',
            a: "Lead credits reset at the start of each billing month and don't roll over.",
          },
        ].map(({ q, a }) => (
          <details key={q} className="group bg-slate-900 border border-slate-800 rounded-xl">
            <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none font-medium text-slate-200 hover:text-white">
              {q}
              <span className="text-slate-500 group-open:rotate-45 transition-transform text-xl leading-none shrink-0 ml-4">+</span>
            </summary>
            <div className="px-6 pb-5 text-sm text-slate-400 leading-relaxed">{a}</div>
          </details>
        ))}
      </div>
    </div>
  )
}
