import { createClient } from '@/lib/supabase/server'

async function getOrgId(supabase, userId) {
  const { data } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', userId)
    .single()
  return data?.id ?? null
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId(supabase, user.id)
  if (!orgId) return Response.json({ error: 'No org' }, { status: 400 })

  const { data, error } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('org_id', orgId)
    .maybeSingle()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data ?? {})
}

export async function PUT(req) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId(supabase, user.id)
  if (!orgId) return Response.json({ error: 'No org' }, { status: 400 })

  const body = await req.json()

  const payload = {
    org_id:           orgId,
    business_name:    body.business_name    ?? null,
    industry:         body.industry         ?? null,
    description:      body.description      ?? null,
    audience:         body.audience         ?? null,
    tone:             body.tone             ?? 'professional',
    keywords_include: body.keywords_include ?? [],
    keywords_exclude: body.keywords_exclude ?? [],
    content_pillars:  body.content_pillars  ?? [],
    positioning:      body.positioning      ?? null,
    brand_mission:    body.brand_mission    ?? null,
    platforms:        body.platforms        ?? [],
    posts_per_week:   body.posts_per_week   ?? { linkedin: 2, tiktok: 3 },
    updated_at:       new Date().toISOString(),
    // API keys — only update if provided, preserve existing value if empty string
    ...(body.runway_api_key !== undefined && body.runway_api_key !== ''
      ? { runway_api_key: body.runway_api_key }
      : {}),
  }

  const { data, error } = await supabase
    .from('brand_profiles')
    .upsert(payload, { onConflict: 'org_id' })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
