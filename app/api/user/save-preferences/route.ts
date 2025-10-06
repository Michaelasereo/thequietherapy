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
    const body = await request.json()
    const { therapyGoals } = body

    if (!therapyGoals || !Array.isArray(therapyGoals)) {
      return NextResponse.json({ error: 'Invalid therapy goals data' }, { status: 400 })
    }

    console.log('💾 Saving therapy preferences for user:', user.id, 'Goals:', therapyGoals)

    // Get existing onboarding_data
    const { data: existingData, error: fetchError } = await supabase
      .from('users')
      .select('onboarding_data')
      .eq('id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error fetching existing data:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
    }

    // Merge with existing onboarding data
    const existingOnboardingData = existingData?.onboarding_data || {}
    const updatedOnboardingData = {
      ...existingOnboardingData,
      therapyGoals,
      savedAt: new Date().toISOString()
    }

    // Save preferences to onboarding_data JSONB column
    const { error } = await supabase
      .from('users')
      .update({ 
        onboarding_data: updatedOnboardingData,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) {
      console.error('❌ Error saving preferences:', error)
      return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
    }

    console.log('✅ Therapy preferences saved successfully')
    return NextResponse.json({ 
      success: true,
      message: 'Preferences saved successfully' 
    })
  } catch (error) {
    console.error('❌ Save preferences error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

