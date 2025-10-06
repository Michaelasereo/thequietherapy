import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/server-auth'
import { handleApiError, successResponse } from '@/lib/api-response'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // SECURE Authentication Check - only users can access their session history
    const authResult = await requireApiAuth(['individual'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { session } = authResult
    const userId = session.user.id // This is now TRUSTED and verified

    // Get limit from query params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    console.log('🔍 Fetching session history for user:', userId, 'limit:', limit)

    // Query for past sessions
    const supabase = createServerClient();
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
        therapists (
          full_name,
          email
        )
      `)
      .eq('user_id', userId)
      .in('status', ['completed', 'cancelled'])
      .order('scheduled_date', { ascending: false })
      .order('scheduled_time', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Format the session data
    const formattedSessions = sessions?.map(session => ({
      id: session.id,
      therapist_name: (session.therapists as any)?.full_name || 'Unknown Therapist',
      therapist_email: (session.therapists as any)?.email || '',
      start_time: `${session.scheduled_date}T${session.scheduled_time}`,
      duration: session.duration_minutes || 50,
      room_url: session.daily_room_url,
      room_name: session.daily_room_name,
      status: session.status
    })) || []

    console.log('✅ Found session history:', formattedSessions.length, 'sessions')
    return successResponse({ sessions: formattedSessions })

  } catch (error) {
    return handleApiError(error)
  }
}
