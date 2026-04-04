import { createClient } from '@/lib/supabase/server'

async function getOrgDeal(supabase, userId, dealId) {
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', userId)
    .single()

  if (!org) return { org: null, deal: null }

  const { data: deal } = await supabase
    .from('deals')
    .select('*')
    .eq('id', dealId)
    .eq('org_id', org.id)
    .single()

  return { org, deal }
}

export async function PATCH(request, { params }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { org, deal } = await getOrgDeal(supabase, user.id, id)
  if (!deal) return Response.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()

  // If stage changes, set closed_at for won/lost
  if (body.stage && body.stage !== deal.stage) {
    if (['won', 'lost'].includes(body.stage) && !deal.closed_at) {
      body.closed_at = new Date().toISOString()
    }
    if (!['won', 'lost'].includes(body.stage)) {
      body.closed_at = null
    }
  }

  const allowed = ['title', 'value', 'stage', 'position', 'contact_id', 'closed_at']
  const updates = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const { data: updated, error } = await supabase
    .from('deals')
    .update(updates)
    .eq('id', id)
    .eq('org_id', org.id)
    .select(`*, contact:contacts(id, first_name, last_name, email, company)`)
    .single()

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json(updated)
}

export async function DELETE(request, { params }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { org, deal } = await getOrgDeal(supabase, user.id, id)
  if (!deal) return Response.json({ error: 'Not found' }, { status: 404 })

  const { error } = await supabase
    .from('deals')
    .delete()
    .eq('id', id)
    .eq('org_id', org.id)

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return new Response(null, { status: 204 })
}
