import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
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

    // Transform the data to match the expected interface
    const transformedTherapists = therapistUsers?.map(user => {
      const enrollment = enrollmentMap.get(user.email)
      return {
        id: user.id,
        full_name: user.full_name || 'Unknown Therapist',
        email: user.email,
        phone: enrollment?.phone || null,
        mdcn_code: enrollment?.mdcn_code || 'N/A',
        specialization: enrollment?.specialization || [],
        languages: enrollment?.languages || [],
        is_verified: user.is_verified || false,
        is_active: user.is_active || false,
        status: enrollment?.status || 'pending',
        rating: 0, // Will be calculated from sessions/ratings
        totalSessions: 0, // Will be calculated from sessions
        created_at: user.created_at,
        lastActivity: user.last_login_at || user.updated_at
      }
    }) || []

    return NextResponse.json(transformedTherapists)
  } catch (error) {
    console.error('Error fetching therapists:', error)
    return NextResponse.json([], { status: 500 })
  }
}
