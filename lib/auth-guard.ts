import { NextRequest, NextResponse } from 'next/server'
import { ServerSessionManager } from './server-session-manager'

export type AuthError = 
  | 'AUTH_REQUIRED'
  | 'SESSION_EXPIRED'
  | 'ACCESS_DENIED'
  | 'INVALID_TOKEN'

export interface AuthErrorResponse {
  error: AuthError
  message: string
  action?: 'login' | 'refresh' | 'contact_support'
}

/**
 * Enhanced auth guard with specific error types
 */
export function authGuard(
  handler: (request: NextRequest & { user?: any }) => Promise<NextResponse>,
  options?: {
    requiredRole?: 'individual' | 'therapist' | 'partner' | 'admin'
    allowedRoles?: Array<'individual' | 'therapist' | 'partner' | 'admin'>
  }
) {
  return async (request: NextRequest) => {
    try {
      // Try to get session with automatic refresh
      const session = await SessionManager.getSessionWithRefresh()
      
      if (!session) {
        // Check if it's an expired token vs no token
        const token = request.cookies.get('quiet_session')?.value
        
        if (token) {
          // Token exists but is invalid/expired
          const errorResponse: AuthErrorResponse = {
            error: 'SESSION_EXPIRED',
            message: 'Your session has expired. Please log in again.',
            action: 'login'
          }
          return NextResponse.json(errorResponse, { status: 401 })
        } else {
          // No token at all
          const errorResponse: AuthErrorResponse = {
            error: 'AUTH_REQUIRED',
            message: 'Authentication required. Please log in.',
            action: 'login'
          }
          return NextResponse.json(errorResponse, { status: 401 })
        }
      }
      
      // Check role requirements if specified
      if (options?.requiredRole && session.role !== options.requiredRole) {
        const errorResponse: AuthErrorResponse = {
          error: 'ACCESS_DENIED',
          message: `Access denied. Required role: ${options.requiredRole}`,
          action: 'contact_support'
        }
        return NextResponse.json(errorResponse, { status: 403 })
      }
      
      // Check if user's role is in allowed roles
      if (options?.allowedRoles && !options.allowedRoles.includes(session.role)) {
        const errorResponse: AuthErrorResponse = {
          error: 'ACCESS_DENIED',
          message: `Access denied. This endpoint is not available for your role.`,
          action: 'contact_support'
        }
        return NextResponse.json(errorResponse, { status: 403 })
      }
      
      // Add user to request context
      (request as any).user = session
      
      // Call the actual handler
      return handler(request as NextRequest & { user: any })
      
    } catch (error) {
      console.error('❌ Auth guard error:', error)
      
      const errorResponse: AuthErrorResponse = {
        error: 'INVALID_TOKEN',
        message: 'Authentication error. Please log in again.',
        action: 'login'
      }
      return NextResponse.json(errorResponse, { status: 401 })
    }
  }
}

/**
 * Quick guard for individual users only
 */
export function individualGuard(handler: (request: NextRequest & { user?: any }) => Promise<NextResponse>) {
  return authGuard(handler, { requiredRole: 'individual' })
}

/**
 * Quick guard for therapists only
 */
export function therapistGuard(handler: (request: NextRequest & { user?: any }) => Promise<NextResponse>) {
  return authGuard(handler, { requiredRole: 'therapist' })
}

/**
 * Quick guard for partners only
 */
export function partnerGuard(handler: (request: NextRequest & { user?: any }) => Promise<NextResponse>) {
  return authGuard(handler, { requiredRole: 'partner' })
}

/**
 * Quick guard for admins only
 */
export function adminGuard(handler: (request: NextRequest & { user?: any }) => Promise<NextResponse>) {
  return authGuard(handler, { requiredRole: 'admin' })
}

/**
 * Guard for multiple allowed roles
 */
export function multiRoleGuard(
  allowedRoles: Array<'individual' | 'therapist' | 'partner' | 'admin'>,
  handler: (request: NextRequest & { user?: any }) => Promise<NextResponse>
) {
  return authGuard(handler, { allowedRoles })
}

