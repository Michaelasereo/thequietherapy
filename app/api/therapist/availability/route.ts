import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const therapistUserCookie = cookieStore.get("trpi_therapist_user")?.value
    
    if (!therapistUserCookie) {
      return NextResponse.json({
        success: false,
        error: "Therapist not authenticated"
      }, { status: 401 })
    }

    const therapistUser = JSON.parse(therapistUserCookie)
    const email = therapistUser.email

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get therapist availability from database
    const { data: availability, error } = await supabase
      .from('therapist_availability')
      .select('*')
      .eq('therapist_email', email)
      .order('day_of_week')

    if (error) {
      console.error('Error fetching availability:', error)
      return NextResponse.json({
        success: false,
        error: "Failed to fetch availability"
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      availability: availability || []
    })

  } catch (error) {
    console.error('Error in availability GET:', error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch availability"
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const therapistUserCookie = cookieStore.get("trpi_therapist_user")?.value
    
    if (!therapistUserCookie) {
      return NextResponse.json({
        success: false,
        error: "Therapist not authenticated"
      }, { status: 401 })
    }

    const therapistUser = JSON.parse(therapistUserCookie)
    const email = therapistUser.email
    const body = await request.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Delete existing availability
    await supabase
      .from('therapist_availability')
      .delete()
      .eq('therapist_email', email)

    // Insert new availability
    const availabilityData = body.availability.map((day: any) => ({
      therapist_email: email,
      day_of_week: day.dayOfWeek,
      start_time: day.startTime,
      end_time: day.endTime,
      is_available: day.isAvailable,
      session_duration: day.sessionDuration,
      max_sessions_per_day: day.maxSessionsPerDay
    }))

    const { data, error } = await supabase
      .from('therapist_availability')
      .insert(availabilityData)
      .select()

    if (error) {
      console.error('Error saving availability:', error)
      return NextResponse.json({
        success: false,
        error: "Failed to save availability"
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Availability saved successfully",
      data
    })

  } catch (error) {
    console.error('Error in availability POST:', error)
    return NextResponse.json({
      success: false,
      error: "Failed to save availability"
    }, { status: 500 })
  }
}
