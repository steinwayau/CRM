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
  role: 'admin' | 'staff'
}

// Cache for auth status to avoid multiple API calls
let authCache: AuthSession | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Get current user session from server-side API
export async function getCurrentUser(): Promise<AuthSession | null> {
  if (typeof window === 'undefined') return null
  
  // Return cached result if still valid
  const now = Date.now()
  if (authCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return authCache
  }
  
  try {
    const response = await fetch('/api/auth/status', {
      method: 'GET',
      credentials: 'include', // Include cookies
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.authenticated) {
        authCache = {
          user: data.user,
          authenticated: true,
          role: data.role
        }
        cacheTimestamp = now
        return authCache
      }
    }
    
    // Clear cache if not authenticated
    authCache = null
    return null
  } catch (error) {
    console.error('Error checking auth status:', error)
    authCache = null
    return null
  }
}

// Synchronous version that returns cached data
export function getCurrentUserSync(): AuthSession | null {
  return authCache
}

// Clear auth cache (useful for logout)
export function clearAuthCache(): void {
  authCache = null
  cacheTimestamp = 0
}

// Check if current user is admin
export async function isAdmin(): Promise<boolean> {
  const session = await getCurrentUser()
  return session?.user?.role === 'admin' && session?.authenticated === true
}

// Check if current user is staff
export async function isStaff(): Promise<boolean> {
  const session = await getCurrentUser()
  return session?.user?.role === 'staff' && session?.authenticated === true
}

// Check if user is authenticated (admin or staff)
export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentUser()
  return session?.authenticated === true
}

// Get user role
export async function getUserRole(): Promise<'admin' | 'staff' | null> {
  const session = await getCurrentUser()
  return session?.user?.role || null
}

// Get user name
export async function getUserName(): Promise<string> {
  const session = await getCurrentUser()
  return session?.user?.name || 'Unknown User'
}

// Synchronous versions using cached data
export function isAdminSync(): boolean {
  const session = getCurrentUserSync()
  return session?.user?.role === 'admin' && session?.authenticated === true
}

export function isStaffSync(): boolean {
  const session = getCurrentUserSync()
  return session?.user?.role === 'staff' && session?.authenticated === true
}

export function isAuthenticatedSync(): boolean {
  const session = getCurrentUserSync()
  return session?.authenticated === true
}

export function getUserRoleSync(): 'admin' | 'staff' | null {
  const session = getCurrentUserSync()
  return session?.user?.role || null
}

export function getUserNameSync(): string {
  const session = getCurrentUserSync()
  return session?.user?.name || 'Unknown User'
} 