import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/server-auth'
import { handleApiError, successResponse } from '@/lib/api-response'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // SECURE Authentication Check - only therapists can access their sessions
    const authResult = await requireApiAuth(['therapist'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { session } = authResult
    const therapistId = session.user.id // This is now TRUSTED and verified

    console.log('🔍 Fetching today\'s sessions for therapist:', therapistId)

    // Get today's date
    const today = new Date().toISOString().split('T')[0]

    // Query for today's sessions
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        id,
        scheduled_date,
        scheduled_time,
        duration_minutes,
        status,
        daily_room_name,
        daily_room_url,
        therapist_id,
        user_id,
        users (
          full_name,
          email
        )
      `)
      .eq('therapist_id', therapistId)
      .eq('scheduled_date', today)
      .order('scheduled_time', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Format the session data
    const formattedSessions = sessions?.map(session => ({
      id: session.id,
      patient_name: session.users?.[0]?.full_name || 'Unknown Patient',
      patient_email: session.users?.[0]?.email || '',
      start_time: `${session.scheduled_date}T${session.scheduled_time}`,
      duration: session.duration_minutes || 50,
      room_url: session.daily_room_url,
      room_name: session.daily_room_name,
      status: session.status
    })) || []

    console.log('✅ Found today\'s sessions:', formattedSessions.length, 'sessions')
    return successResponse({ sessions: formattedSessions })

  } catch (error) {
    return handleApiError(error)
  }
}
