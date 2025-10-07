import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Check if donations table exists by trying to query it
    const { data, error } = await supabase
      .from('donations')
      .select('id')
      .limit(1)

    if (error) {
      console.log('📊 Donations table does not exist, needs to be created')
      return NextResponse.json({
        success: false,
        message: 'Donations table does not exist. Please run the SQL script to create it.',
        error: error.message
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Donations table exists and is ready',
      tableExists: true
    })

  } catch (error) {
    console.error('❌ Error checking donations table:', error)
    return NextResponse.json(
      { error: 'Failed to check donations table' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Simple check to see if table exists
    const { data, error } = await supabase
      .from('donations')
      .select('count')
      .limit(1)

    if (error) {
      return NextResponse.json({
        tableExists: false,
        message: 'Donations table does not exist'
      })
    }

    return NextResponse.json({
      tableExists: true,
      message: 'Donations table exists'
    })

  } catch (error) {
    return NextResponse.json({
      tableExists: false,
      message: 'Error checking table existence'
    })
  }
}
