// Initiate TikTok OAuth flow
import { randomBytes } from 'crypto'

export async function GET() {
  const clientKey  = process.env.TIKTOK_CLIENT_KEY
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/tiktok/callback`
  const csrfState  = randomBytes(16).toString('hex')

  const params = new URLSearchParams({
    client_key:    clientKey,
    scope:         'user.info.basic,video.publish,video.upload',
    response_type: 'code',
    redirect_uri:  redirectUri,
    state:         csrfState,
  })

  return Response.redirect(
    `https://www.tiktok.com/v2/auth/authorize?${params.toString()}`
  )
}
