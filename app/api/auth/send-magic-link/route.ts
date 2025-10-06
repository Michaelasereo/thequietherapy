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

    // Use Supabase's built-in magic link
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback?user_type=${user_type || 'individual'}`,
        data: {
          user_type: user_type || 'individual'
        }
      }
    })

    if (error) {
      console.error('Supabase magic link error:', error)
      
      // Handle specific Supabase errors
      if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
        return NextResponse.json(
          { success: false, error: 'Email rate limit exceeded. Please wait a few minutes before trying again.' },
          { status: 429 }
        )
      }
      
      if (error.message?.includes('Invalid email')) {
        return NextResponse.json(
          { success: false, error: 'Please enter a valid email address' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to send magic link. Please try again later.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Magic link sent successfully'
    })

  } catch (error) {
    console.error('Send magic link error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
