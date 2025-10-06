import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Types for better type safety
interface TimeSlot {
  id: string
  date: string
  start_time: string
  end_time: string
  day_of_week: number
  is_available: boolean
  booking_status: 'available' | 'booked'
  session_duration: number
  session_type: string
}

interface AvailabilityResponse {
  success: boolean
  availability: TimeSlot[]
  error?: string
}

// Generate time slots based on therapist availability
function generateTimeSlots(
  availability: any[], 
  existingSessions: any[], 
  daysAhead: number = 7
): TimeSlot[] {
  const slots: TimeSlot[] = []
  const today = new Date()
  
  // Generate slots for the specified number of days ahead
  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
    const currentDate = new Date(today)
    currentDate.setDate(today.getDate() + dayOffset)
    const dayOfWeek = currentDate.getDay()
    
    // Find availability for this day of the week
    const dayAvailability = availability.filter(a => a.day_of_week === dayOfWeek)
    
    dayAvailability.forEach(avail => {
      const startTime = new Date(`${currentDate.toISOString().split('T')[0]}T${avail.start_time}`)
      const endTime = new Date(`${currentDate.toISOString().split('T')[0]}T${avail.end_time}`)
      
      // Generate 60-minute slots within the availability window
      let currentSlot = new Date(startTime)
      while (currentSlot < endTime) {
        const slotEnd = new Date(currentSlot.getTime() + 30 * 60000) // 30 minutes
        
        // Skip if slot would go beyond availability window
        if (slotEnd > endTime) break
        
        // Check if this slot conflicts with existing sessions
        const hasConflict = existingSessions.some((session: any) => {
          const sessionStart = new Date(session.start_time)
          const sessionEnd = new Date(session.end_time)
          
          return (
            (currentSlot >= sessionStart && currentSlot < sessionEnd) ||
            (slotEnd > sessionStart && slotEnd <= sessionEnd) ||
            (currentSlot <= sessionStart && slotEnd >= sessionEnd)
          )
        })
        
        // Only add future slots (at least 1 hour from now)
        const thirtyMinutesFromNow = new Date(Date.now() + 30 * 60000)
        if (currentSlot > thirtyMinutesFromNow) {
          slots.push({
            id: `${currentDate.toISOString().split('T')[0]}-${currentSlot.toTimeString().split(' ')[0].substring(0, 5)}`,
            date: currentDate.toISOString().split('T')[0],
            start_time: currentSlot.toTimeString().split(' ')[0].substring(0, 5),
            end_time: slotEnd.toTimeString().split(' ')[0].substring(0, 5),
            day_of_week: dayOfWeek,
            is_available: !hasConflict,
            booking_status: hasConflict ? 'booked' : 'available',
            session_duration: 60,
            session_type: 'individual'
          })
        }
        
        // Move to next hour
        currentSlot = new Date(currentSlot.getTime() + 30 * 60000)
      }
    })
  }
  
  // Sort by date and time
  return slots.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.start_time}`)
    const dateB = new Date(`${b.date}T${b.start_time}`)
    return dateA.getTime() - dateB.getTime()
  })
}

export async function GET(request: NextRequest): Promise<NextResponse<AvailabilityResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const therapistId = searchParams.get('therapistId')
    const therapistEmail = searchParams.get('therapistEmail')
    const daysAhead = parseInt(searchParams.get('daysAhead') || '7')

    if (!therapistId && !therapistEmail) {
      return NextResponse.json({
        success: false,
        availability: [],
        error: 'Therapist ID or email is required'
      }, { status: 400 })
    }

    console.log('🔍 Fetching availability for:', { therapistId, therapistEmail, daysAhead })

    // Get therapist ID if only email provided
    let finalTherapistId = therapistId
    if (!finalTherapistId && therapistEmail) {
      const { data: therapist } = await supabase
        .from('users')
        .select('id')
        .eq('email', therapistEmail)
        .eq('user_type', 'therapist')
        .eq('is_active', true)
        .eq('is_verified', true)
        .single()
      
      finalTherapistId = therapist?.id
    }

    if (!finalTherapistId) {
      return NextResponse.json({
        success: false,
        availability: [],
        error: 'Therapist not found or not available'
      }, { status: 404 })
    }

    // Fetch therapist's weekly availability schedule
    const { data: availability, error: availError } = await supabase
      .from('therapist_availability')
      .select('*')
      .eq('therapist_id', finalTherapistId)
      .eq('is_available', true)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })

    if (availError) {
      console.error('❌ Error fetching availability:', availError)
      return NextResponse.json({
        success: false,
        availability: [],
        error: 'Failed to fetch availability'
      }, { status: 500 })
    }

    if (!availability || availability.length === 0) {
      console.log('📅 No availability schedule found for therapist')
      return NextResponse.json({
        success: true,
        availability: []
      })
    }

    // Fetch existing sessions to check for conflicts
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + daysAhead)

    const { data: existingSessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('start_time, end_time, status')
      .eq('therapist_id', finalTherapistId)
      .gte('start_time', new Date().toISOString())
      .lte('start_time', endDate.toISOString())
      .in('status', ['scheduled', 'confirmed', 'in_progress'])

    if (sessionsError) {
      console.warn('⚠️ Error fetching existing sessions:', sessionsError)
    }

    // Generate available time slots
    const timeSlots = generateTimeSlots(
      availability, 
      existingSessions || [], 
      daysAhead
    )

    console.log('✅ Generated time slots:', {
      total: timeSlots.length,
      available: timeSlots.filter(s => s.is_available).length,
      booked: timeSlots.filter(s => !s.is_available).length
    })

    return NextResponse.json({
      success: true,
      availability: timeSlots
    })

  } catch (error) {
    console.error('💥 Error in availability API:', error)
    return NextResponse.json({
      success: false,
      availability: [],
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// POST endpoint for therapists to manage their availability
export async function POST(request: NextRequest) {
  try {
    const { therapist_id, availability_schedule } = await request.json()

    if (!therapist_id || !availability_schedule) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    // Validate therapist exists
    const { data: therapist, error: therapistError } = await supabase
      .from('users')
      .select('id')
      .eq('id', therapist_id)
      .eq('user_type', 'therapist')
      .single()

    if (therapistError || !therapist) {
      return NextResponse.json({
        success: false,
        error: 'Therapist not found'
      }, { status: 404 })
    }

    // Delete existing availability
    await supabase
      .from('therapist_availability')
      .delete()
      .eq('therapist_id', therapist_id)

    // Insert new availability schedule
    const availabilityRecords = availability_schedule.map((slot: any) => ({
      therapist_id: therapist_id,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_available: slot.is_available !== false
    }))

    const { error: insertError } = await supabase
      .from('therapist_availability')
      .insert(availabilityRecords)

    if (insertError) {
      console.error('❌ Error updating availability:', insertError)
      return NextResponse.json({
        success: false,
        error: 'Failed to update availability'
      }, { status: 500 })
    }

    console.log('✅ Updated availability for therapist:', therapist_id)

    return NextResponse.json({
      success: true,
      message: 'Availability updated successfully'
    })

  } catch (error) {
    console.error('💥 Error updating availability:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
