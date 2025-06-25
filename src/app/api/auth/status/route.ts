import { NextRequest, NextResponse } from 'next/server'

// Make this route dynamic to avoid static generation issues
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get cookies from the request headers instead of using cookies() helper
    const cookieHeader = request.headers.get('cookie')
    
    if (!cookieHeader) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        role: null
      })
    }

    // Parse cookies manually to avoid dynamic server usage error
    const cookies = parseCookies(cookieHeader)
    
    // Check for admin session first
    const adminSession = cookies['admin-session']
    if (adminSession) {
      try {
        const sessionData = JSON.parse(decodeURIComponent(adminSession))
        if (sessionData.user && sessionData.authenticated) {
          return NextResponse.json({
            authenticated: true,
            user: sessionData.user,
            role: sessionData.user.role
          })
        }
      } catch (error) {
        console.error('Invalid admin session:', error)
      }
    }
    
    // Check for staff session
    const staffSession = cookies['staff-session']
    if (staffSession) {
      try {
        const sessionData = JSON.parse(decodeURIComponent(staffSession))
        if (sessionData.user && sessionData.authenticated) {
          return NextResponse.json({
            authenticated: true,
            user: sessionData.user,
            role: sessionData.user.role
          })
        }
      } catch (error) {
        console.error('Invalid staff session:', error)
      }
    }
    
    // No valid session found
    return NextResponse.json({
      authenticated: false,
      user: null,
      role: null
    })
    
  } catch (error) {
    console.error('Auth status check error:', error)
    return NextResponse.json({
      authenticated: false,
      user: null,
      role: null
    })
  }
}

// Helper function to parse cookies from header string
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=')
    if (name && value) {
      cookies[name] = value
    }
  })
  
  return cookies
} 