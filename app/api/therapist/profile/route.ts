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

    // Get therapist enrollment data
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .eq('email', email)
      .single()

    if (enrollmentError || !enrollment) {
      return NextResponse.json({
        success: false,
        error: "Therapist enrollment not found"
      }, { status: 404 })
    }

    // Get user account data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: "User account not found"
      }, { status: 404 })
    }

    // Combine enrollment and user data
    const therapistData = {
      id: user.id,
      email: user.email,
      full_name: enrollment.full_name,
      specialization: enrollment.specialization || [],
      license_number: enrollment.mdcn_code,
      is_verified: user.is_verified,
      is_active: user.is_active,
      rating: 4.8, // Default rating
      total_sessions: 0, // Will be calculated from sessions table
      total_clients: 0, // Will be calculated from clients table
      hourly_rate: enrollment.hourly_rate || 150,
      availability: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false
      },
      phone: enrollment.phone,
      languages: enrollment.languages || [],
      bio: enrollment.bio,
      status: enrollment.status
    }

    return NextResponse.json({
      success: true,
      therapist: therapistData
    })

  } catch (error) {
    console.error('Error fetching therapist profile:', error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch therapist profile"
    }, { status: 500 })
  }
}
