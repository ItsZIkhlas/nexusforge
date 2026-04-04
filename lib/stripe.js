import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

// Limits during the 14-day free trial (intentionally restricted to encourage upgrade)
export const TRIAL_LIMITS = {
  name:            'Free Trial',
  price:           0,
  maxBots:         1,
  maxContacts:     100,
  leadCredits:     10,
  emailSends:      0,
  dailyEmailLimit: 0,
  searchesPerHour: 5,
  maxWebsites:     1,
  description:     '14-day free trial with limited access.',
}

// NexusForge pricing — replaces 6 separate SaaS tools costing $158–385/mo
// Positioning: "Cancel 6 subscriptions. Get one."
export const PLANS = {
  starter: {
    name:            'Starter',
    price:           99,
    priceId:         process.env.STRIPE_PRICE_STARTER,
    maxBots:         1,
    maxContacts:     1000,
    leadCredits:     200,
    emailSends:      3000,
    dailyEmailLimit: 200,
    searchesPerHour: 20,
    maxWebsites:     1,
    description:     'Perfect for solo founders and small businesses getting started.',
  },
  pro: {
    name:            'Pro',
    price:           199,
    priceId:         process.env.STRIPE_PRICE_PRO,
    maxBots:         5,
    maxContacts:     10000,
    leadCredits:     1000,
    emailSends:      25000,
    dailyEmailLimit: 500,
    searchesPerHour: 50,
    maxWebsites:     5,
    description:     'For growing businesses that need more reach and automation.',
  },
  business: {
    name:            'Business',
    price:           299,
    priceId:         process.env.STRIPE_PRICE_BUSINESS,
    maxBots:         Infinity,
    maxContacts:     Infinity,
    leadCredits:     5000,
    emailSends:      Infinity,
    dailyEmailLimit: 2000,
    searchesPerHour: 100,
    maxWebsites:     Infinity,
    description:     'Unlimited everything for scaling teams and agencies.',
  },
}

// Returns true if the org is allowed to use the product
export function isSubscriptionActive(org) {
  return ['trialing', 'active', 'past_due'].includes(org.subscription_status)
}

// Returns true if the org is on a trial that hasn't expired
export function isTrialing(org) {
  if (org.subscription_status !== 'trialing') return false
  if (!org.trial_ends_at) return false
  return new Date(org.trial_ends_at) > new Date()
}
