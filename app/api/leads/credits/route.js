import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/stripe'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let { data: org } = await supabase
    .from('organizations')
    .select('id, plan_id, lead_credits_used, lead_credits_reset_at')
    .eq('owner_id', user.id)
    .single()

  if (!org) return Response.json({ error: 'Org not found' }, { status: 404 })

  // Reset credits if the reset window has passed
  if (org.lead_credits_reset_at && new Date(org.lead_credits_reset_at) <= new Date()) {
    const nextReset = new Date()
    nextReset.setMonth(nextReset.getMonth() + 1)
    nextReset.setDate(1)
    nextReset.setHours(0, 0, 0, 0)

    const { data: updated } = await supabase
      .from('organizations')
      .update({ lead_credits_used: 0, lead_credits_reset_at: nextReset.toISOString() })
      .eq('id', org.id)
      .select('id, plan_id, lead_credits_used, lead_credits_reset_at')
      .single()

    if (updated) org = updated
  }

  const plan      = PLANS[org.plan_id] ?? PLANS.starter
  const total     = plan.leadCredits
  const used      = org.lead_credits_used ?? 0
  const remaining = Math.max(0, total - used)

  return Response.json({
    used,
    total,
    remaining,
    resetAt:  org.lead_credits_reset_at,
    planName: plan.name,
  })
}
