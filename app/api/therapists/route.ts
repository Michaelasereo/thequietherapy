import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all approved and active therapists from therapist_enrollments and users tables
    const { data: therapistEnrollments, error: enrollmentError } = await supabase
      .from('therapist_enrollments')
      .select(`
        *,
        users!inner (
          id,
          full_name,
          email,
          is_verified,
          is_active,
          user_type
        )
      `)
      .eq('status', 'approved')
      .eq('users.is_verified', true)
      .eq('users.is_active', true)
      .eq('users.user_type', 'therapist')
      .order('users(full_name)', { ascending: true })

    if (enrollmentError) {
      console.error('Get therapist enrollments error:', enrollmentError)
      return NextResponse.json(
        { error: 'Failed to get therapists' },
        { status: 500 }
      )
    }

    // Transform the data to match the expected format
    const transformedTherapists = therapistEnrollments?.map(enrollment => ({
      id: enrollment.users.id,
      name: enrollment.users.full_name || enrollment.full_name || 'Unknown Therapist',
      email: enrollment.users.email || enrollment.email || '',
      avatar_url: '', // Default empty string since column doesn't exist
      specialization: enrollment.specialization ? enrollment.specialization.join(', ') : '',
      experience_years: 5, // Default value
      hourly_rate: enrollment.hourly_rate || 5000,
      bio: enrollment.bio || '',
      languages: enrollment.languages || [],
      education: '', // Default empty string
      certifications: [], // Default empty array
      is_verified: enrollment.users.is_verified || false,
      is_active: enrollment.users.is_active || false,
      // Add some mock data for filtering
      gender: 'Male', // You can add this to the therapist_enrollments table
      age: '30s',
      maritalStatus: 'Single',
      phone: enrollment.phone || '',
      mdcn_code: enrollment.mdcn_code || '',
      status: enrollment.status
    })) || []

    console.log(`Found ${transformedTherapists.length} available therapists`)

    return NextResponse.json({
      success: true,
      therapists: transformedTherapists
    })

  } catch (error) {
    console.error('Get therapists error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
