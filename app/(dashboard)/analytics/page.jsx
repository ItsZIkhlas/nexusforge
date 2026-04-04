import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PLANS, TRIAL_LIMITS } from '@/lib/stripe'
import AnalyticsClient from './AnalyticsClient'

export const metadata = { title: 'Analytics — NexusForge' }

// Build a 30-day daily time series from an array of records with a date field
function buildTimeSeries(records, days = 30, field = 'created_at') {
  const counts = {}
  for (const r of (records ?? [])) {
    const day = (r[field] ?? '').slice(0, 10)
    if (day) counts[day] = (counts[day] ?? 0) + 1
  }
  const result = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    result.push({
      date:  key,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: counts[key] ?? 0,
    })
  }
  return result
}

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: org } = await supabase
    .from('organizations')
    .select('id, plan_id, subscription_status, lead_credits_used')
    .eq('owner_id', user.id)
    .single()
  if (!org) redirect('/onboarding')

  const planId  = org.plan_id ?? 'starter'
  const status  = org.subscription_status ?? 'inactive'
  const plan    = status === 'trialing' ? TRIAL_LIMITS : (PLANS[planId] ?? PLANS.starter)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // ── Phase 1: all independent queries ──────────────────────────────────────
  const [
    { count: totalContacts },
    { data: recentContacts },
    { data: allDeals },
    { data: contentPosts },
    { data: videoProjects },
    { data: sequences },
    { data: botList },
    { count: totalWebsites },
    { data: leadSearches },
  ] = await Promise.all([
    supabase.from('contacts').select('id',        { count: 'exact', head: true }).eq('org_id', org.id),
    supabase.from('contacts').select('created_at').eq('org_id', org.id).gte('created_at', thirtyDaysAgo),
    supabase.from('deals').select('stage, value, created_at').eq('org_id', org.id),
    supabase.from('content_posts').select('status').eq('org_id', org.id),
    supabase.from('video_projects').select('status').eq('org_id', org.id),
    supabase.from('email_sequences').select('id').eq('org_id', org.id),
    supabase.from('bots').select('id').eq('org_id', org.id),
    supabase.from('websites').select('id', { count: 'exact', head: true }).eq('org_id', org.id),
    supabase.from('lead_searches').select('created_at, credits_used').eq('org_id', org.id).gte('created_at', thirtyDaysAgo),
  ])

  const botIds       = (botList      ?? []).map(b => b.id)
  const sequenceIds  = (sequences    ?? []).map(s => s.id)

  // ── Phase 2: queries that depend on bot/sequence IDs ──────────────────────
  const [
    convCountResult,
    recentConvResult,
    enrollmentsResult,
  ] = await Promise.all([
    botIds.length
      ? supabase.from('conversations').select('id', { count: 'exact', head: true }).in('bot_id', botIds)
      : Promise.resolve({ count: 0 }),
    botIds.length
      ? supabase.from('conversations').select('created_at').in('bot_id', botIds).gte('created_at', thirtyDaysAgo)
      : Promise.resolve({ data: [] }),
    sequenceIds.length
      ? supabase.from('sequence_enrollments').select('id').in('sequence_id', sequenceIds)
      : Promise.resolve({ data: [] }),
  ])

  const totalConversations  = convCountResult.count   ?? 0
  const recentConversations = recentConvResult.data   ?? []
  const enrollmentIds       = (enrollmentsResult.data ?? []).map(e => e.id)

  // ── Phase 3: email events (depends on enrollments) ─────────────────────────
  let emailEvents = []
  if (enrollmentIds.length) {
    const { data: ev } = await supabase
      .from('email_events')
      .select('event_type')
      .in('enrollment_id', enrollmentIds)
    emailEvents = ev ?? []
  }

  // ── Aggregations ──────────────────────────────────────────────────────────

  // Deal pipeline
  const STAGE_ORDER = ['lead', 'contacted', 'interested', 'negotiating', 'won', 'lost']
  const stageCounts = {}
  let wonRevenue = 0
  let activeDeals = 0
  for (const d of (allDeals ?? [])) {
    stageCounts[d.stage] = (stageCounts[d.stage] ?? 0) + 1
    if (d.stage === 'won' && d.value) wonRevenue += Number(d.value)
    if (!['won', 'lost'].includes(d.stage)) activeDeals++
  }
  const dealsByStage = STAGE_ORDER
    .map(s => ({ stage: s.charAt(0).toUpperCase() + s.slice(1), count: stageCounts[s] ?? 0 }))
    .filter(d => d.count > 0)

  // Email stats
  const emailStats = { sent: 0, opened: 0, clicked: 0, replied: 0 }
  for (const e of emailEvents) {
    if (e.event_type in emailStats) emailStats[e.event_type]++
  }
  const openRate  = emailStats.sent   > 0 ? Math.round((emailStats.opened  / emailStats.sent)   * 100) : 0
  const clickRate = emailStats.opened > 0 ? Math.round((emailStats.clicked / emailStats.opened) * 100) : 0

  // Content posts
  const postsByStatus = {}
  for (const p of (contentPosts ?? [])) {
    postsByStatus[p.status] = (postsByStatus[p.status] ?? 0) + 1
  }

  // Video projects
  const videosByStatus = {}
  for (const v of (videoProjects ?? [])) {
    videosByStatus[v.status] = (videosByStatus[v.status] ?? 0) + 1
  }

  // Lead credits
  const creditsUsedThisMonth = (leadSearches ?? []).reduce((sum, s) => sum + (s.credits_used ?? 0), 0)
  const planCredits = plan.leadCredits === Infinity ? -1 : plan.leadCredits

  return (
    <AnalyticsClient
      stats={{
        totalContacts:      totalContacts ?? 0,
        totalConversations,
        activeDeals,
        wonRevenue,
        totalDeals:         allDeals?.length ?? 0,
        emailStats,
        openRate,
        clickRate,
        totalSequences:     sequenceIds.length,
        totalEnrollments:   enrollmentIds.length,
        totalWebsites:      totalWebsites ?? 0,
        totalBots:          botIds.length,
        creditsUsedThisMonth,
        planCredits,
        leadCreditsUsed:    org.lead_credits_used ?? 0,
        postsByStatus,
        videosByStatus,
      }}
      contactsTimeSeries={buildTimeSeries(recentContacts, 30)}
      conversationsTimeSeries={buildTimeSeries(recentConversations, 30)}
      dealsByStage={dealsByStage}
    />
  )
}
