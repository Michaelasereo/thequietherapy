import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ServerSessionManager } from '@/lib/server-session-manager'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // SECURE Authentication - only admin or therapist can run this
    const session = await ServerSessionManager.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (session.role !== 'therapist' && session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    console.log('🔍 Adding therapist profile columns...')

    // Add the new columns to therapist_profiles table
    const queries = [
      // Add gender column
      `ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(50);`,
      // Add marital_status column  
      `ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50);`,
      // Add age column
      `ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS age VARCHAR(10);`,
      // Update existing records to have empty strings instead of null
      `UPDATE therapist_profiles SET gender = '', marital_status = '', age = '' WHERE gender IS NULL OR marital_status IS NULL OR age IS NULL;`
    ]

    for (const query of queries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query })
      if (error) {
        console.error('❌ Error executing SQL:', error)
        // Try alternative approach using direct query
        const { error: directError } = await supabase.from('therapist_profiles').select('id').limit(1)
        if (directError && directError.message.includes('gender')) {
          // Column doesn't exist, we need to add it
          console.log('⚠️ Columns need to be added manually to the database')
          return NextResponse.json({ 
            error: 'Database columns need to be added manually. Please run the SQL script in your Supabase dashboard.',
            sql_script: queries.join('\n')
          }, { status: 500 })
        }
      }
    }

    console.log('✅ Therapist profile columns added successfully')

    return NextResponse.json({
      success: true,
      message: 'Therapist profile columns added successfully'
    })

  } catch (error) {
    console.error('Error setting up therapist profile columns:', error)
    return NextResponse.json({
      error: 'Failed to setup columns',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
