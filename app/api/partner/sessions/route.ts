import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get the current partner from session/cookie
    // For now, we'll get all sessions and filter by partner
    // In a real implementation, you'd get the partner ID from the session
    
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        id,
        scheduled_date,
        scheduled_time,
        status,
        credits_used,
        session_type,
        notes,
        users!sessions_user_id_fkey (
          id,
          full_name,
          email
        ),
        therapist_profiles!sessions_therapist_id_fkey (
          id,
          full_name,
          specialization
        )
      `)
      .order('scheduled_date', { ascending: false })

    if (error) {
      console.error('Error fetching sessions:', error)
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    // Transform the data to match the expected interface
    const transformedSessions = sessions?.map(session => ({
      id: session.id,
      memberName: session.users?.[0]?.full_name || 'Unknown Member',
      memberEmail: session.users?.[0]?.email || 'unknown@example.com',
      therapistName: session.therapist_profiles?.[0]?.full_name || 'Unknown Therapist',
      scheduledDate: session.scheduled_date,
      scheduledTime: session.scheduled_time,
      status: session.status || 'scheduled',
      creditsUsed: session.credits_used || 0,
      sessionType: session.session_type || 'Individual Therapy',
      notes: session.notes
    })) || []

    return NextResponse.json(transformedSessions)

  } catch (error) {
    console.error('Error in partner sessions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
