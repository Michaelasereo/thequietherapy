import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface AuthenticatedUser {
  id: string
  email: string
  full_name: string
  user_type: 'individual' | 'therapist' | 'partner' | 'admin'
  is_verified: boolean
  is_active: boolean
  credits?: number
  package_type?: string
}

export interface AuthenticatedRequest extends NextRequest {
  user: AuthenticatedUser
}

// Cookie names for different user types
const USER_COOKIE_NAMES = {
  individual: 'quiet_individual_user',
  therapist: 'quiet_therapist_user', 
  partner: 'quiet_partner_user',
  admin: 'quiet_admin_user'
} as const

export type UserType = keyof typeof USER_COOKIE_NAMES

/**
 * Parse cookies from request header
 */
export function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {}
  
  return cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    if (key && value) {
      acc[key.trim()] = value.trim()
    }
    return acc
  }, {} as Record<string, string>)
}

/**
 * Find and decode user cookie from request
 */
export function findUserCookie(cookies: Record<string, string>): { cookie: string; userType: UserType } | null {
  for (const [userType, cookieName] of Object.entries(USER_COOKIE_NAMES)) {
    const cookie = cookies[cookieName]
    if (cookie) {
      return { cookie, userType: userType as UserType }
    }
  }
  return null
}

/**
 * Validate user session against database
 */
export async function validateUserSession(userId: string, userType: UserType): Promise<AuthenticatedUser | null> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        user_type,
        is_verified,
        is_active,
        credits,
        package_type
      `)
      .eq('id', userId)
      .eq('user_type', userType)
      .eq('is_active', true)
      .single()

    if (error || !user) {
      console.error(`User validation failed for ${userType} user ${userId}:`, error)
      return null
    }

    return user as AuthenticatedUser
  } catch (error) {
    console.error('Database validation error:', error)
    return null
  }
}

/**
 * Main authentication function
 */
export async function authenticateRequest(request: NextRequest): Promise<NextResponse | AuthenticatedRequest> {
  try {
    // Parse cookies
    const cookies = parseCookies(request.headers.get('cookie'))
    
    // Find user cookie
    const userCookieData = findUserCookie(cookies)
    if (!userCookieData) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    // Decode and parse cookie
    let userData
    try {
      const decodedCookie = decodeURIComponent(userCookieData.cookie)
      userData = JSON.parse(decodedCookie)
    } catch (error) {
      console.error('Cookie parsing error:', error)
      return NextResponse.json({ error: 'Invalid session format' }, { status: 401 })
    }

    // Validate session token exists
    if (!userData.session_token) {
      return NextResponse.json({ error: 'No session token' }, { status: 401 })
    }

    // Validate user against database
    const authenticatedUser = await validateUserSession(userData.id, userCookieData.userType)
    if (!authenticatedUser) {
      return NextResponse.json({ error: 'Invalid user session' }, { status: 401 })
    }

    // Add user to request
    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.user = authenticatedUser

    return authenticatedRequest
  } catch (error) {
    console.error('Authentication error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
  }
}

/**
 * Role-based authentication middleware
 */
export function requireRole(allowedRoles: UserType[]) {
  return function(handler: (request: AuthenticatedRequest) => Promise<NextResponse>) {
    return async (request: NextRequest) => {
      const authResult = await authenticateRequest(request)
      
      if (authResult instanceof NextResponse) {
        return authResult
      }
      
      // Check if user has required role
      if (!allowedRoles.includes(authResult.user.user_type)) {
        return NextResponse.json({ 
          error: 'Insufficient permissions',
          required: allowedRoles,
          current: authResult.user.user_type
        }, { status: 403 })
      }
      
      return handler(authResult)
    }
  }
}

/**
 * Admin-only authentication middleware
 */
export const requireAdmin = requireRole(['admin'])

/**
 * Individual user authentication middleware
 */
export const requireIndividual = requireRole(['individual'])

/**
 * Therapist authentication middleware
 */
export const requireTherapist = requireRole(['therapist'])

/**
 * Partner authentication middleware
 */
export const requirePartner = requireRole(['partner'])

/**
 * Any authenticated user middleware
 */
export const requireAuth = requireRole(['individual', 'therapist', 'partner', 'admin'])
