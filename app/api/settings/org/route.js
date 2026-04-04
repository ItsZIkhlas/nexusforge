import { createClient } from '@/lib/supabase/server'

async function getOrg(supabase, userId) {
  const { data } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('owner_id', userId)
    .single()
  return data
}

// PATCH /api/settings/org — update org name and/or sender details
export async function PATCH(req) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, resend_from_name, resend_from_email, physical_address } = body

  const org = await getOrg(supabase, user.id)
  if (!org) return Response.json({ error: 'No organisation found' }, { status: 404 })

  const updates = {}
  if (name !== undefined) {
    if (!name?.trim()) return Response.json({ error: 'Name is required' }, { status: 400 })
    updates.name = name.trim()
  }
  if (resend_from_name  !== undefined) updates.resend_from_name  = resend_from_name?.trim()  ?? null
  if (resend_from_email !== undefined) updates.resend_from_email = resend_from_email?.trim() ?? null
  if (physical_address  !== undefined) updates.physical_address  = physical_address?.trim()  ?? null

  if (!Object.keys(updates).length) return Response.json({ error: 'Nothing to update' }, { status: 400 })

  const { data, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', org.id)
    .select('id, name, resend_from_name, resend_from_email, physical_address')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

// DELETE /api/settings/org — permanently delete org and all its data
export async function DELETE(req) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const org = await getOrg(supabase, user.id)
  if (!org) return Response.json({ error: 'No organisation found' }, { status: 404 })

  // Deleting the org cascades to all child tables via ON DELETE CASCADE
  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', org.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return new Response(null, { status: 204 })
}
