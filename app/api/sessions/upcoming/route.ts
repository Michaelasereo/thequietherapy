import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/server-auth'
import { handleApiError, successResponse } from '@/lib/api-response'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // SECURE Authentication Check - verify server-side session
    const authResult = await requireApiAuth(['individual'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { session } = authResult
    const userId = session.user.id // This is now TRUSTED and verified
    const userEmail = session.user.email

    console.log('🔍 Fetching upcoming session for user:', userId)

    // Query for upcoming sessions with proper therapist information
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
        title,
        description,
        therapists:therapist_id (
          id,
          full_name,
          email
        ),
        users:user_id (
          id,
          full_name,
          email
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'scheduled')
      .gte('scheduled_date', new Date().toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true })
      .limit(1)

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to fetch upcoming sessions')
    }

    const sessionData = sessions?.[0]
    
    if (sessionData) {
      // Format the session data with proper therapist information
      const formattedSession = {
        id: sessionData.id,
        therapist_name: (sessionData.therapists as any)?.full_name || 'Unknown Therapist',
        therapist_email: (sessionData.therapists as any)?.email || '',
        patient_name: (sessionData.users as any)?.full_name || 'Unknown Patient',
        patient_email: (sessionData.users as any)?.email || '',
        start_time: `${sessionData.scheduled_date}T${sessionData.scheduled_time}`,
        duration: sessionData.duration_minutes || 30,
        room_url: sessionData.daily_room_url,
        room_name: sessionData.daily_room_name,
        status: sessionData.status,
        title: sessionData.title,
        description: sessionData.description
      }

      console.log('✅ Found upcoming session:', formattedSession)
      return successResponse({ session: formattedSession })
    }

    console.log('📅 No upcoming sessions found')
    return successResponse({ session: null })

  } catch (error) {
    return handleApiError(error)
  }
}
