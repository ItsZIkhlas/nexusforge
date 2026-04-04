import { createClient } from '@/lib/supabase/server'

// POST /api/social/publish-post — publish an approved post to LinkedIn
export async function POST(req) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { postId } = await req.json()
  if (!postId) return Response.json({ error: 'postId required' }, { status: 400 })

  // Load the post
  const { data: post, error: postErr } = await supabase
    .from('content_posts')
    .select('*')
    .eq('id', postId)
    .single()
  if (postErr || !post) return Response.json({ error: 'Post not found' }, { status: 404 })
  if (post.status !== 'approved') return Response.json({ error: 'Post must be approved first' }, { status: 400 })

  // Load brand profile for LinkedIn token
  const { data: brand } = await supabase
    .from('brand_profiles')
    .select('linkedin_access_token, linkedin_token_expiry, linkedin_person_urn')
    .eq('user_id', user.id)
    .single()

  if (!brand?.linkedin_access_token) {
    return Response.json({ error: 'LinkedIn not connected. Go to Settings → Integrations.' }, { status: 400 })
  }
  if (brand.linkedin_token_expiry && new Date(brand.linkedin_token_expiry) < new Date()) {
    return Response.json({ error: 'LinkedIn token expired. Please reconnect in Settings.' }, { status: 400 })
  }

  // Build post text
  const text = post.hashtags ? `${post.body}\n\n${post.hashtags}` : post.body

  // Publish to LinkedIn UGC Posts API
  const liRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${brand.linkedin_access_token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: brand.linkedin_person_urn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    }),
  })

  if (!liRes.ok) {
    const liErr = await liRes.json().catch(() => ({}))
    console.error('[publish-post] LinkedIn error:', liErr)
    return Response.json(
      { error: liErr.message ?? `LinkedIn publish failed (${liRes.status})` },
      { status: 502 }
    )
  }

  // Mark post as posted in DB
  const { data: updated, error: updateErr } = await supabase
    .from('content_posts')
    .update({ status: 'posted' })
    .eq('id', postId)
    .select()
    .single()

  if (updateErr) return Response.json({ error: updateErr.message }, { status: 500 })
  return Response.json(updated)
}
