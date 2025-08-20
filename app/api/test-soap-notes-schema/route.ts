import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Test 1: Check if session_soap_notes table exists
    const { data: soapNotesData, error: soapNotesError } = await supabase
      .from('session_soap_notes')
      .select('*')
      .limit(1)

    // Test 2: Check if global_sessions table exists and has start_time column
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('global_sessions')
      .select('id, start_time, status')
      .limit(1)

    // Test 3: Check if the view exists
    const { data: viewData, error: viewError } = await supabase
      .from('soap_notes_summary')
      .select('*')
      .limit(1)

    // Test 4: Test the function
    const { data: functionData, error: functionError } = await supabase
      .rpc('get_soap_notes_stats')

    // Test 5: Try to insert a test SOAP note (if we have session data)
    let insertTest: { success: boolean; error: string | null; result?: any } = { success: false, error: 'No test session available' }
    if (sessionsData && sessionsData.length > 0) {
      const testSession = sessionsData[0]
      const { data: insertResult, error: insertError } = await supabase
        .from('session_soap_notes')
        .insert({
          session_id: testSession.id,
          therapist_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
          patient_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
          subjective: { 'chief_complaint': 'Test complaint' },
          objective: { 'observations': 'Test observations' },
          assessment: { 'diagnosis': 'Test diagnosis' },
          plan: { 'treatment': 'Test treatment plan' },
          session_rating: 8,
          therapeutic_alliance_rating: 7,
          patient_engagement: 9,
          treatment_compliance: 8,
          notes: 'Test SOAP note',
          ai_generated: false
        })
        .select()

      insertTest = {
        success: !insertError,
        result: insertResult,
        error: insertError ? insertError.message : null
      }
    }

    return NextResponse.json({
      success: true,
      tests: {
        soapNotesTable: {
          exists: !soapNotesError,
          error: soapNotesError,
          columns: soapNotesData && soapNotesData.length > 0 ? Object.keys(soapNotesData[0]) : []
        },
        globalSessionsTable: {
          exists: !sessionsError,
          error: sessionsError,
          hasStartTime: sessionsData && sessionsData.length > 0 ? 'start_time' in sessionsData[0] : false,
          sampleData: sessionsData
        },
        soapNotesSummaryView: {
          exists: !viewError,
          error: viewError,
          columns: viewData && viewData.length > 0 ? Object.keys(viewData[0]) : []
        },
        getSoapNotesStatsFunction: {
          exists: !functionError,
          error: functionError,
          result: functionData
        },
        insertTest: insertTest
      }
    })
  } catch (error) {
    console.error('Error testing SOAP notes schema:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to test SOAP notes schema',
      details: error
    })
  }
}
