import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ServerSessionManager } from '@/lib/server-session-manager'
import { handleApiError, successResponse } from '@/lib/api-response'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Dashboard-data API called')
    // SECURE Authentication - only therapists can access this endpoint
    const session = await ServerSessionManager.getSession()
    console.log('🔍 DEBUG: Session data:', session)
    if (!session) {
      console.log('🔍 DEBUG: No session found')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (session.role !== 'therapist') {
      console.log('🔍 DEBUG: Access denied, role:', session.role)
      return NextResponse.json({ error: 'Access denied. Therapist role required' }, { status: 403 })
    }

    // Use therapist ID from verified session, NOT from query params
    const therapistId = session.id
    console.log('🔍 DEBUG: Therapist ID:', therapistId)
    console.log('🔍 DEBUG: Session role:', session.role)
    console.log('🔍 DEBUG: Session user type:', session.user_type)

    // Get therapist data
    console.log('🔍 DEBUG: Querying therapist with ID:', therapistId)
    const { data: therapistData, error: therapistError } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        email,
        is_verified,
        user_type
      `)
      .eq('id', therapistId)
      .eq('user_type', 'therapist')
      .single()

    if (therapistError) {
      console.error('🔍 DEBUG: Therapist query error:', therapistError)
      // Return empty data instead of throwing - graceful degradation
      return NextResponse.json({
        success: true,
        data: {
          therapist: null,
          sessions: [],
          clients: 0
        },
        message: 'Unable to load therapist data'
      })
    }

    // Get therapist sessions separately
    const { data: rawSessions, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        id,
        status,
        user_id,
        scheduled_date,
        scheduled_time,
        end_time,
        created_at,
        title,
        description,
        duration_minutes,
        soap_notes,
        ai_notes_generated,
        ai_notes_generated_at,
        recording_url
      `)
      .eq('therapist_id', therapistId)
      .order('scheduled_date', { ascending: false })
      .order('scheduled_time', { ascending: false })

    if (sessionsError) {
      console.error('🔍 DEBUG: Sessions query error:', sessionsError)
      console.error('🔍 DEBUG: Sessions query error details:', JSON.stringify(sessionsError, null, 2))
      // Continue with empty sessions instead of failing completely
      console.log('⚠️ Continuing with empty sessions due to query error')
    }

    // Get user details for each session
    const sessionUserIds = [...new Set(rawSessions?.map(s => s.user_id) || [])]
    const { data: sessionUsers, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', sessionUserIds)

    if (usersError) {
      console.error('🔍 DEBUG: Users query error:', usersError)
      console.error('🔍 DEBUG: Users query error details:', JSON.stringify(usersError, null, 2))
      throw usersError
    }

    // Create a map of user data
    const userMap = new Map(sessionUsers?.map(user => [user.id, user]) || [])

    const therapist = therapistData
    
    console.log('🔍 DEBUG: Raw sessions found:', rawSessions?.length || 0)
    console.log('🔍 DEBUG: Raw sessions data:', rawSessions)

    // Transform sessions to match frontend expectations
    const sessions = rawSessions?.map(session => {
      // Convert scheduled_date and scheduled_time to start_time and end_time
      const startDateTime = new Date(`${session.scheduled_date}T${session.scheduled_time}`)
      const endDateTime = session.end_time ? new Date(session.end_time) : new Date(startDateTime.getTime() + 30 * 60000) // Default 30 minutes
      
      // Get user data from the map
      const user = userMap.get(session.user_id)
      
      return {
        ...session,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        duration: 30, // Default duration
        users: user ? {
          full_name: user.full_name,
          email: user.email
        } : null
      }
    }) || []

    // Calculate stats in JavaScript (more efficient than separate queries)
    const totalSessions = sessions.length
    const completedSessions = sessions.filter(s => s.status === 'completed').length
    const upcomingSessions = sessions.filter(s => s.status === 'scheduled').length
    const uniqueClients = new Set(sessions.map(s => s.user_id)).size

    // Calculate earnings (₦5,000 per session)
    const earningsThisMonth = completedSessions * 5000

    return successResponse({
      therapist: {
        id: therapist.id,
        name: therapist.full_name,
        email: therapist.email,
        isVerified: therapist.is_verified,
        isApproved: true, // Default to true for now
        specialization: [], // Default empty array
        licenseNumber: '',
        hourlyRate: 5000,
        totalClients: uniqueClients,
        totalSessions,
        completedSessions,
        upcomingSessions,
        earningsThisMonth
      },
      sessions: sessions || [],
      clients: uniqueClients
    })
  } catch (error) {
    console.error('🔍 DEBUG: Therapist dashboard API error:', error)
    console.error('🔍 DEBUG: Error type:', typeof error)
    console.error('🔍 DEBUG: Error details:', JSON.stringify(error, null, 2))
    return handleApiError(error)
  }
}
