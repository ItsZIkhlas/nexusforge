/**
 * POST /api/social/post-video
 * Immediately post a video URL to a connected platform.
 * Body: { platform, videoUrl, caption }
 */
import { createClient }        from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const TIKTOK_BASE = 'https://open.tiktokapis.com/v2'

async function postToTikTok(accessToken, videoUrl, caption) {
  const initRes = await fetch(`${TIKTOK_BASE}/post/publish/video/init/`, {
    method:  'POST',
    headers: {
      'Authorization':  `Bearer ${accessToken}`,
      'Content-Type':   'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      post_info: {
        title:            caption.slice(0, 150),
        privacy_level:    'SELF_ONLY', // sandbox forces private anyway
        disable_duet:     false,
        disable_comment:  false,
        disable_stitch:   false,
      },
      source_info: {
        source:            'PULL_FROM_URL',
        video_url:         videoUrl,
        video_size:        0,
        chunk_size:        0,
        total_chunk_count: 0,
      },
    }),
  })
  const initData = await initRes.json()
  const publishId = initData.data?.publish_id
  if (!publishId) throw new Error(`TikTok init failed: ${JSON.stringify(initData)}`)

  // Poll for up to 2 minutes
  for (let i = 0; i < 24; i++) {
    await new Promise(r => setTimeout(r, 5000))
    const statusRes = await fetch(`${TIKTOK_BASE}/post/publish/status/fetch/`, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ publish_id: publishId }),
    })
    const statusData = await statusRes.json()
    const st = statusData.data?.status
    if (st === 'PUBLISH_COMPLETE') return { publishId }
    if (st === 'FAILED') throw new Error(`TikTok publish failed: ${statusData.data?.fail_reason ?? 'unknown'}`)
  }
  throw new Error('TikTok publish timed out after 2 minutes')
}

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { platform, videoUrl, caption } = await request.json()
  if (!platform || !videoUrl) {
    return Response.json({ error: 'platform and videoUrl are required' }, { status: 400 })
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single()
  if (!org) return Response.json({ error: 'No organization found' }, { status: 404 })

  const service = createServiceClient()
  const { data: conn } = await service
    .from('org_social_connections')
    .select('*')
    .eq('org_id', org.id)
    .eq('platform', platform)
    .single()

  if (!conn?.access_token) {
    return Response.json({ error: `${platform} is not connected` }, { status: 400 })
  }

  try {
    if (platform === 'tiktok') {
      const result = await postToTikTok(conn.access_token, videoUrl, caption ?? '')
      return Response.json({ ok: true, ...result })
    }
    return Response.json({ error: `Platform ${platform} not supported yet` }, { status: 400 })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
