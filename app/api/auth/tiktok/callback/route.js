import { createClient }        from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')
  const base  = process.env.NEXT_PUBLIC_APP_URL

  if (error || !code) {
    return Response.redirect(`${base}/settings?tab=integrations&error=tiktok_denied`)
  }

  const clientKey    = process.env.TIKTOK_CLIENT_KEY
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET
  const redirectUri  = `${base}/api/auth/tiktok/callback`

  // Exchange code for access token
  const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key:    clientKey,
      client_secret: clientSecret,
      code,
      grant_type:    'authorization_code',
      redirect_uri:  redirectUri,
    }),
  })
  const tokenData = await tokenRes.json()

  if (!tokenData.access_token) {
    console.error('[tiktok callback] token exchange failed:', tokenData)
    return Response.redirect(`${base}/settings?tab=integrations&error=tiktok_token`)
  }

  // Get TikTok user info
  const userRes  = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })
  const userData = await userRes.json()
  const tikUser  = userData.data?.user ?? {}

  // Get the logged-in Nexus user from session cookie
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.redirect(`${base}/login`)

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single()
  if (!org) return Response.redirect(`${base}/onboarding`)

  const expiresAt = new Date(Date.now() + (tokenData.expires_in ?? 86400) * 1000).toISOString()

  // Use service client to bypass RLS for the upsert
  const service = createServiceClient()
  const { error: upsertErr } = await service
    .from('org_social_connections')
    .upsert({
      org_id:            org.id,
      platform:          'tiktok',
      access_token:      tokenData.access_token,
      refresh_token:     tokenData.refresh_token ?? null,
      token_expires_at:  expiresAt,
      platform_user_id:  tikUser.open_id ?? null,
      platform_username: tikUser.display_name ?? null,
      tiktok_open_id:    tikUser.open_id ?? null,
      connected_at:      new Date().toISOString(),
      updated_at:        new Date().toISOString(),
    }, { onConflict: 'org_id,platform' })

  if (upsertErr) {
    console.error('[tiktok callback] upsert failed:', upsertErr)
    return Response.redirect(`${base}/settings?tab=integrations&error=tiktok_save`)
  }

  return Response.redirect(`${base}/settings?tab=integrations&success=tiktok`)
}
