import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export type AuthEventType =
  | 'login_attempt'
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'session_refresh'
  | 'session_expired'
  | 'magic_link_sent'
  | 'magic_link_verified'
  | 'magic_link_failed'
  | 'password_reset_request'
  | 'password_reset_success'
  | 'account_created'
  | 'account_deleted'
  | 'role_changed'
  | 'permissions_modified'
  | 'suspicious_activity'
  | 'session_hijack_attempt'
  | 'rate_limit_exceeded'

export interface AuditLogMetadata {
  ip_address?: string
  user_agent?: string
  location?: string
  device_fingerprint?: string
  session_id?: string
  error_message?: string
  affected_user_id?: string
  old_value?: string
  new_value?: string
  [key: string]: any
}

/**
 * HIPAA-compliant audit logging system
 * Logs all authentication and security events
 */
export class AuditLogger {
  /**
   * Log an authentication event
   */
  static async logAuthEvent(
    userId: string | null,
    eventType: AuthEventType,
    metadata: AuditLogMetadata = {}
  ): Promise<void> {
    try {
      const logEntry = {
        user_id: userId,
        event_type: eventType,
        ip_address: metadata.ip_address || null,
        user_agent: metadata.user_agent || null,
        device_fingerprint: metadata.device_fingerprint || null,
        session_id: metadata.session_id || null,
        metadata: metadata,
        created_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('audit_logs')
        .insert(logEntry)

      if (error) {
        console.error('❌ Audit log error:', error)
        // Don't throw - we don't want audit logging to break the app
      } else {
        console.log(`📝 Audit logged: ${eventType} for user ${userId || 'anonymous'}`)
      }
    } catch (error) {
      console.error('❌ Audit logging failed:', error)
      // Silent fail - audit logging should never break the app
    }
  }

  /**
   * Log successful login
   */
  static async logLoginSuccess(userId: string, metadata: AuditLogMetadata): Promise<void> {
    await this.logAuthEvent(userId, 'login_success', {
      ...metadata,
      message: 'User logged in successfully'
    })
  }

  /**
   * Log failed login attempt
   */
  static async logLoginFailure(email: string, reason: string, metadata: AuditLogMetadata): Promise<void> {
    await this.logAuthEvent(null, 'login_failure', {
      ...metadata,
      email,
      error_message: reason,
      message: 'Login attempt failed'
    })
  }

  /**
   * Log logout event
   */
  static async logLogout(userId: string, metadata: AuditLogMetadata): Promise<void> {
    await this.logAuthEvent(userId, 'logout', {
      ...metadata,
      message: 'User logged out'
    })
  }

  /**
   * Log session refresh
   */
  static async logSessionRefresh(userId: string, metadata: AuditLogMetadata): Promise<void> {
    await this.logAuthEvent(userId, 'session_refresh', {
      ...metadata,
      message: 'Session token refreshed'
    })
  }

  /**
   * Log magic link sent
   */
  static async logMagicLinkSent(email: string, metadata: AuditLogMetadata): Promise<void> {
    await this.logAuthEvent(null, 'magic_link_sent', {
      ...metadata,
      email,
      message: 'Magic link sent to user'
    })
  }

  /**
   * Log magic link verification (success or failure)
   */
  static async logMagicLinkVerification(
    userId: string | null,
    success: boolean,
    metadata: AuditLogMetadata
  ): Promise<void> {
    await this.logAuthEvent(
      userId,
      success ? 'magic_link_verified' : 'magic_link_failed',
      {
        ...metadata,
        message: success ? 'Magic link verified successfully' : 'Magic link verification failed'
      }
    )
  }

  /**
   * Log suspicious activity (e.g., session hijacking attempt)
   */
  static async logSuspiciousActivity(
    userId: string,
    activity: string,
    metadata: AuditLogMetadata
  ): Promise<void> {
    await this.logAuthEvent(userId, 'suspicious_activity', {
      ...metadata,
      activity,
      severity: 'high',
      message: `Suspicious activity detected: ${activity}`
    })
  }

  /**
   * Log session hijack attempt
   */
  static async logSessionHijackAttempt(
    userId: string,
    metadata: AuditLogMetadata
  ): Promise<void> {
    await this.logAuthEvent(userId, 'session_hijack_attempt', {
      ...metadata,
      severity: 'critical',
      message: 'Possible session hijacking attempt detected'
    })
  }

  /**
   * Log rate limit exceeded
   */
  static async logRateLimitExceeded(
    identifier: string,
    action: string,
    metadata: AuditLogMetadata
  ): Promise<void> {
    await this.logAuthEvent(null, 'rate_limit_exceeded', {
      ...metadata,
      identifier,
      action,
      message: `Rate limit exceeded for action: ${action}`
    })
  }

  /**
   * Get recent logs for a user (for admin/debugging)
   */
  static async getUserLogs(
    userId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('❌ Error fetching user logs:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('❌ Error fetching user logs:', error)
      return []
    }
  }

  /**
   * Get suspicious activity logs (for security monitoring)
   */
  static async getSuspiciousActivityLogs(limit: number = 100): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .in('event_type', ['suspicious_activity', 'session_hijack_attempt', 'rate_limit_exceeded'])
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('❌ Error fetching suspicious activity logs:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('❌ Error fetching suspicious activity logs:', error)
      return []
    }
  }

  /**
   * Archive old logs (for HIPAA compliance - retain for required period)
   * Should be run via cron job
   */
  static async archiveOldLogs(daysToRetain: number = 90): Promise<void> {
    const cutoffDate = new Date(Date.now() - daysToRetain * 24 * 60 * 60 * 1000)

    try {
      // In production, you'd move these to cold storage rather than delete
      // For now, we'll just mark them as archived
      const { error } = await supabase
        .from('audit_logs')
        .update({ archived: true })
        .lt('created_at', cutoffDate.toISOString())
        .eq('archived', false)

      if (error) {
        console.error('❌ Audit log archival error:', error)
      } else {
        console.log(`✅ Archived audit logs older than ${daysToRetain} days`)
      }
    } catch (error) {
      console.error('❌ Audit log archival failed:', error)
    }
  }
}

