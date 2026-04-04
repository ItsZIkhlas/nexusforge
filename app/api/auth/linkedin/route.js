// Initiate LinkedIn OAuth flow
import { randomBytes } from 'crypto'

export async function GET() {
  const clientId    = process.env.LINKEDIN_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`
  const state       = randomBytes(16).toString('hex')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     clientId,
    redirect_uri:  redirectUri,
    state,
    scope:         'openid profile email w_member_social',
  })

  return Response.redirect(
    `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
  )
}
