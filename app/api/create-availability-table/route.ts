import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create therapist availability table using direct SQL
    const { error } = await supabase
      .from('therapist_availability')
      .select('*')
      .limit(1)

    if (error && error.code === 'PGRST116') {
      // Table doesn't exist, create it
      const createTableSQL = `
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
      
      // We'll need to run this in Supabase dashboard or use a migration
      return NextResponse.json({
        success: false,
        error: "Table needs to be created manually",
        sql: createTableSQL
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Therapist availability table exists"
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Failed to check table",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
