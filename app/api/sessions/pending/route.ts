import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireApiAuth } from '@/lib/server-auth'
import { successResponse, handleApiError } from '@/lib/api-response'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authResult = await requireApiAuth(['individual'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { session } = authResult
    const userId = session.user.id

    // 2. Fetch pending approval sessions
    const { data: pendingSessions, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        *,
        therapist:therapist_id (
          id,
          full_name,
          email
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false })

    if (sessionsError) {
      console.error('❌ Error fetching pending sessions:', sessionsError)
      return NextResponse.json(
        { error: 'Failed to fetch pending sessions' },
        { status: 500 }
      )
    }

    return successResponse({
      sessions: pendingSessions || []
    })

  } catch (error) {
    console.error('❌ Error fetching pending sessions:', error)
    return handleApiError(error)
  }
}

