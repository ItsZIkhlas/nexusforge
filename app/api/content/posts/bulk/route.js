import { createClient } from '@/lib/supabase/server'

async function getOrgId(supabase, userId) {
  const { data } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', userId)
    .single()
  return data?.id ?? null
}

// PATCH — bulk update status for multiple posts
// Body: { ids: string[], status: 'approved' | 'rejected' }
export async function PATCH(req) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId(supabase, user.id)
  if (!orgId) return Response.json({ error: 'No org' }, { status: 400 })

  const body = await req.json()
  const { ids, status } = body

  if (!Array.isArray(ids) || ids.length === 0) {
    return Response.json({ error: 'ids must be a non-empty array' }, { status: 400 })
  }

  const ALLOWED_STATUSES = ['approved', 'rejected', 'pending', 'scheduled']
  if (!ALLOWED_STATUSES.includes(status)) {
    return Response.json({ error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}` }, { status: 400 })
  }

  const updates = {
    status,
    updated_at: new Date().toISOString(),
  }

  // For bulk approve of LinkedIn posts, attempt to publish each one
  if (status === 'approved') {
    // Fetch the posts to check platforms
    const { data: posts } = await supabase
      .from('content_posts')
      .select('id, platform, body')
      .in('id', ids)
      .eq('org_id', orgId)

    if (posts && posts.length > 0) {
      const linkedinPosts = posts.filter(p => p.platform === 'linkedin')

      if (linkedinPosts.length > 0) {
        // Fetch brand for LinkedIn credentials once
        const { data: brand } = await supabase
          .from('brand_profiles')
          .select('linkedin_access_token, linkedin_token_expiry, linkedin_person_urn')
          .eq('org_id', orgId)
          .single()

        const linkedinReady =
          brand?.linkedin_access_token &&
          brand?.linkedin_person_urn &&
          !(brand.linkedin_token_expiry && new Date(brand.linkedin_token_expiry) < new Date())

        // Process LinkedIn posts individually so we can track which posted
        for (const post of linkedinPosts) {
          let postUpdates = { ...updates }
          if (linkedinReady) {
            try {
              const res = await fetch('https://api.linkedin.com/rest/posts', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${brand.linkedin_access_token}`,
                  'Content-Type': 'application/json',
                  'X-Restli-Protocol-Version': '2.0.0',
                  'LinkedIn-Version': '202401',
                },
                body: JSON.stringify({
                  author: brand.linkedin_person_urn,
                  commentary: post.body,
                  visibility: 'PUBLIC',
                  distribution: {
                    feedDistribution: 'MAIN_FEED',
                    targetEntities: [],
                    thirdPartyDistributionChannels: [],
                  },
                  lifecycleState: 'PUBLISHED',
                  isReshareDisabledByAuthor: false,
                }),
              })
              if (res.ok) {
                const postId = res.headers.get('x-restli-id') ?? null
                postUpdates.status = 'posted'
                postUpdates.posted_at = new Date().toISOString()
                postUpdates.linkedin_post_id = postId
              }
            } catch (e) {
              console.error('[bulk linkedin post]', e)
            }
          }
          await supabase
            .from('content_posts')
            .update(postUpdates)
            .eq('id', post.id)
            .eq('org_id', orgId)
        }

        // Now bulk-update the non-LinkedIn posts
        const nonLinkedinIds = posts
          .filter(p => p.platform !== 'linkedin')
          .map(p => p.id)

        if (nonLinkedinIds.length > 0) {
          await supabase
            .from('content_posts')
            .update(updates)
            .in('id', nonLinkedinIds)
            .eq('org_id', orgId)
        }

        // Return updated posts
        const { data: updated, error } = await supabase
          .from('content_posts')
          .select()
          .in('id', ids)
          .eq('org_id', orgId)

        if (error) return Response.json({ error: error.message }, { status: 500 })
        return Response.json({ updated: updated ?? [] })
      }
    }
  }

  // Default: bulk update all ids at once
  const { data: updated, error } = await supabase
    .from('content_posts')
    .update(updates)
    .in('id', ids)
    .eq('org_id', orgId)
    .select()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ updated: updated ?? [] })
}
