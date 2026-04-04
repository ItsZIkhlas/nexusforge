import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: org } = await supabase
    .from('organizations').select('id').eq('owner_id', user.id).single()
  if (!org) return Response.json({ error: 'Organization not found' }, { status: 404 })

  const { data: campaigns, error } = await supabase
    .from('email_campaigns')
    .select(`
      *,
      email_steps(id),
      email_enrollments(id, status, email_sends(id))
    `)
    .eq('org_id', org.id)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Shape the counts
  const shaped = (campaigns ?? []).map(c => ({
    ...c,
    step_count:      c.email_steps?.length ?? 0,
    enrolled_count:  c.email_enrollments?.length ?? 0,
    active_count:    c.email_enrollments?.filter(e => e.status === 'active').length ?? 0,
    sends_count:     c.email_enrollments?.reduce((sum, e) => sum + (e.email_sends?.length ?? 0), 0) ?? 0,
    email_steps:     undefined,
    email_enrollments: undefined,
  }))

  return Response.json(shaped)
}

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: org } = await supabase
    .from('organizations').select('id').eq('owner_id', user.id).single()
  if (!org) return Response.json({ error: 'Organization not found' }, { status: 404 })

  const { name, from_name = '', from_email = '', reply_to = '' } = await request.json()
  if (!name?.trim()) return Response.json({ error: 'Campaign name is required' }, { status: 400 })

  const { data: campaign, error } = await supabase
    .from('email_campaigns')
    .insert({ org_id: org.id, name: name.trim(), from_name, from_email, reply_to, status: 'draft' })
    .select().single()

  if (error) return Response.json({ error: error.message }, { status: 400 })

  // Seed with one blank step so the editor has something to work with
  await supabase.from('email_steps').insert({
    campaign_id: campaign.id,
    step_number: 1,
    subject: '',
    body: '',
    delay_days: 0,
  })

  return Response.json(campaign, { status: 201 })
}
