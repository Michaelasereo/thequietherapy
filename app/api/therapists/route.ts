import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

export interface TherapistProfile {
  id: string
  full_name: string
  email: string
  specializations: string[]
  bio: string
  experience_years: number
  education: string
  languages: string[]
  session_rate: number
  availability_status: 'available' | 'busy' | 'offline'
  rating: number
  total_sessions: number
  profile_image_url?: string
  verification_status: 'verified' | 'pending' | 'rejected'
  created_at: string
  updated_at: string
}

export interface TherapistSearchParams {
  search?: string
  specialization?: string
  language?: string
  min_rating?: number
  max_rate?: number
  availability?: string
  page?: number
  limit?: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters: TherapistSearchParams = {
      search: searchParams.get('search') || undefined,
      specialization: searchParams.get('specialization') || undefined,
      language: searchParams.get('language') || undefined,
      min_rating: searchParams.get('min_rating') ? Number(searchParams.get('min_rating')) : undefined,
      max_rate: searchParams.get('max_rate') ? Number(searchParams.get('max_rate')) : undefined,
      availability: searchParams.get('availability') || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20
    }

    console.log('🔍 Searching therapists with filters:', filters)

    // Try to fetch from database first, fallback to mock data
    let therapists: TherapistProfile[] = []
    let totalCount = 0

    try {
      // Query therapist_enrollments (the source of truth for therapist data)
      let query = supabase
        .from('therapist_enrollments')
        .select(`
          id,
          full_name,
          email,
          bio,
          profile_image_url,
          specializations,
          specialization,
          languages_array,
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
        .eq('status', 'approved') // Only show approved therapists
        .eq('is_active', true) // Only show active therapists

      // Apply search filter
      if (filters.search) {
        query = query.ilike('full_name', `%${filters.search}%`)
      }

      // Apply pagination
      const offset = (filters.page! - 1) * filters.limit!
      query = query.range(offset, offset + filters.limit! - 1)
      query = query.order('created_at', { ascending: false })

      const { data: enrollmentsData, error: enrollmentError } = await query

      if (enrollmentError) {
        throw enrollmentError
      }

      console.log('🔍 Found therapist enrollments:', enrollmentsData?.length || 0)

      // For each enrollment, get the corresponding user data
      const therapistsWithUsers = await Promise.all(
        (enrollmentsData || []).map(async (enrollment) => {
          const { data: userData } = await supabase
            .from('users')
            .select('id, is_verified, is_active')
            .eq('email', enrollment.email)
            .eq('user_type', 'therapist')
            .single()

          return { enrollment, user: userData }
        })
      )

      // Transform data with real enrollment data
      therapists = therapistsWithUsers
        .filter(({ user }) => user && user.is_verified && user.is_active) // Only show verified and active users
        .map(({ enrollment, user }) => {
          // ✅ FIX: Parse specializations (plural) from enrollment data
          // Use specializations array field (preferred) or fallback to specialization (singular) for backward compatibility
          const specializations = Array.isArray(enrollment.specializations) && enrollment.specializations.length > 0
            ? enrollment.specializations 
            : (enrollment.specializations && typeof enrollment.specializations === 'string'
              ? [enrollment.specializations] 
              : (Array.isArray(enrollment.specialization) && enrollment.specialization.length > 0
                ? enrollment.specialization
                : (enrollment.specialization && typeof enrollment.specialization === 'string'
                  ? [enrollment.specialization]
                  : [])))
          
          // ✅ FIX: Use languages_array (preferred) or fallback to languages
          const languages = Array.isArray(enrollment.languages_array)
            ? enrollment.languages_array
            : (Array.isArray(enrollment.languages)
              ? enrollment.languages
              : (typeof enrollment.languages === 'string'
                ? JSON.parse(enrollment.languages)
                : ['English']))

          return {
            id: user!.id, // Use user ID, not enrollment ID (already filtered null above)
            full_name: enrollment.full_name || 'Unknown Therapist',
            email: enrollment.email,
            specializations,
            bio: enrollment.bio || 'Professional therapist ready to help you.',
            experience_years: 0, // Could be calculated later
            education: enrollment.licensed_qualification || 'Professional qualification',
            languages,
            session_rate: enrollment.hourly_rate || 5000,
            availability_status: (user!.is_active && enrollment.is_active) ? 'available' : 'offline',
            rating: 4.8, // Default rating - could be calculated from reviews later
            total_sessions: 0, // Could be calculated from sessions table later
            profile_image_url: enrollment.profile_image_url,
            verification_status: enrollment.status === 'approved' ? 'verified' : 'pending',
            gender: enrollment.gender || 'Not specified',
            age: enrollment.age || 'Not specified',
            maritalStatus: enrollment.marital_status || 'Not specified',
            created_at: enrollment.created_at,
            updated_at: enrollment.updated_at
          }
        })

      totalCount = therapists.length

    } catch (dbError) {
      console.warn('Database query failed:', dbError)
      // No fallback mock data - return empty results
      therapists = []
      totalCount = 0
    }

    console.log('✅ Returning therapists:', therapists.length, 'total:', totalCount)

    return NextResponse.json({
      success: true,
      therapists,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / filters.limit!)
      },
      filters: filters,
      data_source: therapists.length > 0 ? 'therapist_enrollments' : 'no_data'
    })

  } catch (error) {
    console.error('💥 Error fetching therapists:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? (error as Error).message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST endpoint for creating therapist profiles
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Only admins can create therapist profiles via API
    // Therapists should use the enrollment flow
    const { requireApiAuth } = await import('@/lib/server-auth')
    const authResult = await requireApiAuth(['admin'])
    if ('error' in authResult) {
      return authResult.error
    }

    const body = await request.json()
    const { 
      user_id,
      specializations,
      bio,
      experience_years,
      education,
      languages,
      session_rate,
      profile_image_url
    } = body

    // Validate required fields
    if (!user_id || !specializations || !bio || !experience_years) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, specializations, bio, experience_years' },
        { status: 400 }
      )
    }

    // Create therapist profile
    const { data, error } = await supabase
      .from('therapist_profiles')
      .insert({
        user_id,
        specializations,
        bio,
        experience_years,
        education: education || '',
        languages: languages || ['English'],
        session_rate: session_rate || 5000,
        profile_image_url,
        availability_status: 'offline',
        verification_status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create therapist profile', details: (error as Error).message },
        { status: 500 }
      )
    }

    console.log('✅ Created therapist profile:', data.user_id)

    return NextResponse.json({
      success: true,
      profile: data,
      message: 'Therapist profile created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('💥 Error creating therapist profile:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? (error as Error).message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}