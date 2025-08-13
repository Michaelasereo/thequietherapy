import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Test the verification flow for the existing therapist enrollment
    const email = "asereope@gmail.com"
    
    // Check if enrollment exists
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .eq('email', email)
      .single()

    if (enrollmentError || !enrollment) {
      return NextResponse.json({
        error: "No therapist enrollment found",
        details: enrollmentError
      }, { status: 404 })
    }

    // Check if user already exists
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    let userData = existingUser

    if (!existingUser) {
      // Create new user account for therapist
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          email: email,
          full_name: enrollment.full_name,
          user_type: 'therapist',
          is_verified: true,
          is_active: true
        })
        .select()
        .single()

      if (createUserError) {
        return NextResponse.json({
          error: "Failed to create user account",
          details: createUserError
        }, { status: 500 })
      }

      userData = newUser
    } else {
      // Update existing user to be a therapist
      const { data: updatedUser, error: updateUserError } = await supabase
        .from('users')
        .update({
          user_type: 'therapist',
          is_verified: true,
          is_active: true
        })
        .eq('email', email)
        .select()
        .single()

      if (updateUserError) {
        return NextResponse.json({
          error: "Failed to update user type",
          details: updateUserError
        }, { status: 500 })
      }

      userData = updatedUser
    }

    // Update enrollment status to approved
    const { error: updateError } = await supabase
      .from('therapist_enrollments')
      .update({ 
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', enrollment.id)

    return NextResponse.json({
      success: true,
      message: "Therapist verification completed successfully",
      enrollment: enrollment,
      user: userData,
      statusUpdated: !updateError
    })

  } catch (error) {
    return NextResponse.json({
      error: "Test failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
