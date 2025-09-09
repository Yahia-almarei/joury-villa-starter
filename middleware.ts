import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

export default auth(async (req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const isOnAdminRoute = nextUrl.pathname.startsWith('/admin')
  const isOnAuthRoute = nextUrl.pathname.startsWith('/auth')
  const isOnAdminLoginRoute = nextUrl.pathname === '/admin-login'
  const isOnPhoneSetup = nextUrl.pathname === '/auth/phone-setup'
  const isOnCallbackHandler = nextUrl.pathname === '/auth/callback-handler'

  // Log middleware activity for debugging
  if (isLoggedIn && (nextUrl.pathname === '/' || isOnCallbackHandler)) {
    console.log('🛡️ Middleware - User:', req.auth?.user?.email, 'Role:', req.auth?.user?.role, 'Path:', nextUrl.pathname)
  }

  // Public paths that don't require phone verification (only auth pages for customers)
  const publicPaths = [
    '/auth/signin',
    '/auth/signup',
    '/auth/error',
    '/auth/callback-handler',
    '/auth/phone-setup'
  ]

  // Paths that unauthenticated users can access
  const unauthenticatedPublicPaths = [
    '/',
    '/overview', 
    '/policies',
    '/availability',
    '/contact',
    '/gallery',
    '/map'
  ]

  // Customer paths that require phone verification
  const phoneVerificationRequired = [
    '/account',
    '/book', 
    '/checkout'
  ]

  // Protect admin routes
  if (isOnAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/auth/signin', nextUrl))
    }
    if (req.auth?.user?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', nextUrl))
    }
  }

  // Phone setup page access control
  if (isOnPhoneSetup) {
    if (!isLoggedIn || req.auth?.user?.role !== 'CUSTOMER') {
      return NextResponse.redirect(new URL('/', nextUrl))
    }
    return NextResponse.next()
  }

  // Redirect admin users to admin dashboard when they visit home page
  if (isLoggedIn && nextUrl.pathname === '/' && req.auth?.user?.role === 'ADMIN') {
    console.log('🚀 Middleware - Redirecting admin from home to /admin')
    return NextResponse.redirect(new URL('/admin', nextUrl))
  }

  // Redirect logged-in users away from auth pages (except callback handler which handles redirects)
  if (isLoggedIn && (isOnAuthRoute || isOnAdminLoginRoute) && !isOnPhoneSetup && !isOnCallbackHandler) {
    if (req.auth?.user?.role === 'ADMIN') {
      console.log('🚀 Middleware - Redirecting admin from auth page to /admin')
      return NextResponse.redirect(new URL('/admin', nextUrl))
    }
    return NextResponse.redirect(new URL('/', nextUrl))
  }

  // Allow unauthenticated users to access public paths
  if (!isLoggedIn && !unauthenticatedPublicPaths.includes(nextUrl.pathname) && !isOnAuthRoute) {
    return NextResponse.redirect(new URL('/auth/signin', nextUrl))
  }

  // Check if customer has provided phone number - required for ALL pages except auth pages
  if (isLoggedIn && 
      req.auth?.user?.role === 'CUSTOMER' && 
      !publicPaths.includes(nextUrl.pathname) &&
      !nextUrl.pathname.startsWith('/api/')) {
    
    // For customers, check if they have phone in session token
    const hasPhone = req.auth?.user?.hasPhone
    
    if (!hasPhone) {
      console.log('🛡️ Middleware - Customer needs phone verification for:', nextUrl.pathname)
      return NextResponse.redirect(new URL('/auth/phone-setup', nextUrl))
    } else {
      console.log('🛡️ Middleware - Customer has phone, allowing access to:', nextUrl.pathname)
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
}
