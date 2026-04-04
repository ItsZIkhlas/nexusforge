import { createClient } from '@/lib/supabase/server'

async function getOrgId(supabase, userId) {
  const { data } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', userId)
    .single()
  return data?.id ?? null
}

// GET /api/content/funnels/[id] — fetch a single funnel
export async function GET(req, { params }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = await getOrgId(supabase, user.id)
    if (!orgId) return Response.json({ error: 'No org' }, { status: 400 })

    const { data, error } = await supabase
      .from('content_funnels')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (error) return Response.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 })
    return Response.json(data)
  } catch (e) {
    console.error('[funnels/[id] GET]', e)
    return Response.json({ error: e.message ?? 'Failed to load funnel' }, { status: 500 })
  }
}

// PUT /api/content/funnels/[id] — update funnel (name, goal, stages)
export async function PUT(req, { params }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = await getOrgId(supabase, user.id)
    if (!orgId) return Response.json({ error: 'No org' }, { status: 400 })

    const body = await req.json()
    const updates = { updated_at: new Date().toISOString() }

    if (body.name     !== undefined) updates.name     = body.name?.trim()
    if (body.goal     !== undefined) updates.goal     = body.goal?.trim() ?? null
    if (body.platform !== undefined) updates.platform = body.platform ?? null
    if (body.stages   !== undefined) updates.stages   = body.stages

    const { data, error } = await supabase
      .from('content_funnels')
      .update(updates)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data)
  } catch (e) {
    console.error('[funnels/[id] PUT]', e)
    return Response.json({ error: e.message ?? 'Failed to update funnel' }, { status: 500 })
  }
}

// DELETE /api/content/funnels/[id] — delete funnel
export async function DELETE(req, { params }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = await getOrgId(supabase, user.id)
    if (!orgId) return Response.json({ error: 'No org' }, { status: 400 })

    const { error } = await supabase
      .from('content_funnels')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return new Response(null, { status: 204 })
  } catch (e) {
    console.error('[funnels/[id] DELETE]', e)
    return Response.json({ error: e.message ?? 'Failed to delete funnel' }, { status: 500 })
  }
}
