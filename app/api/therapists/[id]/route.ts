import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get therapist user by ID
    const { data: therapistUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('user_type', 'therapist')
      .single()

    if (userError || !therapistUser) {
      console.error('Get therapist user error:', userError)
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

    // Get therapist enrollment by email
    const { data: therapistEnrollment, error: enrollmentError } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .eq('email', therapistUser.email)
      .eq('status', 'approved')
      .single()

    if (enrollmentError) {
      console.error('Get therapist enrollment error:', enrollmentError)
      return NextResponse.json(
        { error: 'Therapist enrollment not found' },
        { status: 404 }
      )
    }

    // Transform the data
    const therapist = {
      id: therapistUser.id,
      name: therapistEnrollment.full_name || therapistUser.full_name || 'Unknown Therapist',
      email: therapistUser.email,
      avatar_url: '', // Default empty string since column doesn't exist
      specialization: therapistEnrollment.specialization ? therapistEnrollment.specialization.join(', ') : '',
      experience_years: 5, // Default value
      hourly_rate: therapistEnrollment.hourly_rate || 5000,
      bio: therapistEnrollment.bio || '',
      languages: therapistEnrollment.languages || [],
      education: '', // Default empty string
      certifications: [], // Default empty array
      is_verified: therapistUser.is_verified || false,
      is_active: therapistUser.is_active || false,
      // Add some mock data for filtering
      gender: 'Male', // You can add this to the therapist_enrollments table
      age: '30s',
      maritalStatus: 'Single',
      phone: therapistEnrollment.phone || '',
      mdcn_code: therapistEnrollment.mdcn_code || '',
      status: therapistEnrollment.status
    }

    return NextResponse.json({
      success: true,
      therapist: therapist
    })

  } catch (error) {
    console.error('Get therapist by ID error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
