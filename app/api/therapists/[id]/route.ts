import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Therapist ID is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Fetching therapist by ID:', id)

    // Try to fetch from database first
    let therapist = null
    
    try {
      // First get user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, full_name, email, is_verified, is_active, created_at, updated_at')
        .eq('id', id)
        .eq('user_type', 'therapist')
        .single()

      if (userError || !userData) {
        throw new Error('User not found')
      }

      // Then get enrollment data by email
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('therapist_enrollments')
        .select(`
          id,
          bio,
          profile_image_url,
          specialization,
          languages,
          licensed_qualification,
          hourly_rate,
          status,
          is_active,
          gender,
          age,
          marital_status,
          phone,
          created_at,
          updated_at
        `)
        .eq('email', userData.email)
        .eq('status', 'approved')
        .single()

      if (enrollmentError || !enrollmentData) {
        throw new Error('Enrollment not found or not approved')
      }

      // Parse specialization and languages if they're JSON strings
      const specializations = Array.isArray(enrollmentData.specialization) 
        ? enrollmentData.specialization 
        : (typeof enrollmentData.specialization === 'string' 
          ? [enrollmentData.specialization] 
          : ['General Therapy'])
      
      const languages = Array.isArray(enrollmentData.languages)
        ? enrollmentData.languages
        : (typeof enrollmentData.languages === 'string'
          ? JSON.parse(enrollmentData.languages)
          : ['English'])

      // Transform data with real enrollment data
      therapist = {
        id: userData.id,
        full_name: userData.full_name || 'Unknown Therapist',
        email: userData.email,
        specializations,
        bio: enrollmentData.bio || 'Professional therapist ready to help you.',
        experience_years: 0, // Could be calculated later
        education: enrollmentData.licensed_qualification || 'Professional qualification',
        languages,
        session_rate: enrollmentData.hourly_rate || 5000,
        availability_status: (userData.is_active && enrollmentData.is_active) ? 'available' : 'offline',
        rating: 4.8, // Default rating - could be calculated from reviews later
        total_sessions: 0, // Could be calculated from sessions table later
        profile_image_url: enrollmentData.profile_image_url,
        verification_status: enrollmentData.status === 'approved' ? 'verified' : 'pending',
        gender: enrollmentData.gender || 'Not specified',
        age: enrollmentData.age || 'Not specified',
        maritalStatus: enrollmentData.marital_status || 'Not specified',
        created_at: enrollmentData.created_at,
        updated_at: enrollmentData.updated_at
      }

    } catch (dbError) {
      console.warn('Database query failed:', dbError)
    }

    if (!therapist) {
      return NextResponse.json(
        { success: false, error: 'Therapist not found' },
        { status: 404 }
      )
    }

    // Transform to match the expected format for BookingStep3
    const transformedTherapist = {
      id: therapist.id,
      name: therapist.full_name,
      email: therapist.email,
      picture: therapist.profile_image_url || '/placeholder.svg',
      specialization: typeof therapist.specializations === 'string' 
        ? therapist.specializations 
        : therapist.specializations?.[0] || 'General Therapy',
      gender: therapist.gender || 'Not specified',
      age: therapist.age || 'Not specified',
      maritalStatus: therapist.maritalStatus || 'Not specified',
      isVerified: therapist.verification_status === 'verified',
      is_active: therapist.availability_status === 'available',
      hourly_rate: therapist.session_rate || 5000,
      bio: therapist.bio || 'Professional therapist ready to help you.',
      availability: []
    }

    console.log('✅ Found therapist:', transformedTherapist.name)

    return NextResponse.json({
      success: true,
      therapist: transformedTherapist
    })

  } catch (error) {
    console.error('💥 Error fetching therapist:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? (error as Error).message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}