import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Simple in-memory rate limiting (for production, use Redis or database)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

function checkRateLimit(email: string): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute window
  const maxRequests = 3 // Max 3 requests per minute per email
  
  const key = email.toLowerCase()
  const current = rateLimitMap.get(key)
  
  if (!current || now - current.lastReset > windowMs) {
    rateLimitMap.set(key, { count: 1, lastReset: now })
    return true
  }
  
  if (current.count >= maxRequests) {
    return false
  }
  
  current.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, user_type, type = 'login' } = body

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Check rate limit
    if (!checkRateLimit(email.trim())) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait a moment before trying again.' },
        { status: 429 }
      )
    }

    // Use custom Brevo email implementation instead of Supabase's built-in magic link
    const { createMagicLinkForAuthType } = await import('@/lib/auth')
    
    const result = await createMagicLinkForAuthType(
      email.trim(),
      user_type as 'individual' | 'therapist' | 'partner' | 'admin',
      type as 'login' | 'signup',
      { user_type }
    )

    if (!result.success) {
      console.error('Magic link creation error:', result.error)
      
      // Handle specific errors
      if (result.error?.includes('rate limit') || result.error?.includes('Too many')) {
        return NextResponse.json(
          { success: false, error: 'Too many requests. Please wait a moment before trying again.' },
          { status: 429 }
        )
      }

      // If user exists and should login instead, return redirect info
      if (result.error?.includes('already registered') || result.error?.includes('login instead')) {
        return NextResponse.json(
          { 
            success: false, 
            error: result.error || 'This email is already registered. Please use login instead.',
            redirectTo: result.redirectTo
          },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send magic link. Please try again later.' },
        { status: 500 }
      )
    }

    const isDevelopment = process.env.NODE_ENV !== 'production'
    
    return NextResponse.json({
      success: true,
      message: isDevelopment && result.magicLink 
        ? result.message || 'Magic link created! Check your console or use the link below (development mode).'
        : 'Magic link sent! Please check your email.',
      // Include magic link in development mode
      ...(isDevelopment && result.magicLink && { magicLink: result.magicLink })
    })

  } catch (error) {
    console.error('Send magic link error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
