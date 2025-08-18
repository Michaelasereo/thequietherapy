import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import { createMagicLinkForAuthType } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, fullName, userType = 'individual' } = body

    console.log('📝 Signup request:', { email, fullName, userType })

    if (!email || !fullName) {
      return NextResponse.json(
        { success: false, error: 'Email and full name are required' },
        { status: 400 }
      )
    }

    if (!['individual', 'therapist', 'partner', 'admin'].includes(userType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user type' },
        { status: 400 }
      )
    }

    // Admin signup restriction - only allow specific email
    if (userType === 'admin' && email !== 'michaelasereoo@gmail.com') {
      console.log('❌ Admin signup attempt with unauthorized email:', email)
      return NextResponse.json(
        { success: false, error: 'Admin signup is restricted to authorized personnel only.' },
        { status: 403 }
      )
    }

    // Check if user already exists and is verified
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email, is_verified')
      .eq('email', email)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing user:', checkError)
      return NextResponse.json(
        { success: false, error: 'Error checking user account' },
        { status: 500 }
      )
    }

    if (existingUser && existingUser.is_verified) {
      console.log('User already exists and is verified:', email)
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists. Please log in instead.' },
        { status: 409 }
      )
    }

    // Create magic link for signup
    const result = await createMagicLinkForAuthType(email, userType, 'signup', {
      first_name: fullName,
      user_type: userType
    })

    if (result.success) {
      console.log('✅ Magic link created for signup:', { email, userType })
      return NextResponse.json({
        success: true,
        message: `Verification link sent to ${email}. Please check your email to complete registration.`,
        user: {
          email: email,
          full_name: fullName
        }
      })
    } else {
      console.error('❌ Failed to create magic link:', result.error)
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to create verification link' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Signup error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
