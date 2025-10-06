import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SessionManager } from '@/lib/session-manager'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const session = await SessionManager.getSession()
    
    if (!session) {
      console.log('❌ No session found for onboarding status check')
      return NextResponse.json({ 
        hasCompletedOnboarding: false,
        user: null 
      })
    }

    const user = session

    // Check if user has completed onboarding
    const { data, error } = await supabase
      .from('users')
      .select('has_completed_onboarding, user_type')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error checking onboarding status:', error)
      return NextResponse.json({ 
        hasCompletedOnboarding: false,
        user 
      })
    }

    return NextResponse.json({
      hasCompletedOnboarding: data?.has_completed_onboarding || false,
      user: {
        ...user,
        user_type: data?.user_type || 'individual'
      }
    })
  } catch (error) {
    console.error('Onboarding status check error:', error)
    return NextResponse.json({ 
      hasCompletedOnboarding: false,
      user: null 
    }, { status: 500 })
  }
}

