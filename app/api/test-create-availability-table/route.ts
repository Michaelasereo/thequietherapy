import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create therapist availability table
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS therapist_availability (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          therapist_email TEXT NOT NULL,
          day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          is_available BOOLEAN DEFAULT true,
          session_duration INTEGER DEFAULT 60,
          max_sessions_per_day INTEGER DEFAULT 8,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(therapist_email, day_of_week)
        );
      `
    })

    if (error) {
      return NextResponse.json({
        success: false,
        error: "Failed to create table",
        details: error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Therapist availability table created successfully"
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Failed to create table",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
