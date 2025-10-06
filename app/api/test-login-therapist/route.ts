import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get the therapist data
    const email = "asereope@gmail.com"
    
    // Get user account
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json({
        error: "User not found"
      }, { status: 404 })
    }

    // Create a session token
    const sessionToken = crypto.randomUUID()
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    // Create session in database
    const { error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_token: sessionToken,
        expires_at: sessionExpiresAt.toISOString()
      })

    if (sessionError) {
      return NextResponse.json({
        error: "Failed to create session"
      }, { status: 500 })
    }

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      message: "Logged in as therapist",
      user: {
        id: user.id,
        name: "Michael Asere",
        email: user.email,
        role: "therapist"
      }
    })

    // Set the therapist session cookie
    response.cookies.set("quiet_therapist_user", JSON.stringify({
      id: user.id,
      name: "Michael Asere",
      email: user.email,
      role: "therapist",
      session_token: sessionToken
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    })

    return response

  } catch (error) {
    return NextResponse.json({
      error: "Login failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
