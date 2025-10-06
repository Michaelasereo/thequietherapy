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
      // Query users table with therapist_profiles join to get real profile data
      const { data: therapistData, error } = await supabase
        .from('users')
        .select(`
          id, 
          full_name, 
          email, 
          created_at, 
          updated_at,
          therapist_profiles (
            bio,
            profile_image_url,
            specialization,
            languages,
            experience_years,
            education,
            hourly_rate,
            verification_status,
            is_verified,
            phone,
            mdcn_code
          )
        `)
        .eq('id', id)
        .eq('user_type', 'therapist')
        .single()

      if (error) {
        throw error
      }

      if (therapistData) {
        const profile = therapistData.therapist_profiles || {}
        
        // Transform data with real profile data
        therapist = {
          id: therapistData.id,
          full_name: therapistData.full_name || 'Unknown Therapist',
          email: therapistData.email,
          specializations: profile?.[0]?.specialization ? [profile?.[0]?.specialization] : ['General Therapy'],
          bio: profile?.[0]?.bio || 'Professional therapist ready to help you.',
          experience_years: profile?.[0]?.experience_years || 0,
          education: profile?.[0]?.education || 'Professional qualification',
          languages: profile?.[0]?.languages ? (typeof profile?.[0]?.languages === 'string' ? JSON.parse(profile?.[0]?.languages) : [profile?.[0]?.languages]) : ['English'],
          session_rate: profile?.[0]?.hourly_rate || 5000,
          availability_status: 'available' as const,
          rating: 4.5, // Default rating - could be calculated from reviews later
          total_sessions: 0, // Could be calculated from sessions table later
          profile_image_url: profile?.[0]?.profile_image_url,
          verification_status: profile?.[0]?.verification_status || 'pending',
          gender: 'Not specified', // Not in current schema - could be added later
          age: 'Not specified', // Not in current schema - could be added later
          maritalStatus: 'Not specified', // Not in current schema - could be added later
          created_at: therapistData.created_at,
          updated_at: therapistData.updated_at
        }
      }

    } catch (dbError) {
      console.warn('Database query failed, using mock data:', dbError)
    }

    // If not found in database, try to get from therapist_profiles table
    if (!therapist) {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('therapist_profiles')
          .select(`
            *,
            users!therapist_profiles_user_id_fkey(id, full_name, email, created_at, updated_at)
          `)
          .eq('user_id', id)
          .single()

        if (!profileError && profileData && profileData.users) {
          therapist = {
            id: profileData.users.id,
            full_name: profileData.users.full_name || 'Unknown Therapist',
            email: profileData.users.email,
            specializations: Array.isArray(profileData.specializations) 
              ? profileData.specializations[0] || 'General Therapy'
              : profileData.specializations || 'General Therapy',
            bio: profileData.bio || 'Professional therapist',
            experience_years: profileData.experience_years || 0,
            education: profileData.education || 'Professional qualification',
            languages: profileData.languages || ['English'],
            session_rate: profileData.session_rate || 5000,
            availability_status: profileData.availability_status || 'offline',
            rating: profileData.rating || 0,
            total_sessions: profileData.total_sessions || 0,
            profile_image_url: profileData.profile_image_url,
            verification_status: profileData.verification_status || 'pending',
            gender: profileData.gender || 'Not specified',
            age: profileData.age || 'Not specified',
            maritalStatus: profileData.marital_status || 'Not specified',
            created_at: profileData.users.created_at,
            updated_at: profileData.users.updated_at
          }
        }
      } catch (profileError) {
        console.warn('Error fetching from therapist_profiles:', profileError)
      }
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