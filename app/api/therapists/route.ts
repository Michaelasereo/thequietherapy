import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all approved therapist enrollments
    const { data: therapistEnrollments, error: enrollmentError } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .eq('status', 'approved')
      .order('full_name', { ascending: true })

    if (enrollmentError) {
      console.error('Get therapist enrollments error:', enrollmentError)
      return NextResponse.json(
        { error: 'Failed to get therapists' },
        { status: 500 }
      )
    }

    // Get all verified and active therapist users
    const { data: therapistUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('user_type', 'therapist')
      .eq('is_verified', true)
      .eq('is_active', true)
      .order('full_name', { ascending: true })

    if (usersError) {
      console.error('Get therapist users error:', usersError)
      return NextResponse.json(
        { error: 'Failed to get therapists' },
        { status: 500 }
      )
    }

    // Match enrollments with users by email
    const transformedTherapists = therapistEnrollments
      ?.filter(enrollment => {
        // Find matching user by email
        const matchingUser = therapistUsers?.find(user => user.email === enrollment.email)
        return matchingUser && enrollment.status === 'approved'
      })
      .map(enrollment => {
        const matchingUser = therapistUsers?.find(user => user.email === enrollment.email)
        return {
          id: matchingUser?.id || enrollment.id,
          name: enrollment.full_name || matchingUser?.full_name || 'Unknown Therapist',
          email: enrollment.email || matchingUser?.email || '',
          avatar_url: '', // Default empty string since column doesn't exist
          specialization: enrollment.specialization ? enrollment.specialization.join(', ') : '',
          experience_years: 5, // Default value
          hourly_rate: enrollment.hourly_rate || 5000,
          bio: enrollment.bio || '',
          languages: enrollment.languages || [],
          education: '', // Default empty string
          certifications: [], // Default empty array
          is_verified: matchingUser?.is_verified || false,
          is_active: matchingUser?.is_active || false,
          // Add some mock data for filtering
          gender: 'Male', // You can add this to the therapist_enrollments table
          age: '30s',
          maritalStatus: 'Single',
          phone: enrollment.phone || '',
          mdcn_code: enrollment.mdcn_code || '',
          status: enrollment.status
        }
      }) || []

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
