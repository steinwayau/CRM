import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check if the request is for admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Check for authentication session
    const session = request.cookies.get('admin-session')
    
    // If no session, redirect to login
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // Verify session is valid (basic check)
    try {
      const sessionData = JSON.parse(session.value)
      if (!sessionData.user || !sessionData.authenticated) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    } catch (error) {
      // Invalid session format, redirect to login
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Check if the request is for staff dashboard
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // Check for any valid session (admin or staff)
    const adminSession = request.cookies.get('admin-session')
    const staffSession = request.cookies.get('staff-session')
    
    if (!adminSession && !staffSession) {
      return NextResponse.redirect(new URL('/staff', request.url))
    }
    
    // Verify at least one session is valid
    let hasValidSession = false
    
    if (adminSession) {
      try {
        const sessionData = JSON.parse(adminSession.value)
        if (sessionData.user && sessionData.authenticated) {
          hasValidSession = true
        }
      } catch (error) {
        // Invalid admin session
      }
    }
    
    if (staffSession && !hasValidSession) {
      try {
        const sessionData = JSON.parse(staffSession.value)
        if (sessionData.user && sessionData.authenticated) {
          hasValidSession = true
        }
      } catch (error) {
        // Invalid staff session
      }
    }
    
    if (!hasValidSession) {
      return NextResponse.redirect(new URL('/staff', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*'
  ]
} 