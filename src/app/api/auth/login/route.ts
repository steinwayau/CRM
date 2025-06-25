import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getStaffCredentials } from '@/lib/staff-data'

// Admin credentials (in production, store these securely/encrypted)
const ADMIN_USERNAME = 'MarkandLouie2025@'
const ADMIN_PASSWORD = 'ySz7JY^4tj@GmUqK'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    let user = null
    let role = null

    // Check admin credentials
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      user = {
        id: 'admin',
        username: ADMIN_USERNAME,
        name: 'Administrator',
        role: 'admin'
      }
      role = 'admin'
    } else {
      // Check staff credentials
      const staffCredentials = getStaffCredentials()
      const staffMember = staffCredentials.find(
        (staff: any) => staff.username === username && 
                staff.password === password && 
                staff.active
      )

      if (staffMember) {
        user = {
          id: staffMember.id,
          username: staffMember.username,
          name: staffMember.name,
          role: 'staff'
        }
        role = 'staff'
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create session data
    const sessionData = {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      },
      authenticated: true,
      timestamp: Date.now()
    }

    // Set cookie based on role
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    })

    if (role === 'admin') {
      response.cookies.set('admin-session', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
    } else {
      response.cookies.set('staff-session', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
    }

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}

// Note: Staff management functions are now in @/lib/staff-data 