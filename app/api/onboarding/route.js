import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'


// Called right after signup to create the org.
// Idempotent — safe to call multiple times.
export async function POST(request) {
  const { businessName, tosAgreedAt } = await request.json()

  if (!businessName?.trim()) {
    return Response.json({ error: 'Business name is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  // Don't create duplicates
  const { data: existing } = await service
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (existing) return Response.json(existing)

  const slug =
    businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
    '-' +
    Date.now().toString(36)

  // Set 14-day trial
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + 14)

  const { data: org, error: orgErr } = await service
    .from('organizations')
    .insert({
      name:                businessName.trim(),
      slug,
      owner_id:            user.id,
      subscription_status: 'trialing',
      plan_id:             'starter',
      trial_ends_at:       trialEndsAt.toISOString(),
      tos_agreed_at:       tosAgreedAt ?? new Date().toISOString(),
    })
    .select()
    .single()

  if (orgErr) return Response.json({ error: orgErr.message }, { status: 400 })

  // Create the first bot pre-configured with the business name
  // welcome_message must identify the bot as an AI (legal requirement)
  await service.from('bots').insert({
    org_id:          org.id,
    name:            `${businessName.trim()} Assistant`,
    welcome_message: `Hi! I'm an AI assistant for ${businessName.trim()}. How can I help you today?`,
    system_prompt:   `You are a helpful AI assistant for ${businessName.trim()}. Be friendly, professional, and concise.`,
  })

  return Response.json(org, { status: 201 })
}
