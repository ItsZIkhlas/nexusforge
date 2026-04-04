import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/stripe'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!org) return Response.json([])

  const { data: bots } = await supabase
    .from('bots')
    .select('*')
    .eq('org_id', org.id)
    .order('created_at', { ascending: false })

  return Response.json(bots ?? [])
}

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await request.json()
  if (!name?.trim()) {
    return Response.json({ error: 'Name is required' }, { status: 400 })
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('id, plan_id')
    .eq('owner_id', user.id)
    .single()

  if (!org) return Response.json({ error: 'Organization not found. Visit /onboarding to set up your account.' }, { status: 404 })

  // Enforce bot limit based on plan
  const plan = PLANS[org.plan_id] ?? PLANS.starter
  if (plan.maxBots !== Infinity) {
    const { count } = await supabase
      .from('bots')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', org.id)

    if (count >= plan.maxBots) {
      return Response.json(
        { error: `Your ${plan.name} plan allows ${plan.maxBots} bot${plan.maxBots !== 1 ? 's' : ''}. Upgrade to add more.` },
        { status: 403 }
      )
    }
  }

  const { data: bot, error } = await supabase
    .from('bots')
    .insert({ name: name.trim(), org_id: org.id })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json(bot, { status: 201 })
}
