import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Always allow auth pages through — never redirect on /login or /signup
  const isAuthPage = pathname === '/login' || pathname === '/signup'
  if (isAuthPage) {
    return response
  }

  // Safely get the user — invalid tokens must not crash middleware
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch {
    user = null
  }

  const protectedPrefixes = [
    '/dashboard', '/crm', '/pipeline', '/leads',
    '/outreach', '/websites', '/content', '/analytics',
    '/advisor', '/bots', '/settings',
  ]
  const isProtected = protectedPrefixes.some(p => pathname.startsWith(p))

  // Not logged in → login
  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Logged in → check subscription
  if (isProtected && user && !pathname.startsWith('/settings')) {
    const { data: org } = await supabase
      .from('organizations')
      .select('subscription_status, trial_ends_at')
      .eq('owner_id', user.id)
      .single()

    if (!org) {
      return NextResponse.redirect(new URL('/signup', request.url))
    }

    const isTrialingAndValid =
      org.subscription_status === 'trialing' &&
      org.trial_ends_at &&
      new Date(org.trial_ends_at) > new Date()

    const hasAccess =
      ['trialing', 'active', 'past_due'].includes(org.subscription_status) &&
      (org.subscription_status !== 'trialing' || isTrialingAndValid)

    if (!hasAccess) {
      return NextResponse.redirect(new URL('/pricing', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|embed|sites|widget.js).*)'],
}
