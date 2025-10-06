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
    const authResult = await requireApiAuth(['individual', 'partner'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { session } = authResult
    const userId = session.user.id

    // Get payments history
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError)
      throw new Error('Failed to fetch payment history')
    }

    return successResponse({
      payments: payments || []
    })

  } catch (error) {
    return handleApiError(error)
  }
}

