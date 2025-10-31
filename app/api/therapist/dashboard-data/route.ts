import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ServerSessionManager } from '@/lib/server-session-manager'
import { handleApiError, successResponse } from '@/lib/api-response'
import type { TherapistSession } from '@/types/sessions'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // SECURE Authentication - only therapists can access this endpoint
    const session = await ServerSessionManager.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (session.role !== 'therapist') {
      return NextResponse.json({ error: 'Access denied. Therapist role required' }, { status: 403 })
    }

    // Use therapist ID from verified session
    const therapistId = session.id

    // Get therapist data
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
      // If therapist not found in users table, check therapist_enrollments (newly enrolled, not approved yet)
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('therapist_enrollments')
        .select('*')
        .eq('email', session.email)
        .single()
      
      if (enrollmentError || !enrollmentData) {
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
      
      // Return enrollment data with pending status
      return NextResponse.json({
        success: true,
        data: {
          therapist: {
            id: enrollmentData.id,
            full_name: enrollmentData.full_name,
            email: enrollmentData.email,
            phone: enrollmentData.phone,
            specialization: enrollmentData.specialization,
            languages: enrollmentData.languages,
            status: enrollmentData.status,
            is_pending: true,
            totalClients: 0,
            totalSessions: 0,
            earningsThisMonth: 0,
            hourlyRate: 5000
          },
          sessions: [],
          clients: 0
        },
        message: 'Enrollment pending admin approval'
      })
    }

    // Get therapist sessions using standardized start_time field
    const { data: rawSessions, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        id,
        status,
        user_id,
        therapist_id,
        start_time,
        end_time,
        created_at,
        title,
        description,
        notes,
        complaints,
        duration_minutes,
        users:user_id (
          id,
          full_name,
          email
        )
      `)
      .eq('therapist_id', therapistId)
      .order('start_time', { ascending: false })
      .limit(100)

    if (sessionsError) {
      console.error('Sessions query error:', sessionsError)
      // Continue with empty sessions instead of failing completely
      return successResponse({
        therapist: {
          id: therapistData.id,
          name: therapistData.full_name,
          email: therapistData.email,
          isVerified: therapistData.is_verified,
          isApproved: true,
          specialization: [],
          licenseNumber: '',
          hourlyRate: 5000,
          totalClients: 0,
          totalSessions: 0,
          completedSessions: 0,
          upcomingSessions: 0,
          earningsThisMonth: 0
        },
        sessions: [],
        clients: 0
      })
    }

    // Transform sessions to match frontend expectations
    const sessions: TherapistSession[] = (rawSessions || []).map(session => {
      // Use start_time as primary source (with fallback for legacy data)
      let startDateTime: Date
      let endDateTime: Date
      
      if (session.start_time) {
        startDateTime = new Date(session.start_time)
      } else {
        // Fallback to created_at if start_time is missing (should not happen after migration)
        startDateTime = new Date(session.created_at)
      }
      
      // Use end_time if available, otherwise calculate from duration
      if (session.end_time) {
        endDateTime = new Date(session.end_time)
      } else {
        const duration = session.duration_minutes || 30
        endDateTime = new Date(startDateTime.getTime() + duration * 60 * 1000)
      }
      
      return {
        id: session.id,
        status: session.status as any,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        duration_minutes: session.duration_minutes || 30,
        title: session.title,
        description: session.description,
        notes: session.notes,
        complaints: session.complaints,
        user_id: session.user_id,
        therapist_id: session.therapist_id,
        created_at: session.created_at,
        updated_at: session.updated_at || session.created_at,
        users: session.users ? {
          id: session.users.id,
          full_name: session.users.full_name,
          email: session.users.email
        } : {
          id: session.user_id,
          full_name: 'Unknown User',
          email: ''
        }
      }
    })

    // Calculate stats
    const totalSessions = sessions.length
    const completedSessions = sessions.filter(s => s.status === 'completed').length
    const upcomingSessions = sessions.filter(s => s.status === 'scheduled').length
    const uniqueClients = new Set(sessions.map(s => s.user_id)).size

    // Calculate earnings (₦5,000 per session)
    const earningsThisMonth = completedSessions * 5000

    const response = successResponse({
      therapist: {
        id: therapistData.id,
        name: therapistData.full_name,
        email: therapistData.email,
        isVerified: therapistData.is_verified,
        isApproved: true,
        specialization: [],
        licenseNumber: '',
        hourlyRate: 5000,
        totalClients: uniqueClients,
        totalSessions,
        completedSessions,
        upcomingSessions,
        earningsThisMonth
      },
      sessions: sessions,
      clients: uniqueClients
    })
    
    // Add cache headers (consider implementing smart caching in the future)
    response.headers.set('Cache-Control', 'private, max-age=60, must-revalidate')
    
    return response
  } catch (error) {
    console.error('Therapist dashboard API error:', error)
    return handleApiError(error)
  }
}
