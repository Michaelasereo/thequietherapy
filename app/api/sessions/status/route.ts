import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireApiAuth } from '@/lib/server-auth'
import { handleApiError, ValidationError, NotFoundError, successResponse, validateRequired } from '@/lib/api-response'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const authResult = await requireApiAuth(['individual', 'therapist'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { session } = authResult
    const userId = session.user.id
    const userType = session.user.user_type

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      throw new ValidationError('Session ID is required')
    }

    // Get session details with participant info
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        user:user_id (
          id,
          full_name,
          email
        ),
        therapist:therapist_id (
          id,
          full_name,
          email
        )
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError || !sessionData) {
      throw new NotFoundError('Session not found')
    }

    // Check if user has access to this session
    const hasAccess = userType === 'admin' || 
                     sessionData.user_id === userId || 
                     sessionData.therapist_id === userId

    if (!hasAccess) {
      throw new ValidationError('Access denied to this session')
    }

    // Get real-time room stats if session is active
    let roomStats = null
    if (sessionData.daily_room_name && sessionData.status === 'in_progress') {
      try {
        // const { getDailyRoomStats } = await import('@/lib/daily')
        // roomStats = await getDailyRoomStats(sessionData.daily_room_name)
        roomStats = { participants: 0, isActive: true }
      } catch (error) {
        console.warn('Failed to get room stats:', error)
      }
    }

    // Calculate session timing
    const now = new Date()
    const startTime = new Date(`${sessionData.scheduled_date}T${sessionData.scheduled_time}`)
    const endTime = new Date(startTime.getTime() + (sessionData.planned_duration_minutes || 30) * 60000)
    const isActive = now >= startTime && now <= endTime && sessionData.status === 'in_progress'
    const canJoin = now >= new Date(startTime.getTime() - 30 * 60 * 1000) // 30 minutes before
    const timeUntilStart = Math.max(0, startTime.getTime() - now.getTime())
    const timeRemaining = Math.max(0, endTime.getTime() - now.getTime())

    return successResponse({
      session: {
        id: sessionData.id,
        status: sessionData.status,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration: sessionData.planned_duration_minutes || 30,
        session_url: sessionData.daily_room_url,
        room_name: sessionData.daily_room_name,
        notes: sessionData.notes,
        soap_notes: sessionData.soap_notes,
        recording_url: sessionData.recording_url,
        created_at: sessionData.created_at,
        updated_at: sessionData.updated_at,
        completed_at: sessionData.completed_at
      },
      participants: {
        user: sessionData.user,
        therapist: sessionData.therapist
      },
      timing: {
        is_active: isActive,
        can_join: canJoin,
        time_until_start_ms: timeUntilStart,
        time_remaining_ms: timeRemaining,
        is_past: now > endTime
      },
      room_stats: roomStats
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authResult = await requireApiAuth(['individual', 'therapist'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { session } = authResult
    const userId = session.user.id
    const userType = session.user.user_type

    const { session_id, action, data } = await request.json()
    validateRequired({ session_id, action }, ['session_id', 'action'])

    // Get session details
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', session_id)
      .single()

    if (sessionError || !sessionData) {
      throw new NotFoundError('Session not found')
    }

    // Check if user has access to this session
    const hasAccess = userType === 'admin' || 
                     sessionData.user_id === userId || 
                     sessionData.therapist_id === userId

    if (!hasAccess) {
      throw new ValidationError('Access denied to this session')
    }

    let updateData: any = {
      updated_at: new Date().toISOString()
    }

    switch (action) {
      case 'start':
        if (sessionData.status !== 'scheduled') {
          throw new ValidationError('Session is not in scheduled status')
        }
        updateData.status = 'in_progress'
        updateData.started_at = new Date().toISOString()
        break

      case 'end':
        if (sessionData.status !== 'in_progress') {
          throw new ValidationError('Session is not in progress')
        }
        updateData.status = 'completed'
        updateData.completed_at = new Date().toISOString()
        if (data?.notes) {
          updateData.notes = data.notes
        }
        if (data?.recording_url) {
          updateData.recording_url = data.recording_url
        }
        break

      case 'cancel':
        if (sessionData.status === 'completed') {
          throw new ValidationError('Cannot cancel completed session')
        }
        updateData.status = 'cancelled'
        updateData.cancelled_at = new Date().toISOString()
        if (data?.reason) {
          updateData.notes = `Cancelled: ${data.reason}`
        }
        break

      case 'update_notes':
        if (data?.notes) {
          updateData.notes = data.notes
        }
        break

      default:
        throw new ValidationError('Invalid action')
    }

    // Update session
    const { error: updateError } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', session_id)

    if (updateError) {
      throw new Error('Failed to update session')
    }

    console.log(`✅ Session ${action} successful:`, session_id)

    return successResponse({
      success: true,
      action,
      message: `Session ${action} successful`
    })

  } catch (error) {
    return handleApiError(error)
  }
}
