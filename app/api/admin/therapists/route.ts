import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireApiAuth } from '@/lib/server-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireApiAuth(['admin'])
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: 401 })
    }

    // Add cache control headers to prevent stale data
    console.log('🔍 Fetching therapists with fresh data...')
    
    // Fetch therapists from users table
    const { data: therapistUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('user_type', 'therapist')
      .order('created_at', { ascending: false })

    if (usersError) throw usersError

    // Fetch therapist enrollment data
    const { data: therapistEnrollments, error: enrollmentsError } = await supabase
      .from('therapist_enrollments')
      .select('*')

    if (enrollmentsError) throw enrollmentsError

    // Create a map of therapist enrollments by email
    const enrollmentMap = new Map()
    therapistEnrollments?.forEach(enrollment => {
      enrollmentMap.set(enrollment.email, enrollment)
    })

    // Create a map of therapist users by email
    const userMap = new Map()
    therapistUsers?.forEach(user => {
      userMap.set(user.email, user)
    })

    // Transform the data to match the expected interface
    const transformedTherapists = (therapistUsers || []).map(user => {
      const enrollment = enrollmentMap.get(user.email)
      return {
        id: user.id,
        full_name: user.full_name || 'Unknown Therapist',
        email: user.email,
        phone: enrollment?.phone || null,
        mdcn_code: enrollment?.mdcn_code || 'N/A',
        specialization: Array.isArray(enrollment?.specialization) ? enrollment?.specialization : [],
        languages: Array.isArray(enrollment?.languages) ? enrollment?.languages : [],
        is_verified: user.is_verified || false,
        is_active: user.is_active || false,
        status: enrollment?.status || 'pending',
        rating: 0, // Will be calculated from sessions/ratings
        totalSessions: 0, // Will be calculated from sessions
        created_at: user.created_at,
        lastActivity: user.last_login_at || user.updated_at
      }
    }) || []

    // Add pending enrollments that don't have a user account yet
    const pendingEnrollmentsWithoutUsers = therapistEnrollments?.filter(enrollment => {
      return enrollment.status === 'pending' && !userMap.has(enrollment.email)
    }) || []

    const pendingTherapists = pendingEnrollmentsWithoutUsers.map(enrollment => ({
      id: enrollment.id, // Use enrollment ID for pending therapists
      full_name: enrollment.full_name || 'Unknown Therapist',
      email: enrollment.email,
      phone: enrollment.phone || null,
      mdcn_code: enrollment.mdcn_code || 'N/A',
      specialization: Array.isArray(enrollment.specialization) ? enrollment.specialization : [],
      languages: Array.isArray(enrollment.languages) ? enrollment.languages : [],
      is_verified: false,
      is_active: false,
      status: enrollment.status || 'pending',
      rating: 0,
      totalSessions: 0,
      created_at: enrollment.created_at,
      lastActivity: enrollment.created_at
    }))

    // Combine regular therapists with pending ones
    const allTherapists = [...transformedTherapists, ...pendingTherapists]

    console.log(`✅ Fetched ${allTherapists.length} therapists (${transformedTherapists.length} approved, ${pendingTherapists.length} pending)`)

    return NextResponse.json(allTherapists, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error: any) {
    console.error('Error fetching therapists:', error)
    const message = error?.message || 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
