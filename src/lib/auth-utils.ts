// Client-side authentication utilities

export interface User {
  id: string
  username: string
  name: string
  role: 'admin' | 'staff'
}

export interface AuthSession {
  user: User
  authenticated: boolean
  timestamp: number
}

// Get current user session from cookies (client-side)
export function getCurrentUser(): AuthSession | null {
  if (typeof window === 'undefined') return null
  
  try {
    // Check for admin session first
    const adminSessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('admin-session='))
    
    if (adminSessionCookie) {
      const sessionData = decodeURIComponent(adminSessionCookie.split('=')[1])
      return JSON.parse(sessionData)
    }
    
    // Check for staff session
    const staffSessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('staff-session='))
    
    if (staffSessionCookie) {
      const sessionData = decodeURIComponent(staffSessionCookie.split('=')[1])
      return JSON.parse(sessionData)
    }
    
    return null
  } catch (error) {
    console.error('Error parsing session:', error)
    return null
  }
}

// Check if current user is admin
export function isAdmin(): boolean {
  const session = getCurrentUser()
  return session?.user?.role === 'admin' && session?.authenticated === true
}

// Check if current user is staff
export function isStaff(): boolean {
  const session = getCurrentUser()
  return session?.user?.role === 'staff' && session?.authenticated === true
}

// Check if user is authenticated (admin or staff)
export function isAuthenticated(): boolean {
  const session = getCurrentUser()
  return session?.authenticated === true
}

// Get user role
export function getUserRole(): 'admin' | 'staff' | null {
  const session = getCurrentUser()
  return session?.user?.role || null
}

// Get user name
export function getUserName(): string {
  const session = getCurrentUser()
  return session?.user?.name || 'Unknown User'
} 