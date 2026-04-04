import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  // Use the request's own origin so it works on localhost AND ngrok
  const origin = request.headers.get('origin') || request.nextUrl.origin
  return NextResponse.redirect(new URL('/login', origin))
}
