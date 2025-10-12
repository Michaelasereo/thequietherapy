/**
 * Rate Limiting Implementation
 * 
 * EMERGENCY IMPLEMENTATION using in-memory cache
 * TODO: Replace with Redis (@upstash/ratelimit) in production for multi-instance support
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (use Redis in production!)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: Date
}

/**
 * Check rate limit for a given identifier
 * 
 * @param identifier - Unique identifier (IP address, user ID, email, etc.)
 * @param endpoint - Endpoint name for separate rate limits
 * @param maxRequests - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const key = `${endpoint}:${identifier}`
  const now = Date.now()
  
  let entry = rateLimitStore.get(key)
  
  // Create new entry if doesn't exist or expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + windowMs
    }
  }
  
  // Increment count
  entry.count++
  rateLimitStore.set(key, entry)
  
  const remaining = Math.max(0, maxRequests - entry.count)
  const success = entry.count <= maxRequests
  
  return {
    success,
    limit: maxRequests,
    remaining,
    reset: new Date(entry.resetAt)
  }
}

/**
 * Get client identifier from request (IP address or user ID)
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (for deployments behind proxies)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  // Fallback - this won't work in production behind proxy
  return 'unknown-client'
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  AUTH_LOGIN: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 min
  AUTH_REGISTER: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  ADMIN_LOGIN: { maxRequests: 3, windowMs: 15 * 60 * 1000 }, // 3 per 15 min
  MAGIC_LINK: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
  BOOKING: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
  PAYMENT: { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20 per hour
  PUBLIC_API: { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100 per hour
} as const

/**
 * Helper function to apply rate limit to API route
 * 
 * @example
 * export async function POST(request: NextRequest) {
 *   const rateLimit = await applyRateLimit(request, 'AUTH_LOGIN')
 *   if (!rateLimit.success) {
 *     return NextResponse.json(
 *       { error: 'Too many requests' },
 *       { 
 *         status: 429,
 *         headers: {
 *           'X-RateLimit-Limit': rateLimit.limit.toString(),
 *           'X-RateLimit-Remaining': rateLimit.remaining.toString(),
 *           'X-RateLimit-Reset': rateLimit.reset.toISOString()
 *         }
 *       }
 *     )
 *   }
 *   // ... rest of handler
 * }
 */
export async function applyRateLimit(
  request: Request,
  limitType: keyof typeof RATE_LIMITS
): Promise<RateLimitResult> {
  const identifier = getClientIdentifier(request)
  const config = RATE_LIMITS[limitType]
  
  return checkRateLimit(
    identifier,
    limitType,
    config.maxRequests,
    config.windowMs
  )
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toISOString(),
    ...(result.success ? {} : { 'Retry-After': Math.ceil((result.reset.getTime() - Date.now()) / 1000).toString() })
  }
}

/**
 * RateLimiter class for backward compatibility
 * Wraps the rate limiting functions in a class interface
 */
export class RateLimiter {
  /**
   * Check if magic link request is allowed for this email
   */
  static async checkMagicLinkRequest(email: string): Promise<boolean> {
    const result = await checkRateLimit(
      email,
      'magic_link_request',
      10, // 10 magic links
      60 * 60 * 1000 // per hour
    );
    return result.success;
  }

  /**
   * Check if magic link verification is allowed for this token
   */
  static async checkMagicLinkVerification(token: string): Promise<boolean> {
    const result = await checkRateLimit(
      token,
      'magic_link_verification',
      5, // 5 attempts
      15 * 60 * 1000 // per 15 minutes
    );
    return result.success;
  }

  /**
   * Check general rate limit
   */
  static async check(
    identifier: string,
    endpoint: string,
    maxRequests: number,
    windowMs: number
  ): Promise<boolean> {
    const result = await checkRateLimit(identifier, endpoint, maxRequests, windowMs);
    return result.success;
  }
}
