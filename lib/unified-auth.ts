import { cookies } from 'next/headers'
import { ServerSessionManager } from './server-session-manager'
import { createClient } from '@supabase/supabase-js'
import { AuditLogger } from './audit-logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export interface AuthValidationResult {
  user: {
    id: string
    email: string
    name: string
    role: 'individual' | 'therapist' | 'partner' | 'admin'
    user_type: string
    is_verified: boolean
    is_active: boolean
  }
  session: {
    id: string
    token: string
    expires_at: Date
  }
}

/**
 * Unified Authentication System
 * Single source of truth for all authentication operations
 */
export class UnifiedAuth {
  private static SESSION_COOKIE = 'quiet_session'
  
  /**
   * Validate current session with automatic refresh
   * Returns user and session data if valid, null otherwise
   */
  static async validateSession(): Promise<AuthValidationResult | null> {
    try {
      console.log('🔍 UnifiedAuth: Validating session...')
      
      // Try to get session with automatic refresh
      const session = await SessionManager.getSessionWithRefresh()
      
      if (!session) {
        console.log('❌ UnifiedAuth: No valid session found')
        // Clear any inconsistent client-side cookies
        await this.clearLegacyCookies()
        return null
      }
      
      console.log('✅ UnifiedAuth: Session validated for user:', session.email)
      
      return {
        user: {
          id: session.id,
          email: session.email,
          name: session.name,
          role: session.role,
          user_type: session.user_type,
          is_verified: session.is_verified,
          is_active: session.is_active
        },
        session: {
          id: session.id,
          token: session.session_token || '',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      }
    } catch (error) {
      console.error('❌ UnifiedAuth: Session validation error:', error)
      await this.logout() // Clean up on any error
      return null
    }
  }
  
  /**
   * Comprehensive logout - clears everything
   */
  static async logout(): Promise<void> {
    try {
      console.log('🔐 UnifiedAuth: Starting comprehensive logout...')
      
      // Get current session before clearing
      const session = await SessionManager.getSession()
      
      // Audit log: Logout event
      if (session) {
        await AuditLogger.logLogout(session.id, {
          email: session.email,
          role: session.role
        })
      }
      
      // Invalidate server-side session in database
      if (session?.session_token) {
        await this.invalidateDatabaseSession(session.session_token)
      }
      
      // Clear the main session cookie
      await SessionManager.clearSession()
      
      // Clear any legacy cookies
      await this.clearLegacyCookies()
      
      console.log('✅ UnifiedAuth: Logout completed')
    } catch (error) {
      console.error('❌ UnifiedAuth: Logout error:', error)
      // Still try to clear cookies even if DB operation fails
      await SessionManager.clearSession()
      await this.clearLegacyCookies()
    }
  }
  
  /**
   * Invalidate session in database
   */
  private static async invalidateDatabaseSession(sessionToken: string): Promise<void> {
    try {
      console.log('🗑️  UnifiedAuth: Invalidating database session...')
      
      // Mark session as invalidated in database
      const { error } = await supabase
        .from('user_sessions')
        .update({ 
          invalidated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('session_token', sessionToken)
      
      if (error) {
        console.error('❌ UnifiedAuth: Error invalidating session:', error)
      } else {
        console.log('✅ UnifiedAuth: Database session invalidated')
      }
    } catch (error) {
      console.error('❌ UnifiedAuth: Database session invalidation failed:', error)
    }
  }
  
  /**
   * Clear legacy/inconsistent cookies
   */
  private static async clearLegacyCookies(): Promise<void> {
    try {
      const cookieStore = await cookies()
      
      // List of legacy cookies to clear
      const legacyCookies = [
        'quiet_user',
        'quiet_therapist',
        'quiet_therapist_user',
        'quiet_individual_user',
        'quiet_partner_user',
        'quiet_admin_user'
      ]
      
      for (const cookieName of legacyCookies) {
        cookieStore.delete(cookieName)
      }
      
      console.log('🧹 UnifiedAuth: Legacy cookies cleared')
    } catch (error) {
      console.error('❌ UnifiedAuth: Error clearing legacy cookies:', error)
    }
  }
  
  /**
   * Check if user has specific role
   */
  static async hasRole(requiredRole: 'individual' | 'therapist' | 'partner' | 'admin'): Promise<boolean> {
    const validation = await this.validateSession()
    return validation?.user.role === requiredRole
  }
  
  /**
   * Require specific role (throws if not authorized)
   */
  static async requireRole(requiredRole: 'individual' | 'therapist' | 'partner' | 'admin'): Promise<AuthValidationResult> {
    const validation = await this.validateSession()
    
    if (!validation) {
      throw new Error('AUTH_REQUIRED: Authentication required')
    }
    
    if (validation.user.role !== requiredRole) {
      throw new Error(`ACCESS_DENIED: Required role: ${requiredRole}, got: ${validation.user.role}`)
    }
    
    return validation
  }
  
  /**
   * Refresh session activity timestamp
   */
  static async updateSessionActivity(sessionToken: string): Promise<void> {
    try {
      await supabase
        .from('user_sessions')
        .update({ 
          last_accessed_at: new Date().toISOString() 
        })
        .eq('session_token', sessionToken)
    } catch (error) {
      console.error('❌ UnifiedAuth: Error updating session activity:', error)
    }
  }
}

