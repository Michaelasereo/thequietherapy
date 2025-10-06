import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireApiAuth } from '@/lib/server-auth'
import { handleApiError, ValidationError, successResponse } from '@/lib/api-response'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const therapistId = searchParams.get('therapist_id')

    if (!therapistId) {
      return NextResponse.json(
        { success: false, error: 'Therapist ID is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Fetching availability for therapist:', therapistId)

    // Get therapist availability using standardized therapist_id
    const { data: availability, error } = await supabase
      .from('therapist_availability')
      .select('*')
      .eq('therapist_id', therapistId)
      .eq('is_available', true)
      .order('day_of_week', { ascending: true })

    if (error) {
      console.error('Error fetching therapist availability:', error)
      return NextResponse.json({
        success: true,
        availability: []
      })
    }

    // Filter out fully booked slots by checking existing sessions
    let filteredAvailability = availability || []
    
    try {
      // Get existing sessions for this therapist for the next 7 days
      const today = new Date()
      const nextWeek = new Date(today)
      nextWeek.setDate(today.getDate() + 7)
      
      const { data: existingSessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('scheduled_date, scheduled_time, status')
        .eq('therapist_id', therapistId)
        .gte('scheduled_date', today.toISOString().split('T')[0])
        .lte('scheduled_date', nextWeek.toISOString().split('T')[0])
        .in('status', ['scheduled', 'confirmed', 'in_progress'])

      if (!sessionsError && existingSessions) {
        // Mark slots as unavailable if they conflict with existing sessions
        filteredAvailability = filteredAvailability.map(slot => {
          const hasConflict = existingSessions.some(session => {
            // Check if there's a time conflict
            return session.scheduled_time === slot.start_time
          })
          
          return {
            ...slot,
            is_available: slot.is_available && !hasConflict,
            booking_status: hasConflict ? 'booked' : 'available'
          }
        })
      }
    } catch (bookingError) {
      console.warn('Error checking existing bookings:', bookingError)
      // Continue with original availability if booking check fails
    }

    return NextResponse.json({
      success: true,
      availability: filteredAvailability
    })

  } catch (error) {
    console.error('Error in therapist availability API:', error)
    return NextResponse.json({
      success: true,
      availability: []
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    // SECURE Authentication Check - only therapists can modify availability
    const authResult = await requireApiAuth(['therapist'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { session } = authResult
    const body = await request.json()
    
    // Handle isActive toggle (from availability page)
    if (body.hasOwnProperty('isActive')) {
      return await handleIsActiveToggle(session.user.id, body)
    }
    
    // Handle detailed availability schedule
    if (body.availability) {
      return await handleAvailabilitySchedule(session.user.id, body.availability)
    }

    throw new ValidationError('Invalid request data')

  } catch (error) {
    return handleApiError(error)
  }
}

async function handleIsActiveToggle(therapistId: string, body: { isActive: boolean }) {
  try {
    // Update therapist is_active status using therapist_id
    const { error } = await supabase
      .from('users')
      .update({ is_active: body.isActive })
      .eq('id', therapistId)
      .eq('user_type', 'therapist')

    if (error) {
      console.error('Error updating therapist active status:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update active status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Active status updated successfully'
    })

  } catch (error) {
    console.error('Error handling isActive toggle:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update active status' },
      { status: 500 }
    )
  }
}

async function handleAvailabilitySchedule(therapistId: string, availability: any[]) {
  try {
    // Delete existing availability for this therapist
    const { error: deleteError } = await supabase
      .from('therapist_availability')
      .delete()
      .eq('therapist_id', therapistId)

    if (deleteError) {
      console.error('Error deleting existing availability:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to update availability' },
        { status: 500 }
      )
    }

    // Prepare availability data with standardized therapist_id
    const availabilityData = availability.map((slot: any) => ({
      therapist_id: therapistId,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_available: slot.is_available,
      session_duration: slot.session_duration || 60,
      max_sessions_per_day: slot.max_sessions_per_day || 8,
      session_title: 'Individual Therapy Session',
      session_type: 'individual',
      created_at: new Date().toISOString()
    }))

    // Insert new availability
    const { error: insertError } = await supabase
      .from('therapist_availability')
      .insert(availabilityData)

    if (insertError) {
      console.error('Error inserting availability:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to save availability' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Availability updated successfully',
      slotsCreated: availabilityData.length
    })

  } catch (error) {
    console.error('Error handling availability schedule:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save availability' },
      { status: 500 }
    )
  }
}
