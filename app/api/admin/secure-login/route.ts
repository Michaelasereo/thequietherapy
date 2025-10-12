import { NextRequest, NextResponse } from 'next/server'
import { createMagicLinkForAuthType } from '@/lib/auth'
import { applyRateLimit, createRateLimitHeaders } from '@/lib/rate-limit'

// Whitelist of admin emails - MOVE TO ENVIRONMENT VARIABLE
const ALLOWED_ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [
  'asereopeyemimichael@gmail.com'
]

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Apply strict rate limiting for admin login
    const rateLimit = await applyRateLimit(request, 'ADMIN_LOGIN')
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { 
          status: 429,
          headers: createRateLimitHeaders(rateLimit)
        }
      )
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // SECURITY: Don't reveal if email is in whitelist - always return success
    // This prevents user enumeration attacks
    console.log('🔑 Admin login attempt:', email)

    // Check if email is in allowed list
    const isAllowed = ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase())

    if (isAllowed) {
      // Send actual magic link
      const result = await createMagicLinkForAuthType(
        email,
        'admin',
        'login',
        { user_type: 'admin' }
      )

      if (!result.success) {
        console.error('❌ Failed to create admin magic link:', result.error)
        // Still return success to prevent enumeration
      }
    } else {
      console.warn('⚠️ Unauthorized admin login attempt:', email)
      // Don't actually send email, but return success message
    }

    // ALWAYS return the same message (prevent enumeration)
    return NextResponse.json({
      success: true,
      message: 'If you are an administrator, a magic link has been sent to your email.'
    })

  } catch (error) {
    console.error('❌ Admin login error:', error)
    // Generic error message
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

