import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface TherapistDashboardData {
  therapist: {
    id: string
    name: string
    email: string
    isVerified: boolean
    isApproved: boolean
    specialization: string[]
    licenseNumber: string
    hourlyRate: number
    totalClients: number
    totalSessions: number
    completedSessions: number
    upcomingSessions: number
    earningsThisMonth: number
  }
  recentSessions: Array<{
    id: string
    status: string
    start_time: string
    client_name: string
    client_email: string
  }>
  clients: number
}

export interface UserDashboardData {
  user: {
    id: string
    name: string
    email: string
    credits: number
    totalSessions: number
    completedSessions: number
    upcomingSessions: number
  }
  upcomingSession: {
    id: string
    therapist_name: string
    start_time: string
    room_url?: string
  } | null
  recentSessions: Array<{
    id: string
    therapist_name: string
    start_time: string
    status: string
  }>
}

/**
 * OPTIMIZED: Get therapist dashboard data with single query
 * Replaces multiple sequential queries with one joined query
 */
export async function getTherapistDashboardData(therapistId: string): Promise<TherapistDashboardData> {
  const { data: therapistData, error } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
      email,
      is_verified,
      therapist_profiles (
        verification_status,
        specialization,
        specializations,
        mdcn_code
      ),
      therapist_sessions:sessions!therapist_id (
        id,
        status,
        user_id,
        start_time,
        end_time,
        created_at,
        users!sessions_user_id_fkey (
          full_name,
          email
        )
      )
    `)
    .eq('id', therapistId)
    .eq('user_type', 'therapist')
    .single()

  if (error) throw error

  const therapist = therapistData
  const profile = therapistData.therapist_profiles?.[0]
  const sessions = therapistData.therapist_sessions || []

  // Calculate stats in JavaScript (more efficient than separate queries)
  const totalSessions = sessions.length
  const completedSessions = sessions.filter(s => s.status === 'completed').length
  const upcomingSessions = sessions.filter(s => s.status === 'scheduled').length
  const uniqueClients = new Set(sessions.map(s => s.user_id)).size

  // Get recent sessions (last 5)
  const recentSessions = sessions
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map(session => ({
      id: session.id,
      status: session.status,
      start_time: session.start_time || "" || "",
      client_name: session.users?.[0]?.full_name || 'Unknown',
      client_email: session.users?.[0]?.email || ''
    }))

  return {
    therapist: {
      id: therapist.id,
      name: therapist.full_name,
      email: therapist.email,
      isVerified: therapist.is_verified,
      isApproved: profile?.verification_status === 'approved',
      specialization: typeof profile?.specialization === 'string' 
        ? profile?.[0]?.specialization.split(', ').filter(Boolean) 
        : (profile?.specializations || []),
      licenseNumber: profile?.mdcn_code || '',
      hourlyRate: 5000,
      totalClients: uniqueClients,
      totalSessions,
      completedSessions,
      upcomingSessions,
      earningsThisMonth: completedSessions * 5000
    },
    recentSessions,
    clients: uniqueClients
  }
}

/**
 * OPTIMIZED: Get user dashboard data with single query
 */
export async function getUserDashboardData(userId: string): Promise<UserDashboardData> {
  const { data: userData, error } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
      email,
      credits,
      user_sessions:sessions!user_id (
        id,
        status,
        start_time,
        end_time,
        room_url,
        therapist:therapist_id (
          full_name,
          email
        )
      )
    `)
    .eq('id', userId)
    .eq('user_type', 'individual')
    .single()

  if (error) throw error

  const user = userData
  const sessions = userData.user_sessions || []

  // Calculate stats
  const totalSessions = sessions.length
  const completedSessions = sessions.filter(s => s.status === 'completed').length
  const upcomingSessions = sessions.filter(s => s.status === 'scheduled').length

  // Find next upcoming session
  const upcomingSession = sessions
    .filter(s => s.status === 'scheduled' && new Date(s.start_time) > new Date())
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0]

  // Get recent sessions (last 5)
  const recentSessions = sessions
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
    .slice(0, 5)
    .map(session => ({
      id: session.id,
      therapist_name: session.therapist?.[0]?.full_name || 'Unknown',
      start_time: session.start_time || "" || "",
      status: session.status
    }))

  return {
    user: {
      id: user.id,
      name: user.full_name,
      email: user.email,
      credits: user.credits || 0,
      totalSessions,
      completedSessions,
      upcomingSessions
    },
    upcomingSession: upcomingSession ? {
      id: upcomingSession.id,
      therapist_name: upcomingSession.therapist?.full_name || 'Unknown',
      start_time: upcomingSession.start_time,
      room_url: upcomingSession.room_url
    } : null,
    recentSessions
  }
}

/**
 * OPTIMIZED: Get available therapists with their profiles in one query
 */
export async function getAvailableTherapists(limit: number = 10) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
      email,
      therapist_profiles (
        specializations,
        bio,
        session_rate,
        languages,
        experience_years,
        average_rating,
        total_sessions
      )
    `)
    .eq('user_type', 'therapist')
    .eq('is_active', true)
    .eq('is_verified', true)
    .limit(limit)

  if (error) throw error

  return data.map(therapist => ({
    id: therapist.id,
    name: therapist.full_name,
    email: therapist.email,
    specializations: therapist.therapist_profiles?.[0]?.specializations || [],
    bio: therapist.therapist_profiles?.[0]?.bio || '',
    sessionRate: therapist.therapist_profiles?.[0]?.session_rate || 5000,
    languages: therapist.therapist_profiles?.[0]?.languages || [],
    experienceYears: therapist.therapist_profiles?.[0]?.experience_years || 0,
    averageRating: therapist.therapist_profiles?.[0]?.average_rating || 0,
    totalSessions: therapist.therapist_profiles?.[0]?.total_sessions || 0
  }))
}

/**
 * Get therapist availability with existing sessions in one query
 */
export async function getTherapistAvailabilityWithSessions(
  therapistId: string, 
  daysAhead: number = 7
) {
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + daysAhead)

  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
      therapist_availability (
        day_of_week,
        start_time,
        end_time,
        is_available
      ),
      therapist_sessions:sessions!therapist_id (
        start_time,
        end_time,
        status
      )
    `)
    .eq('id', therapistId)
    .eq('user_type', 'therapist')
    .eq('is_active', true)
    .eq('is_verified', true)
    .gte('therapist_sessions.start_time', new Date().toISOString())
    .lte('therapist_sessions.start_time', endDate.toISOString())
    .in('therapist_sessions.status', ['scheduled', 'confirmed', 'in_progress'])
    .single()

  if (error) throw error

  return {
    therapist: {
      id: data.id,
      name: data.full_name
    },
    availability: data.therapist_availability || [],
    existingSessions: data.therapist_sessions || []
  }
}
