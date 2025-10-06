import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
  identifier: string
  action: string
}

/**
 * Rate limiting system for authentication endpoints
 * Prevents brute force attacks and abuse
 */
export class RateLimiter {
  /**
   * Check if rate limit is exceeded
   * Returns true if allowed, false if rate limited
   */
  static async checkLimit(config: RateLimitConfig): Promise<boolean> {
    const { maxAttempts, windowMs, identifier, action } = config
    const now = new Date()
    const windowStart = new Date(now.getTime() - windowMs)

    try {
      // Count recent attempts
      const { data: attempts, error } = await supabase
        .from('rate_limit_attempts')
        .select('id')
        .eq('identifier', identifier)
        .eq('action', action)
        .gte('created_at', windowStart.toISOString())

      if (error) {
        console.error('❌ Rate limit check error:', error)
        // On error, allow request (fail open for better UX)
        return true
      }

      const attemptCount = attempts?.length || 0
      console.log(`🔍 Rate limit check: ${attemptCount}/${maxAttempts} attempts for ${action} by ${identifier}`)

      if (attemptCount >= maxAttempts) {
        console.warn(`⚠️ Rate limit exceeded: ${action} by ${identifier}`)
        return false
      }

      // Log this attempt
      await supabase
        .from('rate_limit_attempts')
        .insert({
          identifier,
          action,
          created_at: now.toISOString(),
          ip_address: identifier.includes('.') ? identifier : null // Store IP if identifier is an IP
        })

      return true
    } catch (error) {
      console.error('❌ Rate limit error:', error)
      // Fail open - allow request if rate limiting fails
      return true
    }
  }

  /**
   * Check magic link requests
   * 10 requests per hour per email
   */
  static async checkMagicLinkRequest(email: string): Promise<boolean> {
    return this.checkLimit({
      identifier: email.toLowerCase(),
      action: 'magic_link_request',
      maxAttempts: 10,
      windowMs: 60 * 60 * 1000 // 1 hour
    })
  }

  /**
   * Check authentication attempts from IP
   * 100 attempts per hour per IP
   */
  static async checkAuthAttempts(ipAddress: string): Promise<boolean> {
    return this.checkLimit({
      identifier: ipAddress,
      action: 'auth_attempt',
      maxAttempts: 100,
      windowMs: 60 * 60 * 1000 // 1 hour
    })
  }

  /**
   * Check failed validation attempts
   * 5 failures per minute per session
   */
  static async checkFailedValidation(sessionId: string): Promise<boolean> {
    return this.checkLimit({
      identifier: sessionId,
      action: 'failed_validation',
      maxAttempts: 5,
      windowMs: 60 * 1000 // 1 minute
    })
  }

  /**
   * Check magic link verification attempts
   * 3 attempts per token (prevent brute force)
   */
  static async checkMagicLinkVerification(token: string): Promise<boolean> {
    return this.checkLimit({
      identifier: `token_${token}`,
      action: 'magic_link_verify',
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000 // 1 hour
    })
  }

  /**
   * Clean up old rate limit records
   * Should be run periodically (e.g., via cron job)
   */
  static async cleanup(): Promise<void> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    try {
      const { error } = await supabase
        .from('rate_limit_attempts')
        .delete()
        .lt('created_at', oneDayAgo.toISOString())

      if (error) {
        console.error('❌ Rate limit cleanup error:', error)
      } else {
        console.log('✅ Rate limit records cleaned up')
      }
    } catch (error) {
      console.error('❌ Rate limit cleanup failed:', error)
    }
  }

  /**
   * Get remaining attempts for an action
   * Useful for showing users how many attempts they have left
   */
  static async getRemainingAttempts(config: RateLimitConfig): Promise<number> {
    const { maxAttempts, windowMs, identifier, action } = config
    const windowStart = new Date(Date.now() - windowMs)

    try {
      const { data: attempts, error } = await supabase
        .from('rate_limit_attempts')
        .select('id')
        .eq('identifier', identifier)
        .eq('action', action)
        .gte('created_at', windowStart.toISOString())

      if (error) {
        return maxAttempts // On error, assume full attempts available
      }

      const attemptCount = attempts?.length || 0
      return Math.max(0, maxAttempts - attemptCount)
    } catch (error) {
      return maxAttempts
    }
  }
}

/**
 * Middleware helper for rate limiting in API routes
 */
export async function withRateLimit<T>(
  identifier: string,
  action: string,
  maxAttempts: number,
  windowMs: number,
  handler: () => Promise<T>
): Promise<T> {
  const allowed = await RateLimiter.checkLimit({
    identifier,
    action,
    maxAttempts,
    windowMs
  })

  if (!allowed) {
    throw new Error('RATE_LIMIT_EXCEEDED: Too many requests. Please try again later.')
  }

  return handler()
}

