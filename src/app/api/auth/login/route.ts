import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Admin credentials (in production, store these securely/encrypted)
const ADMIN_USERNAME = 'MarkandLouie2025@'
const ADMIN_PASSWORD = 'ySz7JY^4tj@GmUqK'

// Temporary staff storage (replace with database in production)
let staffCredentials = [
  { id: 1, username: 'june.staff', password: 'Jun3@2025!', name: 'June', role: 'staff', active: true },
  { id: 2, username: 'chris.staff', password: 'Chr1s@2025!', name: 'Chris', role: 'staff', active: true },
  { id: 3, username: 'mike.staff', password: 'M1ke@2025!', name: 'Mike', role: 'staff', active: true },
  { id: 4, username: 'alison.staff', password: 'Al1s0n@2025!', name: 'Alison', role: 'staff', active: true },
  { id: 5, username: 'angela.staff', password: 'Ang3la@2025!', name: 'Angela', role: 'staff', active: true },
  { id: 6, username: 'olivia.staff', password: 'Ol1v1a@2025!', name: 'Olivia', role: 'staff', active: true },
  { id: 7, username: 'mark.staff', password: 'M@rk2025!', name: 'Mark', role: 'staff', active: true },
  { id: 8, username: 'louie.staff', password: 'L0u1e@2025!', name: 'Louie', role: 'staff', active: true }
]

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
      const staffMember = staffCredentials.find(
        staff => staff.username === username && 
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

    // Create session token (in production, use JWT or proper session management)
    const sessionToken = Buffer.from(JSON.stringify({
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      timestamp: Date.now()
    })).toString('base64')

    // Set cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    })

    response.cookies.set('auth-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}

// Export staff credentials for admin management
export function getStaffCredentials() {
  return staffCredentials
}

export function updateStaffCredentials(newCredentials: any[]) {
  staffCredentials = newCredentials
} 