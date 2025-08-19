import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const { duration, endTime } = body

    // Update session status to completed
    const { data: session, error } = await supabase
      .from('sessions')
      .update({
        status: 'completed',
        end_time: endTime,
        duration_minutes: Math.floor(duration / 60),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error ending session:', error)
      return NextResponse.json({ error: 'Failed to end session' }, { status: 500 })
    }

    // Send notification to user about session completion
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: session.user_id,
          title: 'Session Completed',
          message: `Your therapy session has been completed. Duration: ${Math.floor(duration / 60)} minutes.`,
          type: 'session_completed',
          data: {
            session_id: id,
            duration: duration
          }
        })
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError)
      // Don't fail the session end if notification fails
    }

    return NextResponse.json({ 
      success: true, 
      session,
      message: 'Session ended successfully'
    })
  } catch (error) {
    console.error('Error in POST session end:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
