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

    console.log('🔍 Therapist profile API: Session data:', { 
      id: therapistUserId, 
      email: email, 
      role: session.role 
    })
    console.log('🔍 Therapist profile API: Looking for therapist with email:', email)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ✅ ALWAYS fetch from therapist_enrollments first (source of truth for profile_image_url)
    let enrollmentData = null
    console.log('🔍 Fetching enrollment data from therapist_enrollments...')
    
    // First try to find by user_id
    let { data: enrollment, error: enrollmentError } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .eq('user_id', therapistUserId)
      .single()
    
    console.log('🔍 Enrollment data by user_id:', enrollment)
    console.log('🔍 Enrollment error by user_id:', enrollmentError)
    
    // If user_id lookup fails, try by email
    if (enrollmentError || !enrollment) {
      console.log('🔍 user_id lookup failed, trying email lookup...')
      const { data: enrollmentByEmail, error: enrollmentByEmailError } = await supabase
        .from('therapist_enrollments')
        .select('*')
        .eq('email', email)
        .single()
      
      console.log('🔍 Enrollment data by email:', enrollmentByEmail)
      console.log('🔍 Enrollment error by email:', enrollmentByEmailError)
      
      if (enrollmentByEmail && !enrollmentByEmailError) {
        enrollment = enrollmentByEmail
        enrollmentError = enrollmentByEmailError
      }
    }
    
    if (enrollment && !enrollmentError) {
      enrollmentData = enrollment
    }

    // Get therapist profile data from therapist_profiles table (for additional fields)
    const { data: profile, error: profileError } = await supabase
      .from('therapist_profiles')
      .select('*')
      .eq('user_id', therapistUserId)
      .single()

    console.log('🔍 Profile data:', profile)
    console.log('🔍 Profile error:', profileError)

    // Get user account data
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    console.log('🔍 User data by email:', user)
    console.log('🔍 User error by email:', userError)

    // If email lookup fails, try by ID
    if (userError || !user) {
      console.log('🔍 Email lookup failed, trying ID lookup...')
      const { data: userById, error: userByIdError } = await supabase
        .from('users')
        .select('*')
        .eq('id', therapistUserId)
        .single()
      
      console.log('🔍 User data by ID:', userById)
      console.log('🔍 User error by ID:', userByIdError)
      
      if (userById && !userByIdError) {
        user = userById
        userError = userByIdError
      }
    }

    if (userError || !user) {
      console.error('❌ User account not found:', {
        email: email,
        therapistUserId: therapistUserId,
        userError: userError
      })
      return NextResponse.json({
        success: false,
        error: "User account not found",
        debug: {
          email: email,
          therapistUserId: therapistUserId,
          userError: userError?.message
        }
      }, { status: 404 })
    }

    // If no profile or enrollment data found, return basic user data
    if (!profile && !enrollmentData) {
      console.log('⚠️ No profile or enrollment data found, returning basic user data')
      console.log('🔍 Debug info:', {
        profile: profile,
        enrollmentData: enrollmentData,
        user: user,
        email: email,
        therapistUserId: therapistUserId
      })
      
      const basicTherapistData = {
        id: user.id,
        email: user.email,
        full_name: user.full_name || user.name || 'Unknown',
        specialization: [],
        license_number: '',
        is_verified: user.is_verified,
        is_active: user.is_active,
        availability_approved: user.is_verified && user.is_active, // Use user verification status
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
    
    // Get profile image from enrollment data (SINGLE SOURCE OF TRUTH)
    // Priority: enrollmentData > users.avatar_url > profile > null
    const profileImageUrl = enrollmentData?.profile_image_url || 
                           user?.avatar_url || 
                           profile?.profile_image_url || 
                           null
    
    console.log('🔍 API: Data source being used:', dataSource)
    console.log('🔍 API: Avatar sync check:', {
      enrollment_avatar: enrollmentData?.profile_image_url,
      user_avatar: user?.avatar_url,
      profile_avatar: profile?.profile_image_url,
      final_avatar: profileImageUrl,
      all_match: enrollmentData?.profile_image_url === user?.avatar_url && 
                 user?.avatar_url === profile?.profile_image_url
    })
    console.log('🔍 API: Enrollment data for approval status:', enrollmentData)
    console.log('🔍 API: Specialization raw data:', enrollmentData?.specializations || enrollmentData?.specialization || dataSource?.specializations || dataSource?.specialization)
    console.log('🔍 API: Languages raw data:', enrollmentData?.languages_array || enrollmentData?.languages || dataSource?.languages_array || dataSource?.languages)
    
    // Parse specialization data - check enrollmentData first, then dataSource
    // Check both specializations (array) and specialization (legacy)
    let parsedSpecialization = []
    const specSource = enrollmentData || dataSource
    if (specSource?.specializations) {
      // Check specializations array first (preferred)
      if (Array.isArray(specSource.specializations)) {
        parsedSpecialization = specSource.specializations.filter(Boolean)
      }
    } else if (specSource?.specialization) {
      // Fall back to specialization field (legacy)
      if (typeof specSource.specialization === 'string') {
        // Try to parse as JSON first
        try {
          parsedSpecialization = JSON.parse(specSource.specialization)
        } catch {
          // If not JSON, split by comma
          parsedSpecialization = specSource.specialization.split(',').map((s: string) => s.trim()).filter(Boolean)
        }
      } else if (Array.isArray(specSource.specialization)) {
        parsedSpecialization = specSource.specialization.filter(Boolean)
      }
    }
    console.log('🔍 Parsed specialization:', parsedSpecialization)
    
    // Parse languages data - check enrollmentData first, then dataSource
    // Check both languages_array (array) and languages (legacy)
    let parsedLanguages = ["English"] // Default fallback
    const langSource = enrollmentData || dataSource
    if (langSource?.languages_array) {
      // Check languages_array first (preferred)
      if (Array.isArray(langSource.languages_array)) {
        parsedLanguages = langSource.languages_array.filter(Boolean)
      }
    } else if (langSource?.languages) {
      // Fall back to languages field (legacy)
      try {
        if (typeof langSource.languages === 'string') {
          // Try to parse as JSON first
          try {
            parsedLanguages = JSON.parse(langSource.languages)
          } catch {
            // If not JSON, split by comma
            parsedLanguages = langSource.languages.split(',').map((l: string) => l.trim()).filter(Boolean)
          }
        } else if (Array.isArray(langSource.languages)) {
          parsedLanguages = langSource.languages.filter(Boolean)
        }
      } catch (error) {
        console.error('🔍 Error parsing languages:', error)
        parsedLanguages = ["English"]
      }
    }
    console.log('🔍 Parsed languages:', parsedLanguages)
    
    // Parse edit tracking data
    const editedFields = enrollmentData?.edited_fields || []
    const originalEnrollmentData = enrollmentData?.original_enrollment_data || null
    const profileUpdatedAt = enrollmentData?.profile_updated_at || null

    console.log('🔍 Edit tracking data:', {
      editedFields,
      hasOriginalData: !!originalEnrollmentData,
      profileUpdatedAt
    })
    
    // Combine profile and user data
    // STANDARDIZED: Only use profile_image_url (no aliases)
    const therapistData = {
      id: user.id,
      email: user.email,
      full_name: user.full_name || user.name,
      specialization: parsedSpecialization,
      license_number: dataSource?.licensed_qualification || dataSource?.mdcn_code || '',
      is_verified: user.is_verified,
      is_active: user.is_active,
      availability_approved: user.is_verified && user.is_active, // Use user verification status for availability approval
      
      // Debug info for availability approval
      debug_availability: {
        user_verified: user.is_verified,
        user_active: user.is_active,
        enrollment_status: dataSource?.status,
        enrollment_active: dataSource?.is_active,
        calculated_approval: user.is_verified && user.is_active
      },
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
      status: dataSource?.status || dataSource?.verification_status || 'pending',
      experience_years: dataSource?.experience_years || 0,
      profile_image_url: profileImageUrl, // ✅ SINGLE STANDARDIZED FIELD
      gender: enrollmentData?.gender || dataSource?.gender || '',
      maritalStatus: enrollmentData?.marital_status || dataSource?.marital_status || '',
      age: enrollmentData?.age?.toString() || dataSource?.age?.toString() || '',
      created_at: dataSource?.created_at || new Date().toISOString(),
      updated_at: dataSource?.updated_at || new Date().toISOString(),
      // Edit tracking metadata
      edited_fields: editedFields,
      original_enrollment_data: originalEnrollmentData,
      profile_updated_at: profileUpdatedAt,
      enrollment_date: dataSource?.created_at || new Date().toISOString()
    }

    console.log('🔍 Returning therapist data:', therapistData)

    return successResponse({
      therapist: therapistData
    })

  } catch (error) {
    return handleApiError(error)
  }
}
