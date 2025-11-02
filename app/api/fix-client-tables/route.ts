import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // First, let's check if the user exists in the public.users table
    const { data: userCheck, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', 'c012e073-49d1-4fc6-b580-7714edb45876')
      .single()

    console.log('User check result:', userCheck, userCheckError)

    // Drop the foreign key constraint temporarily
    const { error: dropError } = await supabase
      .rpc('exec_sql', { 
        sql: 'ALTER TABLE patient_biodata DROP CONSTRAINT IF EXISTS patient_biodata_user_id_fkey;'
      })

    if (dropError) {
      console.error('Error dropping constraint:', dropError)
    }

    // Add the constraint back with the correct reference
    const { error: addError } = await supabase
      .rpc('exec_sql', { 
        sql: 'ALTER TABLE patient_biodata ADD CONSTRAINT patient_biodata_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;'
      })

    if (addError) {
      console.error('Error adding constraint:', addError)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Attempted to fix foreign key constraints',
      userCheck: userCheck,
      userCheckError: userCheckError?.message,
      dropError: dropError?.message,
      addError: addError?.message
    })
  } catch (error) {
    console.error('Error in fix-patient-tables:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
