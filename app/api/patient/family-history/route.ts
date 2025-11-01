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

    // Only allow individual users to access their own family history
    if (session.user_type !== 'individual' && session.role !== 'individual') {
      console.error('❌ User is not an individual user:', session.user_type)
      return NextResponse.json({ success: false, error: 'Unauthorized - Not an individual user' }, { status: 403 })
    }

    const userId = session.id
    console.log('✅ Authenticated user:', userId, session.email)

    // Fetch family history
    const { data, error } = await supabase
      .from('patient_family_history')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching family history:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: data || null 
    })
  } catch (error) {
    console.error('Error in family history GET:', error)
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

    // Only allow individual users to update their own family history
    if (session.user_type !== 'individual' && session.role !== 'individual') {
      console.error('❌ User is not an individual user:', session.user_type)
      return NextResponse.json({ success: false, error: 'Unauthorized - Not an individual user' }, { status: 403 })
    }

    const userId = session.id
    console.log('✅ Authenticated user:', userId, session.email)

    // Get the family history from request body
    const familyHistory = await request.json()

    // Upsert family history
    const { data, error } = await supabase
      .from('patient_family_history')
      .upsert({
        user_id: userId,
        ...familyHistory
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting family history:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: data 
    })
  } catch (error) {
    console.error('Error in family history POST:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
