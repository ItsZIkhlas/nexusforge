/**
 * GET /api/social/tiktok/status?publish_id=xxx
 * Poll TikTok for the publish status of a video.
 */
import { createClient }        from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const publishId = searchParams.get('publish_id')
  if (!publishId) return Response.json({ error: 'publish_id required' }, { status: 400 })

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single()
  if (!org) return Response.json({ error: 'No organization' }, { status: 404 })

  const service = createServiceClient()
  const { data: conn } = await service
    .from('org_social_connections')
    .select('access_token')
    .eq('org_id', org.id)
    .eq('platform', 'tiktok')
    .single()

  if (!conn?.access_token) {
    return Response.json({ error: 'TikTok not connected' }, { status: 400 })
  }

  const res = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${conn.access_token}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ publish_id: publishId }),
  })

  const data = await res.json()
  return Response.json(data)
}
