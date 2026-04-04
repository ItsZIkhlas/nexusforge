/**
 * POST /api/social/tiktok/init
 * Initialise a TikTok FILE_UPLOAD publish job.
 * Returns { upload_url, publish_id } so the browser can PUT the video directly.
 */
import { createClient }        from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { caption, fileSize } = await request.json()
  if (!fileSize) return Response.json({ error: 'fileSize is required' }, { status: 400 })

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

  const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${conn.access_token}`,
      'Content-Type':  'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      post_info: {
        title:           (caption ?? 'My video').slice(0, 150),
        privacy_level:   'SELF_ONLY',
        disable_duet:    false,
        disable_comment: false,
        disable_stitch:  false,
      },
      source_info: {
        source:            'FILE_UPLOAD',
        video_size:        fileSize,
        chunk_size:        fileSize,   // single chunk
        total_chunk_count: 1,
      },
    }),
  })

  const initData = await initRes.json()
  console.log('[tiktok/init]', JSON.stringify(initData))

  const uploadUrl  = initData.data?.upload_url
  const publishId  = initData.data?.publish_id

  if (!uploadUrl || !publishId) {
    return Response.json({ error: `TikTok init failed: ${JSON.stringify(initData)}` }, { status: 500 })
  }

  return Response.json({ upload_url: uploadUrl, publish_id: publishId })
}
