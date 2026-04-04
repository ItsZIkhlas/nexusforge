import { createClient } from '@/lib/supabase/server'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (error || !code) {
    return Response.redirect(`${appUrl}/content/brand?linkedin_error=access_denied`)
  }

  try {
    const redirectUri = `${appUrl}/api/auth/linkedin/callback`

    // Exchange code for access token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  redirectUri,
        client_id:     process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      }),
    })

    if (!tokenRes.ok) {
      console.error('[linkedin callback] token exchange failed', await tokenRes.text())
      return Response.redirect(`${appUrl}/content/brand?linkedin_error=token_failed`)
    }

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token
    const expiresIn   = tokenData.expires_in ?? 5184000 // default 60 days
    const expiry      = new Date(Date.now() + expiresIn * 1000).toISOString()

    // Fetch LinkedIn profile (name + URN)
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })

    let personUrn = null
    let personName = null

    if (profileRes.ok) {
      const profile = await profileRes.json()
      // sub is the person ID, URN format: urn:li:person:XXXXX
      personUrn  = profile.sub ? `urn:li:person:${profile.sub}` : null
      personName = profile.name ?? null
    }

    // Save to brand_profiles
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.redirect(`${appUrl}/login`)
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!org?.id) {
      return Response.redirect(`${appUrl}/content/brand?linkedin_error=no_org`)
    }

    await supabase
      .from('brand_profiles')
      .upsert({
        org_id:                  org.id,
        linkedin_access_token:   accessToken,
        linkedin_token_expiry:   expiry,
        linkedin_person_urn:     personUrn,
        linkedin_name:           personName,
        updated_at:              new Date().toISOString(),
      }, { onConflict: 'org_id' })

    return Response.redirect(`${appUrl}/content/brand?linkedin_connected=1`)
  } catch (e) {
    console.error('[linkedin callback]', e)
    return Response.redirect(`${appUrl}/content/brand?linkedin_error=unknown`)
  }
}
