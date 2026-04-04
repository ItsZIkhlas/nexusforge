// Initiate Meta (Facebook + Instagram) OAuth flow
export async function GET() {
  const appId      = process.env.META_APP_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`

  // Permissions needed:
  //   pages_manage_posts        — post to Facebook Pages
  //   pages_read_engagement     — read page info
  //   instagram_basic           — read IG account info
  //   instagram_content_publish — post to Instagram Business
  const scope = [
    'pages_manage_posts',
    'pages_read_engagement',
    'pages_show_list',
    'instagram_basic',
    'instagram_content_publish',
  ].join(',')

  const params = new URLSearchParams({
    client_id:     appId,
    redirect_uri:  redirectUri,
    scope,
    response_type: 'code',
    state:         'nexus_meta',
  })

  return Response.redirect(
    `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`
  )
}
