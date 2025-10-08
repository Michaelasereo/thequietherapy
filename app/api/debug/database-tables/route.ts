import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createServerClient()
    
    // Try to query information_schema to see all tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')

    // If that doesn't work, try some common table names
    const possibleTables = [
      'donations',
      'donation', 
      'payments',
      'transactions',
      'funding',
      'contributions'
    ]

    const tableResults: any = {}

    for (const tableName of possibleTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        tableResults[tableName] = {
          exists: !error,
          error: error?.message,
          sampleData: data?.[0] || null
        }
      } catch (err: any) {
        tableResults[tableName] = {
          exists: false,
          error: err.message
        }
      }
    }

    // Also check the donations table more thoroughly
    const { data: allDonations, error: donationsError } = await supabase
      .from('donations')
      .select('*')

    return NextResponse.json({
      success: true,
      data: {
        environment: {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
          nodeEnv: process.env.NODE_ENV
        },
        tablesInfo: tablesError ? 'Could not query information_schema' : tables,
        tableResults,
        donationsTable: {
          totalRecords: allDonations?.length || 0,
          error: donationsError?.message,
          allRecords: allDonations || []
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Error checking database:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
