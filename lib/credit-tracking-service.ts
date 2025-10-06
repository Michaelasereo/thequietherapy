import { supabase } from '@/lib/supabase'

export interface CreditUsage {
  id: string
  user_id: string
  session_id: string
  credit_id: string
  session_duration_minutes: number
  is_free_credit: boolean
  used_at: string
  session_title?: string
  therapist_name?: string
  session_status?: string
}

export interface CreditBalance {
  total_credits: number
  free_credits: number
  paid_credits: number
  credits_used: number
  credits_available: number
  total_spent_kobo: number
  next_expiring_credit?: {
    id: string
    expires_at: string
    days_until_expiry: number
  }
}

export interface CreditAnalytics {
  total_sessions_booked: number
  total_sessions_completed: number
  total_sessions_cancelled: number
  total_amount_spent: number
  average_session_cost: number
  most_used_therapist?: string
  credits_by_month: {
    month: string
    credits_purchased: number
    credits_used: number
    amount_spent: number
  }[]
}

// Get user's current credit balance
export async function getUserCreditBalance(userId: string): Promise<CreditBalance | null> {
  try {
    // Get all credits
    const { data: allCredits, error: allError } = await supabase
      .from('user_session_credits')
      .select('*')
      .eq('user_id', userId)

    if (allError) {
      console.error('Error fetching all credits:', allError)
      return null
    }

    // Get available credits
    const { data: availableCredits, error: availableError } = await supabase
      .from('user_session_credits')
      .select('*')
      .eq('user_id', userId)
      .is('used_at', null)
      .or('expires_at.is.null,expires_at.gt.now()')

    if (availableError) {
      console.error('Error fetching available credits:', availableError)
      return null
    }

    // Get total spent
    const { data: purchases, error: purchasesError } = await supabase
      .from('user_purchases')
      .select('amount_paid')
      .eq('user_id', userId)

    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError)
      return null
    }

    const totalSpent = purchases?.reduce((sum, p) => sum + p.amount_paid, 0) || 0

    // Calculate credits
    const totalCredits = allCredits?.length || 0
    const freeCredits = availableCredits?.filter(c => c.is_free_credit).length || 0
    const paidCredits = availableCredits?.filter(c => !c.is_free_credit).length || 0
    const creditsUsed = allCredits?.filter(c => c.used_at !== null).length || 0
    const creditsAvailable = freeCredits + paidCredits

    // Find next expiring credit
    const expiringCredits = availableCredits
      ?.filter(c => c.expires_at !== null)
      .sort((a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime())

    let nextExpiringCredit = undefined
    if (expiringCredits && expiringCredits.length > 0) {
      const credit = expiringCredits[0]
      const expiryDate = new Date(credit.expires_at)
      const now = new Date()
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      nextExpiringCredit = {
        id: credit.id,
        expires_at: credit.expires_at,
        days_until_expiry: daysUntilExpiry
      }
    }

    return {
      total_credits: totalCredits,
      free_credits: freeCredits,
      paid_credits: paidCredits,
      credits_used: creditsUsed,
      credits_available: creditsAvailable,
      total_spent_kobo: totalSpent,
      next_expiring_credit: nextExpiringCredit
    }
  } catch (error) {
    console.error('Error getting credit balance:', error)
    return null
  }
}

// Get user's credit usage history
export async function getUserCreditUsage(userId: string, limit: number = 50): Promise<CreditUsage[]> {
  try {
    const { data, error } = await supabase
      .from('user_session_credits')
      .select(`
        id,
        user_id,
        session_id,
        session_duration_minutes,
        is_free_credit,
        used_at,
        sessions:session_id (
          session_title,
          status,
          therapists:therapist_id (
            full_name
          )
        )
      `)
      .eq('user_id', userId)
      .not('used_at', 'is', null)
      .order('used_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching credit usage:', error)
      return []
    }

    return data?.map(credit => ({
      id: credit.id,
      user_id: credit.user_id,
      session_id: credit.session_id,
      credit_id: credit.id,
      session_duration_minutes: credit.session_duration_minutes,
      is_free_credit: credit.is_free_credit,
      used_at: credit.used_at,
      session_title: credit.sessions?.session_title,
      therapist_name: credit.sessions?.therapists?.full_name,
      session_status: credit.sessions?.status
    })) || []
  } catch (error) {
    console.error('Error getting credit usage:', error)
    return []
  }
}

// Get credit analytics for user
export async function getUserCreditAnalytics(userId: string): Promise<CreditAnalytics | null> {
  try {
    // Get all user sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        id,
        status,
        scheduled_at,
        therapist_id,
        credit_used_id,
        therapists:therapist_id (
          full_name
        )
      `)
      .eq('user_id', userId)

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
      return null
    }

    // Get all purchases
    const { data: purchases, error: purchasesError } = await supabase
      .from('user_purchases')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError)
      return null
    }

    // Calculate statistics
    const totalSessionsBooked = sessions?.length || 0
    const totalSessionsCompleted = sessions?.filter(s => s.status === 'completed').length || 0
    const totalSessionsCancelled = sessions?.filter(s => s.status === 'cancelled').length || 0
    const totalAmountSpent = purchases?.reduce((sum, p) => sum + p.amount_paid, 0) || 0
    const averageSessionCost = totalSessionsCompleted > 0 ? totalAmountSpent / totalSessionsCompleted : 0

    // Find most used therapist
    const therapistCounts: Record<string, { name: string; count: number }> = {}
    sessions?.forEach(session => {
      if (session.therapist_id && session.therapists) {
        const therapistId = session.therapist_id
        const therapistName = session.therapists.full_name
        if (!therapistCounts[therapistId]) {
          therapistCounts[therapistId] = { name: therapistName, count: 0 }
        }
        therapistCounts[therapistId].count++
      }
    })

    const mostUsedTherapist = Object.values(therapistCounts)
      .sort((a, b) => b.count - a.count)[0]?.name

    // Calculate monthly breakdown
    const monthlyData: Record<string, { purchased: number; used: number; spent: number }> = {}

    purchases?.forEach(purchase => {
      const month = new Date(purchase.created_at).toISOString().slice(0, 7) // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { purchased: 0, used: 0, spent: 0 }
      }
      monthlyData[month].purchased += purchase.sessions_credited
      monthlyData[month].spent += purchase.amount_paid
    })

    sessions?.forEach(session => {
      if (session.status === 'completed') {
        const month = new Date(session.scheduled_at).toISOString().slice(0, 7)
        if (!monthlyData[month]) {
          monthlyData[month] = { purchased: 0, used: 0, spent: 0 }
        }
        monthlyData[month].used += 1
      }
    })

    const creditsByMonth = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        credits_purchased: data.purchased,
        credits_used: data.used,
        amount_spent: data.spent
      }))

    return {
      total_sessions_booked: totalSessionsBooked,
      total_sessions_completed: totalSessionsCompleted,
      total_sessions_cancelled: totalSessionsCancelled,
      total_amount_spent: totalAmountSpent,
      average_session_cost: averageSessionCost,
      most_used_therapist: mostUsedTherapist,
      credits_by_month: creditsByMonth
    }
  } catch (error) {
    console.error('Error getting credit analytics:', error)
    return null
  }
}

// Get available credits for booking
export async function getAvailableCreditsForBooking(userId: string): Promise<{
  hasCredits: boolean
  credits: any[]
  message: string
}> {
  try {
    const { data: credits, error } = await supabase
      .from('user_session_credits')
      .select('*')
      .eq('user_id', userId)
      .is('used_at', null)
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('is_free_credit', { ascending: false }) // Use free credits first
      .order('created_at', { ascending: true }) // FIFO

    if (error) {
      console.error('Error fetching available credits:', error)
      return {
        hasCredits: false,
        credits: [],
        message: 'Error checking credits'
      }
    }

    if (!credits || credits.length === 0) {
      return {
        hasCredits: false,
        credits: [],
        message: 'No credits available. Please purchase a package.'
      }
    }

    return {
      hasCredits: true,
      credits: credits,
      message: `You have ${credits.length} credit${credits.length > 1 ? 's' : ''} available`
    }
  } catch (error) {
    console.error('Error getting available credits:', error)
    return {
      hasCredits: false,
      credits: [],
      message: 'Error checking credits'
    }
  }
}

// Use a credit for a session
export async function useCreditForSession(creditId: string, sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_session_credits')
      .update({
        session_id: sessionId,
        used_at: new Date().toISOString()
      })
      .eq('id', creditId)
      .is('used_at', null) // Only update if not already used

    if (error) {
      console.error('Error using credit:', error)
      return false
    }

    // Also update the session to link to the credit
    await supabase
      .from('sessions')
      .update({
        credit_used_id: creditId
      })
      .eq('id', sessionId)

    return true
  } catch (error) {
    console.error('Error using credit:', error)
    return false
  }
}

// Release credit (e.g., when session is cancelled)
export async function releaseCreditFromSession(sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_session_credits')
      .update({
        session_id: null,
        used_at: null
      })
      .eq('session_id', sessionId)

    if (error) {
      console.error('Error releasing credit:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error releasing credit:', error)
    return false
  }
}

// Format currency for display
export function formatCurrency(kobo: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(kobo / 100)
}

// Format date for display
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Calculate days until expiry
export function getDaysUntilExpiry(expiryDate: string): number {
  const expiry = new Date(expiryDate)
  const now = new Date()
  const diffTime = expiry.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

