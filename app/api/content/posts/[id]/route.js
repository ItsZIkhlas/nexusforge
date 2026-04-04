import { createClient } from '@/lib/supabase/server'

async function getOrgId(supabase, userId) {
  const { data } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', userId)
    .single()
  return data?.id ?? null
}

// PATCH — update body or status; if approving a LinkedIn post, publish it
export async function PATCH(req, { params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId(supabase, user.id)
  if (!orgId) return Response.json({ error: 'No org' }, { status: 400 })

  const body = await req.json()
  const updates = { updated_at: new Date().toISOString() }

  if (body.body     !== undefined) updates.body     = body.body
  if (body.hashtags !== undefined) updates.hashtags = body.hashtags
  if (body.status   !== undefined) updates.status   = body.status

  // If approving a LinkedIn post, publish it now
  if (body.status === 'approved') {
    const { data: post } = await supabase
      .from('content_posts')
      .select('platform, body')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (post?.platform === 'linkedin') {
      const linkedinResult = await publishToLinkedIn(supabase, orgId, post.body)
      if (linkedinResult.success) {
        updates.status          = 'posted'
        updates.posted_at       = new Date().toISOString()
        updates.linkedin_post_id = linkedinResult.postId
      } else {
        // LinkedIn failed — still approve but flag it
        updates.status = 'approved'
      }
    }
  }

  const { data, error } = await supabase
    .from('content_posts')
    .update(updates)
    .eq('id', id)
    .eq('org_id', orgId)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(req, { params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId(supabase, user.id)
  if (!orgId) return Response.json({ error: 'No org' }, { status: 400 })

  const { error } = await supabase
    .from('content_posts')
    .delete()
    .eq('id', id)
    .eq('org_id', orgId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return new Response(null, { status: 204 })
}

// ── LinkedIn publishing helper ────────────────────────────────────────────────

async function publishToLinkedIn(supabase, orgId, body) {
  try {
    const { data: brand } = await supabase
      .from('brand_profiles')
      .select('linkedin_access_token, linkedin_token_expiry, linkedin_person_urn')
      .eq('org_id', orgId)
      .single()

    if (!brand?.linkedin_access_token || !brand?.linkedin_person_urn) {
      return { success: false, error: 'LinkedIn not connected' }
    }

    if (brand.linkedin_token_expiry && new Date(brand.linkedin_token_expiry) < new Date()) {
      return { success: false, error: 'LinkedIn token expired' }
    }

    const res = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        'Authorization':       `Bearer ${brand.linkedin_access_token}`,
        'Content-Type':        'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version':    '202401',
      },
      body: JSON.stringify({
        author:     brand.linkedin_person_urn,
        commentary: body,
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution:          'MAIN_FEED',
          targetEntities:            [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState:    'PUBLISHED',
        isReshareDisabledByAuthor: false,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[linkedin post]', err)
      return { success: false, error: err }
    }

    // LinkedIn returns post ID in x-restli-id header
    const postId = res.headers.get('x-restli-id') ?? null
    return { success: true, postId }
  } catch (e) {
    console.error('[linkedin post]', e)
    return { success: false, error: e.message }
  }
}
