import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const therapistEmail = searchParams.get('therapist_email')
    const date = searchParams.get('date') // Optional: specific date to check

    if (!therapistEmail) {
      return NextResponse.json({
        success: false,
        error: "Therapist email is required"
      }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get therapist availability
    const { data: availability, error } = await supabase
      .from('therapist_availability')
      .select('*')
      .eq('therapist_email', therapistEmail)
      .eq('is_available', true)
      .order('day_of_week')

    if (error) {
      console.error('Error fetching therapist availability:', error)
      return NextResponse.json({
        success: false,
        error: "Failed to fetch therapist availability"
      }, { status: 500 })
    }

    // If a specific date is provided, filter for that day
    let filteredAvailability = availability
    if (date) {
      const targetDate = new Date(date)
      const dayOfWeek = targetDate.getDay() // 0 = Sunday, 1 = Monday, etc.
      
      filteredAvailability = availability.filter((day: any) => day.day_of_week === dayOfWeek)
    }

    return NextResponse.json({
      success: true,
      availability: filteredAvailability || []
    })

  } catch (error) {
    console.error('Error in therapist availability GET:', error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch therapist availability"
    }, { status: 500 })
  }
}
