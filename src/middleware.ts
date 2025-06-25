import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  console.log('[MIDDLEWARE] Processing request for:', request.nextUrl.pathname)
  
  // Check if the request is for admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    console.log('[MIDDLEWARE] Admin route detected')
    // Check for authentication session
    const session = request.cookies.get('admin-session')
    
    console.log('[MIDDLEWARE] Admin session cookie exists:', !!session)
    
    // If no session, redirect to login
    if (!session) {
      console.log('[MIDDLEWARE] No admin session, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // Verify session is valid (basic check)
    try {
      const sessionData = JSON.parse(session.value)
      console.log('[MIDDLEWARE] Session data:', { user: !!sessionData.user, authenticated: sessionData.authenticated })
      if (!sessionData.user || !sessionData.authenticated) {
        console.log('[MIDDLEWARE] Invalid session data, redirecting to login')
        return NextResponse.redirect(new URL('/login', request.url))
      }
      console.log('[MIDDLEWARE] Admin session valid, proceeding')
    } catch (error) {
      // Invalid session format, redirect to login
      console.log('[MIDDLEWARE] Session parse error:', error)
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Check if the request is for staff dashboard or submitted forms
  if (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/submitted-forms')) {
    console.log('[MIDDLEWARE] Dashboard/submitted-forms route detected')
    // Check for any valid session (admin or staff)
    const adminSession = request.cookies.get('admin-session')
    const staffSession = request.cookies.get('staff-session')
    
    console.log('[MIDDLEWARE] Cookie check - admin:', !!adminSession, 'staff:', !!staffSession)
    
    let hasValidSession = false
    
    // Check admin session first
    if (adminSession) {
      try {
        const sessionData = JSON.parse(adminSession.value)
        console.log('[MIDDLEWARE] Admin session data:', { user: !!sessionData.user, authenticated: sessionData.authenticated })
        if (sessionData.user && sessionData.authenticated) {
          hasValidSession = true
          console.log('[MIDDLEWARE] Admin session is valid')
        }
      } catch (error) {
        console.log('[MIDDLEWARE] Invalid admin session:', error)
      }
    }
    
    // Check staff session if admin session is not valid
    if (!hasValidSession && staffSession) {
      try {
        const sessionData = JSON.parse(staffSession.value)
        console.log('[MIDDLEWARE] Staff session data:', { user: !!sessionData.user, authenticated: sessionData.authenticated })
        if (sessionData.user && sessionData.authenticated) {
          hasValidSession = true
          console.log('[MIDDLEWARE] Staff session is valid')
        }
      } catch (error) {
        console.log('[MIDDLEWARE] Invalid staff session:', error)
      }
    }
    
    console.log('[MIDDLEWARE] Final hasValidSession result:', hasValidSession)
    
    // If no valid session found, redirect to login page
    if (!hasValidSession) {
      console.log('[MIDDLEWARE] No valid session found, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }
    console.log('[MIDDLEWARE] Session valid, proceeding')
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*'
    // Temporarily disabled: '/submitted-forms/:path*'
  ]
} 