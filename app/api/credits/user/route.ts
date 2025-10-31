import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireApiAuth } from '@/lib/server-auth'
import { handleApiError, successResponse } from '@/lib/api-response'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Credits API called')
    // Authentication check
    const authResult = await requireApiAuth(['individual'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { session } = authResult
    const userId = session.user.id
    console.log('🔍 User ID:', userId)

    // Get user's current credits (check both 'individual' and 'user' types)
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .in('user_type', ['individual', 'user'])

    console.log('🔍 Credits query result:', { credits, creditsError })

    if (creditsError) {
      console.error('❌ Error fetching credits:', creditsError)
      throw new Error('Failed to fetch credits')
    }

    // Calculate total available credits from user_credits table
    let totalCredits = credits?.reduce((sum, credit) => sum + credit.credits_balance, 0) || 0
    console.log('🔍 Total credits calculated:', totalCredits)

    // Get credit history
    const { data: creditHistory, error: historyError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (historyError) {
      console.error('❌ Error fetching credit history:', historyError)
    }

    // Get payment history
    const { data: paymentHistory, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'success')
      .order('created_at', { ascending: false })
      .limit(10)

    if (paymentError) {
      console.error('❌ Error fetching payment history:', paymentError)
    }

    const response = successResponse({
      total_credits: totalCredits,
      active_credits: credits || [],
      credit_history: creditHistory || [],
      payment_history: paymentHistory || [],
      next_session_duration: totalCredits > 0 ? 35 : 25, // 35 min for paid, 25 min for free
      timestamp: new Date().toISOString() // Add timestamp to prevent caching
    })
    
    // Add cache-busting headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response

  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authResult = await requireApiAuth(['individual'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { session } = authResult
    const userId = session.user.id

    const { action, session_id, amount } = await request.json()

    if (action === 'add_test_credits') {
      // Add test credits for development/testing
      const creditsToAdd = amount || 10
      
      console.log(`🔧 Adding ${creditsToAdd} test credits to user: ${userId}`)
      
      const { data: newCredits, error: insertError } = await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          user_type: 'user',
          credits_balance: creditsToAdd,
          credits_purchased: creditsToAdd,
          credits_used: 0,
          credits_expired: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
      
      if (insertError) {
        console.error('❌ Error adding test credits:', insertError)
        throw new Error('Failed to add test credits')
      }
      
      console.log('✅ Test credits added successfully:', newCredits)
      
      return successResponse({
        success: true,
        credits_added: creditsToAdd,
        message: `Successfully added ${creditsToAdd} test credits`
      })
    }

    if (action === 'use_credit') {
      if (!session_id) {
        throw new Error('Session ID is required to use credit')
      }

      // Find an available credit to use (check both 'individual' and 'user' types)
      const { data: availableCredits, error: creditsError } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .in('user_type', ['individual', 'user'])
        .gt('credits_balance', 0)
        .order('created_at', { ascending: true }) // Use oldest credits first
        .limit(1)

      if (creditsError || !availableCredits || availableCredits.length === 0) {
        throw new Error('No available credits found')
      }

      const credit = availableCredits[0]

      // Deduct one credit
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({
          credits_balance: credit.credits_balance - 1,
          credits_used: credit.credits_used + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', credit.id)

      if (updateError) {
        throw new Error('Failed to deduct credit')
      }

      // Record credit usage
      await supabase
        .from('credit_usage')
        .insert({
          user_id: userId,
          credit_id: credit.id,
          session_id: session_id,
          credits_used: 1,
          created_at: new Date().toISOString()
        })

      console.log('✅ Credit used for session:', session_id)

      return successResponse({
        success: true,
        credits_remaining: credit.credits_remaining - 1,
        message: 'Credit used successfully'
      })
    }

    throw new Error('Invalid action')

  } catch (error) {
    return handleApiError(error)
  }
}