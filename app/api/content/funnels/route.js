import { createClient } from '@/lib/supabase/server'

async function getOrgId(supabase, userId) {
  const { data } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', userId)
    .single()
  return data?.id ?? null
}

const DEFAULT_STAGES = [
  { id: 'awareness',    label: 'Awareness',    posts: [] },
  { id: 'education',    label: 'Education',    posts: [] },
  { id: 'social_proof', label: 'Social Proof', posts: [] },
  { id: 'cta',          label: 'CTA',          posts: [] },
]

// GET /api/content/funnels — list all funnels for the org
export async function GET(req) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = await getOrgId(supabase, user.id)
    if (!orgId) return Response.json({ error: 'No org' }, { status: 400 })

    const { data, error } = await supabase
      .from('content_funnels')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data ?? [])
  } catch (e) {
    console.error('[funnels GET]', e)
    return Response.json({ error: e.message ?? 'Failed to load funnels' }, { status: 500 })
  }
}

// POST /api/content/funnels — create a new funnel
// Body: { name, goal, platform }
export async function POST(req) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = await getOrgId(supabase, user.id)
    if (!orgId) return Response.json({ error: 'No org' }, { status: 400 })

    const body = await req.json()
    const { name, goal, platform } = body

    if (!name?.trim()) {
      return Response.json({ error: 'Funnel name is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('content_funnels')
      .insert({
        org_id:   orgId,
        name:     name.trim(),
        goal:     goal?.trim() ?? null,
        platform: platform ?? null,
        stages:   DEFAULT_STAGES,
      })
      .select()
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data, { status: 201 })
  } catch (e) {
    console.error('[funnels POST]', e)
    return Response.json({ error: e.message ?? 'Failed to create funnel' }, { status: 500 })
  }
}
