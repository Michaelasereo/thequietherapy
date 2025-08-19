import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper function to get user email from session cookies
function getUserEmailFromCookies(request: NextRequest): string | null {
  const cookieStore = cookies()
  
  // Check for therapist user cookie
  const therapistUserCookie = cookieStore.get('trpi_therapist_user')
  if (therapistUserCookie) {
    try {
      const userData = JSON.parse(decodeURIComponent(therapistUserCookie.value))
      return userData.email
    } catch (error) {
      console.error('Error parsing therapist user cookie:', error)
    }
  }
  
  // Check for individual user cookie (therapists might be using this)
  const individualUserCookie = cookieStore.get('trpi_individual_user')
  if (individualUserCookie) {
    try {
      const userData = JSON.parse(decodeURIComponent(individualUserCookie.value))
      return userData.email
    } catch (error) {
      console.error('Error parsing individual user cookie:', error)
    }
  }
  
  return null
}

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

    const { data: availability, error } = await supabase
      .from('therapist_availability')
      .select('*')
      .eq('therapist_email', therapistEmail)
      .order('day_of_week', { ascending: true })

    if (error) {
      console.error('Error fetching therapist availability:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch availability' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      availability: availability || []
    })

  } catch (error) {
    console.error('Error in therapist availability API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Handle isActive toggle (from availability page)
    if (body.hasOwnProperty('isActive')) {
      return await handleIsActiveToggle(request, body)
    }
    
    // Handle detailed availability schedule
    if (body.therapistEmail && body.availability) {
      return await handleAvailabilitySchedule(body)
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request data' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error in therapist availability API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleIsActiveToggle(request: NextRequest, body: { isActive: boolean }) {
  try {
    const therapistEmail = getUserEmailFromCookies(request)
    
    if (!therapistEmail) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    
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

    // Delete existing availability for this therapist
    const { error: deleteError } = await supabase
      .from('therapist_availability')
      .delete()
      .eq('therapist_email', therapistEmail)

    if (deleteError) {
      console.error('Error deleting existing availability:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to update availability' },
        { status: 500 }
      )
    }

    // Handle both traditional and calendar availability
    let availabilityData = []

    if (weeklySchedule) {
      // Handle calendar-style availability with specific dates
      for (const [date, dayData] of Object.entries(weeklySchedule)) {
        const day = dayData as any
        if (day.is_available && day.time_slots) {
          for (const slot of day.time_slots) {
            if (slot.is_available) {
              availabilityData.push({
                therapist_email: therapistEmail,
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
                daily_room_name: `${therapistEmail}-${date}-${slot.start_time.replace(':', '')}`,
                created_at: new Date().toISOString()
              })
            }
          }
        }
      }
    } else {
      // Handle traditional weekly availability
      availabilityData = availability.map((slot: any) => ({
        therapist_email: therapistEmail,
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
