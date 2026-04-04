import { createClient } from '@/lib/supabase/server'

// GET /api/social-connections — return all social OAuth connections for the org
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).single()
  if (!org) return Response.json([])

  const { data } = await supabase
    .from('org_social_connections')
    .select('id, platform, platform_username, facebook_page_name, instagram_account_id, facebook_page_id, tiktok_open_id, connected_at, token_expires_at')
    .eq('org_id', org.id)

  return Response.json(data ?? [])
}

// DELETE /api/social-connections?platform=meta — disconnect a platform
export async function DELETE(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).single()
  if (!org) return Response.json({ error: 'Not found' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform')
  if (!platform) return Response.json({ error: 'platform required' }, { status: 400 })

  await supabase.from('org_social_connections').delete().eq('org_id', org.id).eq('platform', platform)
  return new Response(null, { status: 204 })
}
