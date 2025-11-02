import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Test patient_biodata table
    const { data: biodataData, error: biodataError } = await supabase
      .from('patient_biodata')
      .select('*')
      .limit(1)

    // Test patient_family_history table
    const { data: familyData, error: familyError } = await supabase
      .from('patient_family_history')
      .select('*')
      .limit(1)

    // Test patient_social_history table
    const { data: socialData, error: socialError } = await supabase
      .from('patient_social_history')
      .select('*')
      .limit(1)

    return NextResponse.json({ 
      success: true, 
      tables: {
        patient_biodata: {
          exists: !biodataError,
          error: biodataError?.message || null,
          count: biodataData?.length || 0
        },
        patient_family_history: {
          exists: !familyError,
          error: familyError?.message || null,
          count: familyData?.length || 0
        },
        patient_social_history: {
          exists: !socialError,
          error: socialError?.message || null,
          count: socialData?.length || 0
        }
      }
    })
  } catch (error) {
    console.error('Error testing patient tables:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Patient tables test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
