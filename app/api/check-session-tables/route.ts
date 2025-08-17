import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    console.log('🔍 Checking session tables...')

    const tables = ['individual_sessions', 'therapist_sessions', 'partner_sessions', 'admin_sessions']
    const results: any = {}

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1)

        if (error) {
          results[table] = { exists: false, error: error.message }
        } else {
          results[table] = { exists: true, count: data?.length || 0 }
        }
      } catch (err) {
        results[table] = { exists: false, error: 'Table not found' }
      }
    }

    console.log('✅ Session tables check complete:', results)

    return NextResponse.json({
      success: true,
      tables: results
    })

  } catch (error) {
    console.error('❌ Check session tables error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error
    })
  }
}
