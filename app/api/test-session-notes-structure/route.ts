import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Try to select from session_notes to see if table exists and what columns it has
    const { data: sampleData, error: sampleError } = await supabase
      .from('session_notes')
      .select('*')
      .limit(1)

    // Try to select from sessions to see its structure
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .limit(1)

    // Try to insert a minimal test record to see what columns are needed
    const { data: insertResult, error: insertError } = await supabase
      .from('session_notes')
      .insert({
        session_id: 'test-session-id',
        therapist_id: 'test-therapist-id',
        user_id: 'test-user-id',
        notes: 'Test notes'
      })
      .select()

    return NextResponse.json({
      success: true,
      sessionNotesExists: !sampleError,
      sessionNotesError: sampleError,
      sessionNotesColumns: sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : [],
      sessionsStructure: sessionsData ? Object.keys(sessionsData[0] || {}) : [],
      insertTest: {
        success: !insertError,
        result: insertResult,
        error: insertError
      }
    })
  } catch (error) {
    console.error('Error testing session notes structure:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to test session notes structure',
      details: error
    })
  }
}
