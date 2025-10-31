import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ServerSessionManager } from '@/lib/server-session-manager'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user session using unified session manager
    const session = await ServerSessionManager.getSession()
    
    if (!session) {
      console.error('❌ No valid session found')
      return NextResponse.json({ success: false, error: 'Unauthorized - No valid session' }, { status: 401 })
    }

    // Only allow individual users to access their own biodata
    if (session.user_type !== 'individual' && session.role !== 'individual') {
      console.error('❌ User is not an individual user:', session.user_type)
      return NextResponse.json({ success: false, error: 'Unauthorized - Not an individual user' }, { status: 403 })
    }

    const userId = session.id
    console.log('✅ Authenticated user:', userId, session.email)

    // Fetch biodata
    const { data, error } = await supabase
      .from('patient_biodata')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching biodata:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: data || null 
    })
  } catch (error) {
    console.error('Error in biodata GET:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user session using unified session manager
    const session = await ServerSessionManager.getSession()
    
    if (!session) {
      console.error('❌ No valid session found')
      return NextResponse.json({ success: false, error: 'Unauthorized - No valid session' }, { status: 401 })
    }

    // Only allow individual users to update their own biodata
    if (session.user_type !== 'individual' && session.role !== 'individual') {
      console.error('❌ User is not an individual user:', session.user_type)
      return NextResponse.json({ success: false, error: 'Unauthorized - Not an individual user' }, { status: 403 })
    }

    const userId = session.id
    console.log('✅ Authenticated user:', userId, session.email)

    // Get the biodata from request body
    const biodata = await request.json()

    // Try to insert/update biodata
    console.log('Attempting to save biodata for user:', userId)
    
    // First try to update existing record
    const { data: updateData, error: updateError } = await supabase
      .from('patient_biodata')
      .update({
        ...biodata,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    let data, error

    if (updateError && updateError.code === 'PGRST116') {
      // No existing record, try to insert
      console.log('No existing record found, creating new one')
      const result = await supabase
        .from('patient_biodata')
        .insert({
          user_id: userId,
          ...biodata
        })
        .select()
        .single()
      data = result.data
      error = result.error
    } else {
      data = updateData
      error = updateError
    }

    if (error) {
      console.error('Error upserting biodata:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: data 
    })
  } catch (error) {
    console.error('Error in biodata POST:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
