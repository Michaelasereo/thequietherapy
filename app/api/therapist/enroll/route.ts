import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createMagicLinkForAuthType } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      fullName,
      phone,
      licensedQualification,
      specialization,
      languages,
      gender,
      age,
      maritalStatus,
      bio
    } = body

    console.log('🔑 Therapist enrollment request for:', email)

    // Validate required fields
    if (!email || !fullName || !phone || !licensedQualification || !gender || !age || !maritalStatus || !bio) {
      return NextResponse.json({
        success: false,
        error: 'All required fields must be filled'
      }, { status: 400 })
    }

    // Check if enrollment already exists
    const { data: existingEnrollment, error: checkError } = await supabase
      .from('therapist_enrollments')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing enrollment:', checkError)
      return NextResponse.json({
        success: false,
        error: 'Database error while checking existing enrollment'
      }, { status: 500 })
    }

    if (existingEnrollment) {
      return NextResponse.json({
        success: false,
        error: 'An enrollment with this email already exists. Please use the login page.'
      }, { status: 400 })
    }

    // Create enrollment record with ALL fields
    // Use both specialization (for compatibility) and specializations (preferred)
    const { error: enrollmentError } = await supabase
      .from('therapist_enrollments')
      .insert({
        full_name: fullName,
        email: email.toLowerCase(),
        phone,
        licensed_qualification: licensedQualification,
        specialization: Array.isArray(specialization) ? specialization.join(', ') : specialization || null, // Legacy TEXT column
        specializations: Array.isArray(specialization) ? specialization : (specialization ? [specialization] : []), // Preferred TEXT[] column
        languages: Array.isArray(languages) ? languages.join(', ') : languages || null, // Legacy TEXT column
        languages_array: Array.isArray(languages) ? languages : (languages ? [languages] : []), // Preferred TEXT[] column
        gender,
        age: parseInt(age),
        marital_status: maritalStatus,
        bio,
        status: 'pending' // Admin needs to approve before they can set availability
      })

    if (enrollmentError) {
      console.error('Error creating enrollment:', enrollmentError)
      return NextResponse.json({
        success: false,
        error: 'Failed to save enrollment data. Please try again.',
        details: enrollmentError.message
      }, { status: 500 })
    }

    console.log('✅ Enrollment saved successfully')

    // Send magic link to create account and access dashboard
    // They can login but can't set availability until admin approves
    const magicLinkResult = await createMagicLinkForAuthType(
      email,
      'therapist',
      'signup',
      {
        user_type: 'therapist',
        first_name: fullName,
        email: email.toLowerCase(),
        fullName: fullName,
        phone,
        licensedQualification,
        specialization,
        languages,
        gender,
        age,
        maritalStatus,
        bio
      }
    )

    if (!magicLinkResult.success) {
      console.error('Failed to create magic link:', magicLinkResult.error)
      // Enrollment was created but magic link failed - still return success but warn
      return NextResponse.json({
        success: true,
        message: 'Enrollment submitted but magic link failed. Please try logging in manually.',
        enrollment_created: true,
        magic_link_error: magicLinkResult.error
      })
    }

    console.log('✅ Magic link sent to therapist:', email)

    return NextResponse.json({
      success: true,
      message: 'Enrollment submitted successfully. Magic link sent to your email.',
      email: email.toLowerCase()
    })

  } catch (error) {
    console.error('❌ Therapist enrollment error:', error)
    return NextResponse.json({
      success: false,
      error: 'An error occurred during enrollment. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

