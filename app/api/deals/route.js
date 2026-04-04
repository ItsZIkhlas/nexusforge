import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!org) return Response.json([])

  const { data: deals, error } = await supabase
    .from('deals')
    .select(`
      *,
      contact:contacts(id, first_name, last_name, email, company)
    `)
    .eq('org_id', org.id)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(deals ?? [])
}

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!org) return Response.json({ error: 'Organization not found' }, { status: 404 })

  const { title, value, stage = 'lead', contact_id, closed_at } = await request.json()

  if (!title?.trim()) {
    return Response.json({ error: 'Title is required' }, { status: 400 })
  }

  // Get max position in this stage for ordering
  const { data: existing } = await supabase
    .from('deals')
    .select('position')
    .eq('org_id', org.id)
    .eq('stage', stage)
    .order('position', { ascending: false })
    .limit(1)

  const position = existing?.[0]?.position != null ? existing[0].position + 1 : 0

  const { data: deal, error } = await supabase
    .from('deals')
    .insert({
      org_id: org.id,
      title: title.trim(),
      value: value ? parseFloat(value) : null,
      stage,
      position,
      contact_id: contact_id || null,
      closed_at: closed_at || null,
    })
    .select(`*, contact:contacts(id, first_name, last_name, email, company)`)
    .single()

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json(deal, { status: 201 })
}
