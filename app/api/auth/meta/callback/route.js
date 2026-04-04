import { createClient } from '@/lib/supabase/server'

const GRAPH = 'https://graph.facebook.com/v19.0'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&error=meta_denied`)
  }

  const appId      = process.env.META_APP_ID
  const appSecret  = process.env.META_APP_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`

  // Exchange code for short-lived token
  const tokenRes = await fetch(
    `${GRAPH}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
  )
  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) {
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&error=meta_token`)
  }

  // Exchange for long-lived token (60 days)
  const longRes = await fetch(
    `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
  )
  const longData = await longRes.json()
  const accessToken = longData.access_token ?? tokenData.access_token
  const expiresIn   = longData.expires_in ?? 5184000 // 60 days fallback

  // Get user info
  const meRes  = await fetch(`${GRAPH}/me?fields=id,name&access_token=${accessToken}`)
  const meData = await meRes.json()

  // Get pages the user manages
  const pagesRes  = await fetch(`${GRAPH}/me/accounts?access_token=${accessToken}`)
  const pagesData = await pagesRes.json()
  const firstPage = pagesData.data?.[0]

  // Get Instagram Business account linked to the first page
  let igAccountId = null
  if (firstPage?.id) {
    const igRes  = await fetch(`${GRAPH}/${firstPage.id}?fields=instagram_business_account&access_token=${firstPage.access_token ?? accessToken}`)
    const igData = await igRes.json()
    igAccountId  = igData.instagram_business_account?.id ?? null
  }

  // Save to org_social_connections
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`)

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single()
  if (!org) return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/onboarding`)

  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

  await supabase.from('org_social_connections').upsert({
    org_id:               org.id,
    platform:             'meta',
    access_token:         accessToken,
    token_expires_at:     expiresAt,
    platform_user_id:     meData.id,
    platform_username:    meData.name,
    facebook_page_id:     firstPage?.id     ?? null,
    facebook_page_name:   firstPage?.name   ?? null,
    instagram_account_id: igAccountId,
    updated_at:           new Date().toISOString(),
  }, { onConflict: 'org_id,platform' })

  return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&success=meta`)
}
