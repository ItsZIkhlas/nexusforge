import { createClient } from '@/lib/supabase/server'

async function getOrgId(supabase, userId) {
  const { data } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', userId)
    .single()
  return data?.id ?? null
}

// GET /api/content/experiments/[id]
export async function GET(req, { params }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = await getOrgId(supabase, user.id)
    if (!orgId) return Response.json({ error: 'No org' }, { status: 400 })

    const { data, error } = await supabase
      .from('content_experiments')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    if (!data)  return Response.json({ error: 'Not found' }, { status: 404 })

    return Response.json(data)
  } catch (err) {
    console.error('[experiments/[id] GET]', err)
    return Response.json({ error: err.message ?? 'Unexpected error' }, { status: 500 })
  }
}

// PATCH /api/content/experiments/[id]
// Body: { winner: 'a' | 'b' }
// Sets winner, marks experiment complete, and saves the winning variant
// as an approved post in content_posts.
export async function PATCH(req, { params }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = await getOrgId(supabase, user.id)
    if (!orgId) return Response.json({ error: 'No org' }, { status: 400 })

    const body = await req.json()
    const { winner } = body

    if (!['a', 'b'].includes(winner)) {
      return Response.json({ error: 'winner must be "a" or "b"' }, { status: 400 })
    }

    // Fetch the experiment first so we know platform + variant bodies
    const { data: experiment, error: fetchError } = await supabase
      .from('content_experiments')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (fetchError) return Response.json({ error: fetchError.message }, { status: 500 })
    if (!experiment) return Response.json({ error: 'Not found' }, { status: 404 })

    if (experiment.status === 'complete') {
      return Response.json({ error: 'Experiment already complete' }, { status: 409 })
    }

    const winnerBody = winner === 'a' ? experiment.variant_a_body : experiment.variant_b_body

    // Update experiment
    const { data: updated, error: updateError } = await supabase
      .from('content_experiments')
      .update({
        winner,
        status:     'complete',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (updateError) return Response.json({ error: updateError.message }, { status: 500 })

    // Save winner to content_posts as approved draft
    const { error: insertError } = await supabase
      .from('content_posts')
      .insert({
        org_id:            orgId,
        platform:          experiment.platform,
        body:              winnerBody,
        hashtags:          null,
        status:            'approved',
        week_of:           new Date().toISOString().slice(0, 10),
        experiment_id:     id,
      })

    if (insertError) {
      // Log but don't fail — the experiment update succeeded
      console.error('[experiments/[id] PATCH] insert winner post:', insertError)
    }

    return Response.json(updated)
  } catch (err) {
    console.error('[experiments/[id] PATCH]', err)
    return Response.json({ error: err.message ?? 'Unexpected error' }, { status: 500 })
  }
}

// DELETE /api/content/experiments/[id]
export async function DELETE(req, { params }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = await getOrgId(supabase, user.id)
    if (!orgId) return Response.json({ error: 'No org' }, { status: 400 })

    const { error } = await supabase
      .from('content_experiments')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return new Response(null, { status: 204 })
  } catch (err) {
    console.error('[experiments/[id] DELETE]', err)
    return Response.json({ error: err.message ?? 'Unexpected error' }, { status: 500 })
  }
}
