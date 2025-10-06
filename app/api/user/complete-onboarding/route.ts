import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SessionManager } from '@/lib/session-manager'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const session = await SessionManager.getSession()
    
    if (!session) {
      console.log('❌ No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session

    console.log('📝 Completing onboarding for user:', user.id)

    // Mark user as having completed onboarding
    const { error } = await supabase
      .from('users')
      .update({ 
        has_completed_onboarding: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) {
      console.error('❌ Error completing onboarding:', error)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    console.log('✅ Onboarding completed successfully')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Onboarding completion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

