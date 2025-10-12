/**
 * Audit Logger - Simple implementation for production
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export class AuditLogger {
  /**
   * Log rate limit exceeded event
   */
  static async logRateLimitExceeded(
    identifier: string,
    action: string,
    metadata?: any
  ): Promise<void> {
    try {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: null,
          action: 'rate_limit_exceeded',
          resource_type: action,
          resource_id: identifier,
          metadata: metadata || {},
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.warn('Failed to log audit event:', error);
    }
  }

  /**
   * Log authentication event
   */
  static async logAuthEvent(
    userId: string | null,
    action: string,
    success: boolean,
    metadata?: any
  ): Promise<void> {
    try {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action: `auth_${action}`,
          resource_type: 'authentication',
          resource_id: userId || 'unknown',
          metadata: { success, ...metadata },
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.warn('Failed to log auth event:', error);
    }
  }

  /**
   * Log magic link sent event
   */
  static async logMagicLinkSent(
    email: string,
    metadata?: any
  ): Promise<void> {
    try {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: null,
          action: 'magic_link_sent',
          resource_type: 'magic_link',
          resource_id: email,
          metadata: metadata || {},
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.warn('Failed to log magic link sent:', error);
    }
  }

  /**
   * Log magic link verification event
   */
  static async logMagicLinkVerification(
    userId: string | null,
    success: boolean,
    metadata?: any
  ): Promise<void> {
    try {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action: 'magic_link_verification',
          resource_type: 'magic_link',
          resource_id: userId || 'unknown',
          metadata: { success, ...metadata },
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.warn('Failed to log magic link verification:', error);
    }
  }

  /**
   * Log login success event
   */
  static async logLoginSuccess(
    userId: string,
    metadata?: any
  ): Promise<void> {
    try {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action: 'login_success',
          resource_type: 'authentication',
          resource_id: userId,
          metadata: metadata || {},
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.warn('Failed to log login success:', error);
    }
  }

  /**
   * Log login failure event
   */
  static async logLoginFailure(
    email: string,
    metadata?: any
  ): Promise<void> {
    try {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: null,
          action: 'login_failure',
          resource_type: 'authentication',
          resource_id: email,
          metadata: metadata || {},
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.warn('Failed to log login failure:', error);
    }
  }

  /**
   * Log signup event
   */
  static async logSignup(
    userId: string,
    metadata?: any
  ): Promise<void> {
    try {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action: 'signup',
          resource_type: 'user',
          resource_id: userId,
          metadata: metadata || {},
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.warn('Failed to log signup:', error);
    }
  }

  /**
   * Log logout event
   */
  static async logLogout(
    userId: string,
    metadata?: any
  ): Promise<void> {
    try {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action: 'logout',
          resource_type: 'authentication',
          resource_id: userId,
          metadata: metadata || {},
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.warn('Failed to log logout:', error);
    }
  }

  /**
   * Log session created event
   */
  static async logSessionCreated(
    userId: string,
    metadata?: any
  ): Promise<void> {
    try {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action: 'session_created',
          resource_type: 'session',
          resource_id: userId,
          metadata: metadata || {},
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.warn('Failed to log session created:', error);
    }
  }

  /**
   * Log general event
   */
  static async log(
    userId: string | null,
    action: string,
    resourceType: string,
    resourceId: string,
    metadata?: any
  ): Promise<void> {
    try {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          metadata: metadata || {},
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.warn('Failed to log audit event:', error);
    }
  }
}
