import { createClient } from '@/lib/supabase/server'

async function getOrgId(supabase, userId) {
  const { data } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', userId)
    .single()
  return data?.id ?? null
}

// GET /api/content/posts?status=pending&platform=linkedin
export async function GET(req) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId(supabase, user.id)
  if (!orgId) return Response.json({ error: 'No org' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const status   = searchParams.get('status')
  const platform = searchParams.get('platform')

  let query = supabase
    .from('content_posts')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (status)   query = query.eq('status', status)
  if (platform) query = query.eq('platform', platform)

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

// POST /api/content/posts — save a manually created post
export async function POST(req) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId(supabase, user.id)
  if (!orgId) return Response.json({ error: 'No org' }, { status: 400 })

  const body = await req.json()

  const { data, error } = await supabase
    .from('content_posts')
    .insert({
      org_id:   orgId,
      platform: body.platform,
      body:     body.body,
      hashtags: body.hashtags ?? null,
      status:   'pending',
      week_of:  body.week_of ?? null,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}
