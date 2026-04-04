import { createClient } from '@/lib/supabase/server'

async function getOrgContact(supabase, userId, contactId) {
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', userId)
    .single()

  if (!org) return { org: null, contact: null }

  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .eq('org_id', org.id)
    .single()

  return { org, contact }
}

export async function GET(request, { params }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { contact } = await getOrgContact(supabase, user.id, id)
  if (!contact) return Response.json({ error: 'Not found' }, { status: 404 })

  // Fetch related deals
  const { data: deals } = await supabase
    .from('deals')
    .select('*')
    .eq('contact_id', id)
    .order('created_at', { ascending: false })

  return Response.json({ ...contact, deals: deals ?? [] })
}

export async function PATCH(request, { params }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { org, contact } = await getOrgContact(supabase, user.id, id)
  if (!contact) return Response.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()

  // Track status changes in activity log
  if (body.status && body.status !== contact.status) {
    await supabase.from('contact_activities').insert({
      contact_id: id,
      type: 'status_change',
      content: `Status changed from "${contact.status}" to "${body.status}"`,
    })
  }

  const allowed = ['first_name','last_name','email','phone','company','job_title',
                   'linkedin_url','website','status','tags','notes']
  const updates = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const { data: updated, error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', id)
    .eq('org_id', org.id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json(updated)
}

export async function DELETE(request, { params }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { org, contact } = await getOrgContact(supabase, user.id, id)
  if (!contact) return Response.json({ error: 'Not found' }, { status: 404 })

  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id)
    .eq('org_id', org.id)

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return new Response(null, { status: 204 })
}
