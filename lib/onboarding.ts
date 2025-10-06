import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function checkOnboardingStatus() {
  try {
    // Get user from session cookie
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('quiet_user')
    
    if (!userCookie) {
      return { user: null, hasCompletedOnboarding: false }
    }

    const user = JSON.parse(userCookie.value)

    // Check if user has completed onboarding
    const { data, error } = await supabase
      .from('users')
      .select('has_completed_onboarding, onboarding_data, user_type')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error checking onboarding status:', error)
      return { user, hasCompletedOnboarding: false }
    }

    return {
      user: {
        ...user,
        user_type: data?.user_type || 'individual'
      },
      hasCompletedOnboarding: data?.has_completed_onboarding || false
    }
  } catch (error) {
    console.error('Onboarding status check failed:', error)
    return { user: null, hasCompletedOnboarding: false }
  }
}

