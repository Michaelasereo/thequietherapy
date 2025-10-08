import { NextRequest } from 'next/server'
import crypto from 'crypto'

/**
 * Session fingerprinting for enhanced security
 * Detects session hijacking by checking if session is used from different device/location
 */
export class SessionFingerprint {
  /**
   * Generate a fingerprint from request
   * Combines IP address, User Agent, and other headers
   */
  static generateFingerprint(request: NextRequest): string {
    const components = [
      this.getIpAddress(request),
      request.headers.get('user-agent') || '',
      request.headers.get('accept-language') || '',
      request.headers.get('accept-encoding') || ''
    ]

    const fingerprintString = components.join('|')
    
    // Hash the fingerprint for privacy and consistency
    return crypto
      .createHash('sha256')
      .update(fingerprintString)
      .digest('hex')
  }

  /**
   * Get IP address from request
   * Handles various proxy/CDN headers
   */
  private static getIpAddress(request: NextRequest): string {
    // Try various headers that might contain the real IP
    const possibleHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'cf-connecting-ip', // Cloudflare
      'x-client-ip',
      'x-cluster-client-ip',
      'forwarded'
    ]

    for (const header of possibleHeaders) {
      const value = request.headers.get(header)
      if (value) {
        // x-forwarded-for can have multiple IPs, take the first one
        return value.split(',')[0].trim()
      }
    }

    // Fallback to request IP from headers
    return request.headers.get('x-forwarded-for') || 
           request.headers.get('x-real-ip') || 
           'unknown'
  }

  /**
   * Compare two fingerprints
   * Returns true if they match, false otherwise
   */
  static compareFingerprints(fingerprint1: string, fingerprint2: string): boolean {
    return fingerprint1 === fingerprint2
  }

  /**
   * Generate a detailed fingerprint object (for debugging/logging)
   */
  static generateDetailedFingerprint(request: NextRequest): {
    fingerprint: string
    components: {
      ip: string
      userAgent: string
      acceptLanguage: string
      acceptEncoding: string
    }
  } {
    const ip = this.getIpAddress(request)
    const userAgent = request.headers.get('user-agent') || ''
    const acceptLanguage = request.headers.get('accept-language') || ''
    const acceptEncoding = request.headers.get('accept-encoding') || ''

    return {
      fingerprint: this.generateFingerprint(request),
      components: {
        ip,
        userAgent,
        acceptLanguage,
        acceptEncoding
      }
    }
  }

  /**
   * Check if fingerprint change is suspicious
   * Some changes are normal (e.g., IP change for mobile users)
   * Others are highly suspicious (e.g., complete device change)
   */
  static isSuspiciousChange(
    oldFingerprint: string,
    newFingerprint: string,
    oldComponents?: any,
    newComponents?: any
  ): {
    suspicious: boolean
    reason?: string
    severity: 'low' | 'medium' | 'high'
  } {
    // If fingerprints match, no issue
    if (oldFingerprint === newFingerprint) {
      return { suspicious: false, severity: 'low' }
    }

    // If we have component details, do more sophisticated analysis
    if (oldComponents && newComponents) {
      // Complete device change (user agent changed) - highly suspicious
      if (oldComponents.userAgent !== newComponents.userAgent) {
        return {
          suspicious: true,
          reason: 'Device/browser changed',
          severity: 'high'
        }
      }

      // IP changed but same device - medium risk (could be mobile user)
      if (oldComponents.ip !== newComponents.ip) {
        return {
          suspicious: true,
          reason: 'IP address changed',
          severity: 'medium'
        }
      }
    }

    // Generic fingerprint mismatch
    return {
      suspicious: true,
      reason: 'Fingerprint mismatch',
      severity: 'medium'
    }
  }

  /**
   * Store fingerprint with session
   * Should be called during session creation
   */
  static async storeFingerprint(
    sessionToken: string,
    fingerprint: string,
    components: any
  ): Promise<void> {
    // This would typically be stored in your session record
    // For now, we'll just log it
    console.log('🔐 Fingerprint stored for session:', {
      sessionToken: sessionToken.substring(0, 10) + '...',
      fingerprint: fingerprint.substring(0, 16) + '...',
      components
    })
  }
}

/**
 * Helper function to validate request fingerprint against stored session fingerprint
 */
export async function validateSessionFingerprint(
  request: NextRequest,
  storedFingerprint: string
): Promise<{
  valid: boolean
  suspicious: boolean
  reason?: string
}> {
  const currentFingerprint = SessionFingerprint.generateFingerprint(request)
  const currentDetailed = SessionFingerprint.generateDetailedFingerprint(request)

  // Check if fingerprints match
  if (SessionFingerprint.compareFingerprints(currentFingerprint, storedFingerprint)) {
    return {
      valid: true,
      suspicious: false
    }
  }

  // Analyze the change
  const suspiciousAnalysis = SessionFingerprint.isSuspiciousChange(
    storedFingerprint,
    currentFingerprint
  )

  // For high-severity changes, invalidate the session
  if (suspiciousAnalysis.severity === 'high') {
    return {
      valid: false,
      suspicious: true,
      reason: suspiciousAnalysis.reason
    }
  }

  // For medium/low severity, allow but flag as suspicious
  return {
    valid: true,
    suspicious: true,
    reason: suspiciousAnalysis.reason
  }
}

