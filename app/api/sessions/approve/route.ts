import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireApiAuth } from '@/lib/server-auth'
import { successResponse, handleApiError, NotFoundError, ValidationError } from '@/lib/api-response'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authResult = await requireApiAuth(['individual'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { session: authSession } = authResult
    const userId = authSession.user.id

    // 2. Parse request body
    const body = await request.json()
    const { session_id } = body

    if (!session_id) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // 3. Verify session exists and is pending approval
    const { data: sessionRecord, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', userId)
      .eq('status', 'pending_approval')
      .single()

    if (sessionError || !sessionRecord) {
      return NextResponse.json(
        { error: 'Session not found or not pending approval' },
        { status: 404 }
      )
    }

    // 4. Check user has credits
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .in('user_type', ['individual', 'user'])
      .gt('credits_balance', 0)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (creditsError) {
      console.error('❌ Error checking credits:', creditsError)
      throw new Error('Error checking user credits')
    }

    if (!userCredits || userCredits.credits_balance < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please purchase credits to approve this session.' },
        { status: 402 }
      )
    }

    // 5. Use the database function to approve and deduct credit atomically
    let finalApprovedSession: any | null = null

    const { data: approvedSession, error: approveError } = await supabase
      .rpc('approve_session_and_deduct_credit', {
        p_session_id: session_id,
        p_user_id: userId
      })

    if (approveError || !approvedSession) {
      console.error('❌ Error approving session:', approveError)
      
      // Handle specific errors
      if (approveError && approveError.message.includes('Insufficient credits')) {
        return NextResponse.json(
          { error: 'Insufficient credits to approve this session' },
          { status: 402 }
        )
      }
      
      if (approveError && (approveError.message.includes('not found') || approveError.message.includes('not pending'))) {
        return NextResponse.json(
          { error: 'Session not found or not pending approval' },
          { status: 404 }
        )
      }

      // Fallback: If RPC function is missing in DB, perform approval and credit deduction inline
      if (
        !approvedSession ||
        (approveError && (
          approveError.message.includes('function') ||
          approveError.message.includes('does not exist') ||
          approveError.code === '42883'
        ))
      ) {
        try {
          // Instant sessions go directly to 'in_progress', regular sessions to 'scheduled'
          const newStatus = sessionRecord.is_instant ? 'in_progress' : 'scheduled'

          // 1) Update session status if still pending
          const { data: updatedSession, error: updErr } = await supabase
            .from('sessions')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', session_id)
            .eq('user_id', userId)
            .eq('status', 'pending_approval')
            .select('*')
            .single()

          if (updErr || !updatedSession) {
            return NextResponse.json({ error: 'Failed to approve session' }, { status: 500 })
          }

          // 2) Deduct one credit
          const { data: updatedCredits, error: creditUpdErr } = await supabase
            .from('user_credits')
            .update({
              credits_balance: (userCredits.credits_balance || 0) - 1,
              credits_used: (userCredits.credits_used || 0) + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', (userCredits as any).id)
            .select('*')
            .single()

          if (creditUpdErr || !updatedCredits) {
            // Attempt to revert session to pending_approval
            await supabase
              .from('sessions')
              .update({ status: 'pending_approval', updated_at: new Date().toISOString() })
              .eq('id', session_id)
              .eq('user_id', userId)

            return NextResponse.json({ error: 'Failed to deduct credits' }, { status: 500 })
          }

          // Set final session for response
          finalApprovedSession = updatedSession

          // Continue to room creation as below if needed
        } catch (fallbackErr) {
          console.error('❌ Fallback approval failed:', fallbackErr)
          return NextResponse.json({ error: 'Failed to approve session (fallback)', details: String(fallbackErr) }, { status: 500 })
        }
      } else {
        return NextResponse.json(
          { 
            error: 'Failed to approve session',
            details: approveError?.message || 'Unknown error' 
          },
          { status: 500 }
        )
      }
    }

    const approvedSessionData = finalApprovedSession || (Array.isArray(approvedSession) ? approvedSession[0] : approvedSession)

    if (!approvedSessionData) {
      return NextResponse.json(
        { error: 'Failed to approve session - no data returned' },
        { status: 500 }
      )
    }

    // 6. Create Daily.co room if it doesn't exist (for non-instant sessions)
    if (!approvedSessionData.session_url && !approvedSessionData.daily_room_url && !sessionRecord.is_instant) {
      try {
        const { createTherapySessionRoom } = await import('@/lib/daily')
        
        const { data: therapist } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', sessionRecord.therapist_id)
          .single()

        const { data: user } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', userId)
          .single()

        const room = await createTherapySessionRoom({
          sessionId: session_id,
          therapistName: therapist?.full_name || 'Therapist',
          patientName: user?.full_name || 'Patient',
          duration: sessionRecord.duration_minutes || 30,
          scheduledTime: new Date(approvedSessionData.start_time || sessionRecord.start_time)
        })

        // Update session with room URL
        await supabase
          .from('sessions')
          .update({ 
            session_url: room.url,
            room_name: room.name,
            daily_room_url: room.url,
            daily_room_name: room.name
          })
          .eq('id', session_id)

        console.log('✅ Daily.co room created:', room.name)
      } catch (roomError) {
        console.error('❌ Failed to create Daily.co room:', roomError)
        // Don't fail the approval if room creation fails
      }
    }

    console.log('✅ Session approved successfully:', session_id)

    return successResponse({
      session: {
        ...approvedSessionData,
        credits_balance_after: (userCredits.credits_balance || 1) - 1
      },
      message: sessionRecord.is_instant
        ? 'Session approved! You can join immediately.'
        : 'Session approved successfully.'
    })

  } catch (error) {
    console.error('❌ Error approving session:', error)
    return handleApiError(error)
  }
}

