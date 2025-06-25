import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    
    // Check for admin session first
    const adminSession = cookieStore.get('admin-session')
    if (adminSession) {
      try {
        const sessionData = JSON.parse(adminSession.value)
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
    const staffSession = cookieStore.get('staff-session')
    if (staffSession) {
      try {
        const sessionData = JSON.parse(staffSession.value)
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