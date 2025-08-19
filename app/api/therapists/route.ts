import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all active therapists with user data
    const { data: therapists, error } = await supabase
      .from('therapists')
      .select(`
        *,
        user:user_id (
          id,
          full_name,
          email,
          is_verified,
          is_active
        )
      `)
      .eq('is_active', true)
      .eq('is_verified', true)
      .order('user(full_name)', { ascending: true })

    if (error) {
      console.error('Get therapists error:', error)
      return NextResponse.json(
        { error: 'Failed to get therapists' },
        { status: 500 }
      )
    }

    // Transform the data to match the expected format
    const transformedTherapists = therapists?.map(therapist => ({
      id: therapist.user_id,
      name: therapist.user?.full_name || 'Unknown Therapist',
      email: therapist.user?.email || '',
      avatar_url: '', // Default empty string since column doesn't exist
      specialization: therapist.specialization || '',
      experience_years: therapist.experience_years || 0,
      hourly_rate: therapist.hourly_rate || 50,
      bio: therapist.bio || '',
      languages: therapist.languages || [],
      education: therapist.education || '',
      certifications: therapist.certifications || [],
      is_verified: therapist.user?.is_verified || false,
      is_active: therapist.user?.is_active || false,
      // Add some mock data for filtering
      gender: 'Female', // You can add this to the therapists table
      age: '30s',
      maritalStatus: 'Single'
    })) || []

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
