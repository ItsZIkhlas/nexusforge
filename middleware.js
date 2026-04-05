import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  const response = NextResponse.next({ request })
  const { pathname } = request.nextUrl

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

  const { data: { user } } = await supabase.auth.getUser()

  // All dashboard module routes require auth
  const protectedPrefixes = [
    '/dashboard', '/crm', '/pipeline', '/leads',
    '/outreach', '/websites', '/content', '/analytics',
    '/advisor', '/bots', '/settings',
  ]
  const isProtected = protectedPrefixes.some(p => pathname.startsWith(p))

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Check subscription for all protected routes except /settings
  if (isProtected && user && !pathname.startsWith('/settings')) {
    const { data: org } = await supabase
      .from('organizations')
      .select('subscription_status, trial_ends_at')
      .eq('owner_id', user.id)
      .single()

    // No org yet — send back to signup to complete registration
    if (!org) {
      return NextResponse.redirect(new URL('/signup', request.url))
    }

    const activeStatuses = ['trialing', 'active', 'past_due']
    const isTrialingAndValid =
      org.subscription_status === 'trialing' &&
      org.trial_ends_at &&
      new Date(org.trial_ends_at) > new Date()

    const hasAccess =
      activeStatuses.includes(org.subscription_status) &&
      (org.subscription_status !== 'trialing' || isTrialingAndValid)

    if (!hasAccess) {
      return NextResponse.redirect(new URL('/pricing', request.url))
    }
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|embed|sites|widget.js).*)'],
}
