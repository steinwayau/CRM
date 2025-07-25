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

  // Check if the request is for staff dashboard or submitted forms
  if (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/submitted-forms')) {
    // Check for any valid session (admin or staff)
    const adminSession = request.cookies.get('admin-session')
    const staffSession = request.cookies.get('staff-session')
    
    let hasValidSession = false
    
    // Check admin session first
    if (adminSession) {
      try {
        const sessionData = JSON.parse(adminSession.value)
        if (sessionData.user && sessionData.authenticated) {
          hasValidSession = true
        }
      } catch (error) {
        // Invalid session
      }
    }
    
    // Check staff session if admin session is not valid
    if (!hasValidSession && staffSession) {
      try {
        const sessionData = JSON.parse(staffSession.value)
        if (sessionData.user && sessionData.authenticated) {
          hasValidSession = true
        }
      } catch (error) {
        // Invalid session
      }
    }
    
    // If no valid session found, redirect to login page
    if (!hasValidSession) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/submitted-forms/:path*'
  ]
} 