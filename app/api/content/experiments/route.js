import { createClient } from '@/lib/supabase/server'

async function getOrgId(supabase, userId) {
  const { data } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', userId)
    .single()
  return data?.id ?? null
}

// GET /api/content/experiments
// Returns all experiments for the authenticated user's org, newest first.
export async function GET(req) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = await getOrgId(supabase, user.id)
    if (!orgId) return Response.json({ error: 'No org' }, { status: 400 })

    const { data, error } = await supabase
      .from('content_experiments')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data)
  } catch (err) {
    console.error('[experiments GET]', err)
    return Response.json({ error: err.message ?? 'Unexpected error' }, { status: 500 })
  }
}

// POST /api/content/experiments
// Body: { name, platform, hypothesis, variant_a_body, variant_b_body }
// Creates a new experiment with status 'running'.
export async function POST(req) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = await getOrgId(supabase, user.id)
    if (!orgId) return Response.json({ error: 'No org' }, { status: 400 })

    const body = await req.json()
    const { name, platform, hypothesis, variant_a_body, variant_b_body } = body

    if (!name?.trim())           return Response.json({ error: 'name is required' }, { status: 400 })
    if (!platform)               return Response.json({ error: 'platform is required' }, { status: 400 })
    if (!variant_a_body?.trim()) return Response.json({ error: 'variant_a_body is required' }, { status: 400 })
    if (!variant_b_body?.trim()) return Response.json({ error: 'variant_b_body is required' }, { status: 400 })

    if (!['linkedin', 'tiktok'].includes(platform)) {
      return Response.json({ error: 'platform must be linkedin or tiktok' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('content_experiments')
      .insert({
        org_id:        orgId,
        name:          name.trim(),
        platform,
        hypothesis:    hypothesis?.trim() ?? null,
        variant_a_body: variant_a_body.trim(),
        variant_b_body: variant_b_body.trim(),
        status:        'running',
        winner:        null,
      })
      .select()
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data, { status: 201 })
  } catch (err) {
    console.error('[experiments POST]', err)
    return Response.json({ error: err.message ?? 'Unexpected error' }, { status: 500 })
  }
}
