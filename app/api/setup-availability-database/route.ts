import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    console.log('🔄 Starting therapist availability database setup...')

    // First check if the table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('therapist_availability')
      .select('count')
      .limit(1)

    if (!checkError) {
      console.log('✅ Table already exists, checking schema...')
      
      // Check if therapist_email column exists
      try {
        const { data: testData, error: testError } = await supabase
          .from('therapist_availability')
          .select('therapist_email')
          .limit(1)
        
        if (!testError) {
          console.log('✅ therapist_email column exists')
          return NextResponse.json({
            success: true,
            message: 'Therapist availability table already exists with correct schema'
          })
        } else {
          console.log('❌ therapist_email column does not exist, table needs to be recreated')
        }
      } catch (error) {
        console.log('❌ Error checking schema:', error)
      }
    }

    console.log('❌ Table does not exist or has wrong schema. Please run the SQL script manually in Supabase dashboard.')
    return NextResponse.json({
      success: false,
      message: 'Please run the SQL script manually in your Supabase SQL Editor',
      instructions: [
        '1. Go to your Supabase project dashboard',
        '2. Open the SQL Editor',
        '3. Copy and paste the content from setup-therapist-availability-simple.sql',
        '4. Click "Run" to execute the script'
      ]
    })

  } catch (error) {
    console.error('❌ Setup check failed:', error)
    return NextResponse.json(
      { success: false, error: 'Setup check failed', details: error },
      { status: 500 }
    )
  }
}
