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
      // Query users table with therapist_profiles join to get real profile data
      let query = supabase
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
        .eq('user_type', 'therapist')

      // Apply search filter
      if (filters.search) {
        query = query.ilike('full_name', `%${filters.search}%`)
      }

      // Apply pagination
      const offset = (filters.page! - 1) * filters.limit!
      query = query.range(offset, offset + filters.limit! - 1)
      query = query.order('created_at', { ascending: false })

      const { data: therapistsData, error } = await query

      if (error) {
        throw error
      }

      // Transform data with real profile data
      therapists = (therapistsData || []).map((therapist) => {
        const profile = therapist.therapist_profiles || {}
        
        return {
          id: therapist.id,
          full_name: therapist.full_name || 'Unknown Therapist',
          email: therapist.email,
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
          created_at: therapist.created_at,
          updated_at: therapist.updated_at
        }
      })

      totalCount = therapists.length

    } catch (dbError) {
      console.warn('Database query failed:', dbError)
      // No fallback mock data - return empty results
      therapists = []
      totalCount = 0
    }

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
      data_source: therapists.length > 0 ? 'database_with_real_profiles' : 'no_data'
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