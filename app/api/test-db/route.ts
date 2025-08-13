import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Test database connection and get table structure
    const { data, error } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .limit(1)

    if (error) {
      console.error('Database test error:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Database connection failed',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      tableExists: true,
      data: data
    })
  } catch (error) {
    console.error('Error testing database:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
