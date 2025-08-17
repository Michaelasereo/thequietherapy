import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email, userType } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if email exists in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, user_type, is_verified')
      .eq('email', email.trim())
      .single()

    // Check if email exists in therapist_enrollments table
    const { data: therapistData, error: therapistError } = await supabase
      .from('therapist_enrollments')
      .select('id, email, status')
      .eq('email', email.trim())
      .single()

    const exists = !!(userData || therapistData)
    
    let message = ''
    let canEnroll = true
    let redirectTo = ''

    // Allow multiple roles for the same email
    if (userData) {
      // Check if user already has this specific role
      if (userData.user_type === userType) {
        if (userData.is_verified) {
          message = `You are already enrolled as a ${userType} and verified! Please use the login page to access your dashboard.`
          canEnroll = false
          redirectTo = `/${userType === 'therapist' ? 'therapist' : userType === 'partner' ? 'partner' : userType === 'admin' ? 'admin' : ''}/login`
        } else {
          message = `You have already enrolled as a ${userType} but need to verify your email. Please check your email for the verification link.`
          canEnroll = false
          redirectTo = `/${userType === 'therapist' ? 'therapist' : userType === 'partner' ? 'partner' : userType === 'admin' ? 'admin' : ''}/login`
        }
      } else {
        // User exists but with different role - allow enrollment for new role
        message = `You are already registered as a ${userData.user_type}. You can also enroll as a ${userType} with the same email.`
        canEnroll = true
      }
    } else if (therapistData) {
      if (therapistData.status === 'pending') {
        message = 'You have already enrolled as a therapist but your application is pending approval. Please check your email for the verification link.'
        canEnroll = false
        redirectTo = '/therapist/login'
      } else if (therapistData.status === 'approved') {
        message = 'You are already enrolled as a therapist and approved! Please use the login page to access your dashboard.'
        canEnroll = false
        redirectTo = '/therapist/login'
      } else if (therapistData.status === 'rejected') {
        message = 'Your previous therapist enrollment was rejected. You can still enroll for other roles or contact support for assistance.'
        canEnroll = true
      }
    }

    return NextResponse.json({
      exists,
      canEnroll,
      message,
      redirectTo,
      userType: userData?.user_type,
      isVerified: userData?.is_verified,
      status: therapistData?.status
    })

  } catch (error) {
    console.error('Error checking email:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
