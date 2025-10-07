import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { ServerSessionManager } from '@/lib/server-session-manager'
import { handleApiError, successResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    // SECURE Authentication Check - only therapists can access their profile
    const session = await ServerSessionManager.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (session.role !== 'therapist') {
      return NextResponse.json({ error: 'Access denied. Therapist role required' }, { status: 403 })
    }

    const therapistUserId = session.id // This is now TRUSTED and verified
    const email = session.email

    console.log('🔍 Therapist profile API: Looking for therapist with email:', email)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get therapist profile data from the correct table
    const { data: profile, error: profileError } = await supabase
      .from('therapist_profiles')
      .select('*')
      .eq('user_id', therapistUserId)
      .single()

    console.log('🔍 Profile data:', profile)
    console.log('🔍 Profile error:', profileError)

    // If no profile found, try to get data from therapist_enrollments table
    let enrollmentData = null
    if (profileError || !profile) {
      console.log('🔍 No profile found, checking therapist_enrollments table...')
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('therapist_enrollments')
        .select('*')
        .eq('user_id', therapistUserId)
        .single()
      
      console.log('🔍 Enrollment data:', enrollment)
      console.log('🔍 Enrollment error:', enrollmentError)
      
      if (enrollment && !enrollmentError) {
        enrollmentData = enrollment
      }
    }

    // Get user account data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    console.log('🔍 User data:', user)
    console.log('🔍 User error:', userError)

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: "User account not found"
      }, { status: 404 })
    }

    // If no profile or enrollment data found, return basic user data
    if (!profile && !enrollmentData) {
      console.log('⚠️ No profile or enrollment data found, returning basic user data')
      
      const basicTherapistData = {
        id: user.id,
        email: user.email,
        full_name: user.full_name || user.name || 'Unknown',
        specialization: [],
        license_number: '',
        is_verified: user.is_verified,
        is_active: user.is_active,
        availability_approved: false, // No enrollment data means not approved
        rating: 4.8,
        total_sessions: 0,
        total_clients: 0,
        hourly_rate: 5000,
        availability: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false
        },
        phone: '',
        languages: ["English"],
        bio: '',
        status: 'pending',
        experience_years: 0,
        gender: '',
        maritalStatus: '',
        age: '',
        created_at: user.created_at,
        updated_at: user.updated_at
      }

      return successResponse({
        therapist: basicTherapistData
      })
    }

    // Use profile data if available, otherwise fall back to enrollment data
    const dataSource = profile || enrollmentData
    
    console.log('🔍 Data source being used:', dataSource)
    console.log('🔍 Enrollment data for approval status:', enrollmentData)
    console.log('🔍 Specialization raw data:', dataSource?.specialization)
    console.log('🔍 Languages raw data:', dataSource?.languages)
    
    // Parse specialization data
    let parsedSpecialization = []
    if (dataSource?.specialization) {
      if (typeof dataSource.specialization === 'string') {
        parsedSpecialization = dataSource.specialization.split(', ').filter(Boolean)
      } else if (Array.isArray(dataSource.specialization)) {
        parsedSpecialization = dataSource.specialization
      }
    }
    console.log('🔍 Parsed specialization:', parsedSpecialization)
    
    // Parse languages data
    let parsedLanguages = ["English"] // Default fallback
    if (dataSource?.languages) {
      try {
        if (typeof dataSource.languages === 'string') {
          parsedLanguages = JSON.parse(dataSource.languages)
        } else if (Array.isArray(dataSource.languages)) {
          parsedLanguages = dataSource.languages
        }
      } catch (error) {
        console.error('🔍 Error parsing languages JSON:', error)
        parsedLanguages = ["English"]
      }
    }
    console.log('🔍 Parsed languages:', parsedLanguages)
    
    // Combine profile and user data
    const therapistData = {
      id: user.id,
      email: user.email,
      full_name: user.full_name || user.name,
      specialization: parsedSpecialization,
      license_number: dataSource?.mdcn_code || '',
      is_verified: user.is_verified,
      is_active: user.is_active,
      availability_approved: user.is_verified && user.is_active, // Use user verification status for availability approval
      rating: 4.8, // Default rating
      total_sessions: 0, // Will be calculated from sessions table
      total_clients: 0, // Will be calculated from clients table
      hourly_rate: dataSource?.hourly_rate || 5000,
      availability: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false
      },
      phone: dataSource?.phone || '',
      languages: parsedLanguages,
      bio: dataSource?.bio || '',
      status: dataSource?.verification_status || 'pending',
      experience_years: dataSource?.experience_years || 0,
      profile_image: dataSource?.profile_image_url || null,
      gender: dataSource?.gender || '',
      maritalStatus: dataSource?.marital_status || '',
      age: dataSource?.age || '',
      created_at: dataSource?.created_at || new Date().toISOString(),
      updated_at: dataSource?.updated_at || new Date().toISOString()
    }

    console.log('🔍 Returning therapist data:', therapistData)

    return successResponse({
      therapist: therapistData
    })

  } catch (error) {
    return handleApiError(error)
  }
}
