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
    const therapistEmail = searchParams.get('therapistEmail')

    if (!therapistEmail) {
      return NextResponse.json(
        { success: false, error: 'Therapist email is required' },
        { status: 400 }
      )
    }

    // Check if the table exists first
    const { data: tableExists, error: tableError } = await supabase
      .from('therapist_availability')
      .select('count')
      .limit(1)

    if (tableError) {
      console.error('Table does not exist or connection error:', tableError)
      // Return empty availability instead of error
      return NextResponse.json({
        success: true,
        availability: []
      })
    }

    // First try with therapist_email column
    let { data: availability, error } = await supabase
      .from('therapist_availability')
      .select('*')
      .eq('therapist_email', therapistEmail)
      .order('day_of_week', { ascending: true })

    // If that fails, try with therapist_id by looking up the therapist first
    if (error && error.code === '42703') { // Column doesn't exist error
      console.log('therapist_email column not found, trying therapist_id approach')
      
      // Get therapist by email first - try therapist_enrollments table
      let { data: therapist, error: therapistError } = await supabase
        .from('therapist_enrollments')
        .select('id')
        .eq('email', therapistEmail)
        .eq('status', 'approved')
        .single()
      
      // If not found in therapist_enrollments, try users table
      if (therapistError || !therapist) {
        const { data: userTherapist, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', therapistEmail)
          .eq('user_type', 'therapist')
          .single()
        
        if (userError || !userTherapist) {
          console.error('Error finding therapist in both tables:', { therapistError, userError })
          return NextResponse.json({
            success: true,
            availability: []
          })
        }
        
        therapist = userTherapist
      }
      
      if (therapistError || !therapist) {
        console.error('Error finding therapist:', therapistError)
        return NextResponse.json({
          success: true,
          availability: []
        })
      }
      
      // Now query with therapist_id
      const { data: availabilityWithId, error: availabilityError } = await supabase
        .from('therapist_availability')
        .select('*')
        .eq('therapist_id', therapist.id)
        .order('day_of_week', { ascending: true })
      
      if (availabilityError) {
        console.error('Error fetching therapist availability with therapist_id:', availabilityError)
        return NextResponse.json({
          success: true,
          availability: []
        })
      }
      
      availability = availabilityWithId
      error = availabilityError
    }

    if (error) {
      console.error('Error fetching therapist availability:', error)
      // Return empty availability instead of error
      return NextResponse.json({
        success: true,
        availability: []
      })
    }

    // If no availability found, return empty array
    if (!availability || availability.length === 0) {
      console.log('No availability found for', therapistEmail)
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
        .select('session_date, start_time, end_time, status')
        .eq('therapist_email', therapistEmail)
        .gte('session_date', today.toISOString().split('T')[0])
        .lte('session_date', nextWeek.toISOString().split('T')[0])
        .in('status', ['scheduled', 'confirmed', 'in_progress'])

      if (!sessionsError && existingSessions) {
        // Mark slots as unavailable if they conflict with existing sessions
        filteredAvailability = filteredAvailability.map(slot => {
          // Generate time slots for this availability window
          const hasConflict = existingSessions.some(session => {
            // Check if there's a time conflict
            const sessionStart = new Date(`${session.session_date}T${session.start_time}`)
            const sessionEnd = new Date(`${session.session_date}T${session.end_time}`)
            
            // For weekly availability, we need to check against generated slots
            // This is a simplified check - in production you'd want more sophisticated logic
            return session.start_time === slot.start_time
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
    // Return empty availability instead of error
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
      return await handleIsActiveToggle(session.user.email, body)
    }
    
    // Handle detailed availability schedule
    if (body.availability) {
      return await handleAvailabilitySchedule({
        therapistEmail: session.user.email,
        availability: body.availability,
        weeklySchedule: body.weeklySchedule
      })
    }

    throw new ValidationError('Invalid request data')

  } catch (error) {
    return handleApiError(error)
  }
}

async function handleIsActiveToggle(therapistEmail: string, body: { isActive: boolean }) {
  try {
    
    // Update therapist is_active status
    const { error } = await supabase
      .from('therapists')
      .update({ is_active: body.isActive })
      .eq('email', therapistEmail)

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

async function handleAvailabilitySchedule(body: { 
  therapistEmail: string, 
  availability: any[], 
  weeklySchedule?: any 
}) {
  try {
    const { therapistEmail, availability, weeklySchedule } = body

    // Check if the table exists first
    const { error: tableCheckError } = await supabase
      .from('therapist_availability')
      .select('count')
      .limit(1)

    if (tableCheckError) {
      console.log('Therapist availability table does not exist, skipping save operation')
      return NextResponse.json({
        success: true,
        message: 'Availability table not found. Please create the table first.',
        slotsCreated: 0
      })
    }

    // Delete existing availability for this therapist
    // Try with therapist_email first, then therapist_id if that fails
    let { error: deleteError } = await supabase
      .from('therapist_availability')
      .delete()
      .eq('therapist_email', therapistEmail)

    if (deleteError && deleteError.code === '42703') {
      // therapist_email column doesn't exist, try with therapist_id
      // Get therapist by email first - try therapist_enrollments table
      let { data: therapist, error: therapistError } = await supabase
        .from('therapist_enrollments')
        .select('id')
        .eq('email', therapistEmail)
        .eq('status', 'approved')
        .single()
      
      // If not found in therapist_enrollments, try users table
      if (therapistError || !therapist) {
        const { data: userTherapist, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', therapistEmail)
          .eq('user_type', 'therapist')
          .single()
        
        if (userError || !userTherapist) {
          console.error('Error finding therapist for deletion:', { therapistError, userError })
          return NextResponse.json(
            { success: false, error: 'Failed to update availability' },
            { status: 500 }
          )
        }
        
        therapist = userTherapist
      }
      
      if (therapistError || !therapist) {
        console.error('Error finding therapist for deletion:', therapistError)
        return NextResponse.json(
          { success: false, error: 'Failed to update availability' },
          { status: 500 }
        )
      }
      
      const { error: deleteWithIdError } = await supabase
        .from('therapist_availability')
        .delete()
        .eq('therapist_id', therapist.id)
      
      deleteError = deleteWithIdError
    }

    if (deleteError) {
      console.error('Error deleting existing availability:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to update availability' },
        { status: 500 }
      )
    }

    // Handle both traditional and calendar availability
    let availabilityData = []

    // First, determine which column to use by checking if therapist_email column exists
    let useTherapistEmail = true
    try {
      const { error: testError } = await supabase
        .from('therapist_availability')
        .select('therapist_email')
        .limit(1)
      
      if (testError && testError.code === '42703') {
        useTherapistEmail = false
        console.log('Using therapist_id column instead of therapist_email')
      }
    } catch (error) {
      useTherapistEmail = false
      console.log('Error testing column, defaulting to therapist_id')
    }

    // Get therapist ID if needed
    let therapistId = null
    if (!useTherapistEmail) {
      // Get therapist by email first - try therapist_enrollments table
      let { data: therapist, error: therapistError } = await supabase
        .from('therapist_enrollments')
        .select('id')
        .eq('email', therapistEmail)
        .eq('status', 'approved')
        .single()
      
      // If not found in therapist_enrollments, try users table
      if (therapistError || !therapist) {
        const { data: userTherapist, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', therapistEmail)
          .eq('user_type', 'therapist')
          .single()
        
        if (userError || !userTherapist) {
          console.error('Error finding therapist:', { therapistError, userError })
          return NextResponse.json(
            { success: false, error: 'Failed to save availability' },
            { status: 500 }
          )
        }
        
        therapist = userTherapist
      }
      
      therapistId = therapist.id
    }

    if (weeklySchedule) {
      // Handle calendar-style availability with specific dates
      for (const [date, dayData] of Object.entries(weeklySchedule)) {
        const day = dayData as any
        if (day.is_available && day.time_slots) {
          for (const slot of day.time_slots) {
            if (slot.is_available) {
              const slotData: any = {
                date: date,
                day_of_week: day.day_of_week,
                day_name: day.day_name,
                start_time: slot.start_time,
                end_time: slot.end_time,
                is_available: true,
                session_duration: slot.session_duration || 60,
                max_sessions_per_day: slot.max_sessions || 1,
                session_title: slot.session_title || 'Individual Therapy Session',
                session_type: slot.session_type || 'individual',
                // daily_room_name: `${therapistEmail}-${date}-${slot.start_time.replace(':', '')}`,
                created_at: new Date().toISOString()
              }
              
              if (useTherapistEmail) {
                slotData.therapist_email = therapistEmail
              } else {
                slotData.therapist_id = therapistId
              }
              
              availabilityData.push(slotData)
            }
          }
        }
      }
    } else {
      // Handle traditional weekly availability
      availabilityData = availability.map((slot: any) => {
        const slotData: any = {
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_available: slot.is_available,
          session_duration: slot.session_duration || 60,
          max_sessions_per_day: slot.max_sessions_per_day || 8,
          session_title: 'Individual Therapy Session',
          session_type: 'individual',
          created_at: new Date().toISOString()
        }
        
        if (useTherapistEmail) {
          slotData.therapist_email = therapistEmail
        } else {
          slotData.therapist_id = therapistId
        }
        
        return slotData
      })
    }

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

    // Create Daily.co rooms for calendar availability
    if (weeklySchedule) {
      await createDailyRoomsForAvailability(therapistEmail, weeklySchedule)
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

async function createDailyRoomsForAvailability(therapistEmail: string, weeklySchedule: any) {
  try {
    const dailyApiKey = process.env.DAILY_API_KEY
    const dailyDomain = process.env.DAILY_DOMAIN

    if (!dailyApiKey || !dailyDomain) {
      console.warn('Daily.co API key or domain not configured')
      return
    }

    for (const [date, dayData] of Object.entries(weeklySchedule)) {
      const day = dayData as any
      if (day.is_available && day.time_slots) {
        for (const slot of day.time_slots) {
          if (slot.is_available) {
            const roomName = `${therapistEmail}-${date}-${slot.start_time.replace(':', '')}`
            const roomUrl = `https://${dailyDomain}/${roomName}`
            
            try {
              const response = await fetch('https://api.daily.co/v1/rooms', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${dailyApiKey}`
                },
                body: JSON.stringify({
                  name: roomName,
                  privacy: 1, // Private room
                  properties: {
                    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // Expire in 7 days
                    max_participants: slot.session_type === 'group' ? 10 : 2,
                    enable_chat: true,
                    enable_recording: false,
                    start_video_off: true,
                    start_audio_off: false
                  }
                })
              })

              if (response.ok) {
                console.log(`Created Daily.co room: ${roomName}`)
              } else {
                console.error(`Failed to create Daily.co room: ${roomName}`)
              }
            } catch (error) {
              console.error(`Error creating Daily.co room ${roomName}:`, error)
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error creating Daily.co rooms:', error)
  }
}
