import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    const { therapistEmail, availability } = await request.json()

    if (!therapistEmail || !availability) {
      return NextResponse.json(
        { success: false, error: 'Therapist email and availability data are required' },
        { status: 400 }
      )
    }

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

    // Insert new availability
    const availabilityData = availability.map((slot: any) => ({
      therapist_email: therapistEmail,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_available: slot.is_available,
      session_duration: slot.session_duration || 60,
      max_sessions_per_day: slot.max_sessions_per_day || 8
    }))

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
      message: 'Availability updated successfully'
    })

  } catch (error) {
    console.error('Error in therapist availability API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
