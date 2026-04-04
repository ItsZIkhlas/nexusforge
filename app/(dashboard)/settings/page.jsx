import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PLANS, TRIAL_LIMITS } from '@/lib/stripe'
import SettingsClient from './SettingsClient'

export const metadata = { title: 'Settings — NexusForge' }

// Serialize a plan config — Infinity can't cross the server/client boundary
function serializePlan(p) {
  return {
    ...p,
    maxBots:     p.maxBots     === Infinity ? -1 : p.maxBots,
    maxContacts: p.maxContacts === Infinity ? -1 : p.maxContacts,
    emailSends:  p.emailSends  === Infinity ? -1 : p.emailSends,
  }
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!org) redirect('/onboarding')

  const status  = org.subscription_status ?? 'inactive'
  const planId  = org.plan_id ?? 'starter'
  // While trialing, use the restricted trial limits rather than full starter limits
  const plan    = status === 'trialing' ? TRIAL_LIMITS : (PLANS[planId] ?? PLANS.starter)

  // Fetch usage counts, brand profile, and social connections in parallel
  const [
    { count: botCount },
    { count: contactCount },

    { data: brandProfile },
    { data: socialConnections },
  ] = await Promise.all([
    supabase.from('bots').select('id', { count: 'exact', head: true }).eq('org_id', org.id),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('org_id', org.id),
    supabase.from('brand_profiles').select('runway_api_key, linkedin_name').eq('org_id', org.id).maybeSingle(),
    supabase.from('org_social_connections').select('id, platform, platform_username, facebook_page_name').eq('org_id', org.id),
  ])

  return (
    <SettingsClient
      user={{ id: user.id, email: user.email }}
      org={{
        id:                  org.id,
        name:                org.name,
        plan_id:             planId,
        subscription_status: org.subscription_status ?? 'inactive',
        stripe_customer_id:  org.stripe_customer_id ?? null,
        trial_ends_at:       org.trial_ends_at ?? null,
        lead_credits_used:   org.lead_credits_used ?? 0,
        resend_from_name:    org.resend_from_name  ?? '',
        resend_from_email:   org.resend_from_email ?? '',
        physical_address:    org.physical_address  ?? '',
      }}
      plan={serializePlan(plan)}
      plans={Object.fromEntries(Object.entries(PLANS).map(([k, p]) => [k, serializePlan(p)]))}
      counts={{
        bots:            botCount     ?? 0,
        contacts:        contactCount ?? 0,
        leadCreditsUsed: org.lead_credits_used ?? 0,
      }}
      linkedinName={brandProfile?.linkedin_name ?? null}
      hasRunwayKey={!!(brandProfile?.runway_api_key)}
      socialConnections={socialConnections ?? []}
    />
  )
}
