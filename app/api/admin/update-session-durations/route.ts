import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Updating session durations to 30 minutes...')
    
    // Update all sessions to use 30 minutes
    const { data, error } = await supabase
      .from('sessions')
      .update({ 
        duration_minutes: 30,
        planned_duration_minutes: 30
      })
      .neq('id', '00000000-0000-0000-0000-000000000000') // Update all sessions
    
    if (error) {
      console.error('❌ Error updating sessions:', error)
      return NextResponse.json({ error: 'Failed to update sessions' }, { status: 500 })
    }
    
    console.log('✅ Successfully updated session durations to 30 minutes')
    
    // Verify the update
    const { data: sessions, error: fetchError } = await supabase
      .from('sessions')
      .select('id, duration_minutes, planned_duration_minutes')
      .limit(5)
    
    if (fetchError) {
      console.error('❌ Error fetching updated sessions:', fetchError)
      return NextResponse.json({ error: 'Failed to verify update' }, { status: 500 })
    }
    
    console.log('🔍 Sample updated sessions:')
    sessions?.forEach(session => {
      console.log(`  - ${session.id}: duration=${session.duration_minutes}, planned=${session.planned_duration_minutes}`)
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Successfully updated session durations to 30 minutes',
      updatedSessions: sessions?.length || 'all'
    })
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
