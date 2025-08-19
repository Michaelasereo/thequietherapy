import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Try to get all sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .limit(5)

    if (sessionsError) {
      return NextResponse.json({
        success: false,
        error: 'Sessions table error',
        details: sessionsError
      })
    }

    // Try to insert a test record to see what columns are required
    const { data: insertResult, error: insertError } = await supabase
      .from('sessions')
      .insert({
        title: 'Test Session',
        description: 'Test description',
        scheduled_date: '2024-01-15',
        scheduled_time: '10:00:00',
        duration_minutes: 60,
        status: 'scheduled'
      })
      .select()

    return NextResponse.json({
      success: true,
      sessions: sessions || [],
      count: sessions?.length || 0,
      insertResult: insertResult || null,
      insertError: insertError || null
    })
  } catch (error) {
    console.error('Error testing sessions table:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to test sessions table',
      details: error
    })
  }
}
