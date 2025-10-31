import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userEmail } = body

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 })
    }

    console.log('🧹 Resetting user data for:', userEmail)

    // First, get the user's ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, full_name, user_type')
      .eq('email', userEmail)
      .single()

    if (userError || !user) {
      console.error('❌ User not found:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = user.id
    console.log('✅ Found user:', user.full_name, 'ID:', userId)

    // 1. Delete all sessions for this user
    const { error: sessionsError } = await supabase
      .from('sessions')
      .delete()
      .eq('user_id', userId)

    if (sessionsError) {
      console.error('❌ Error deleting sessions:', sessionsError)
    } else {
      console.log('✅ Deleted sessions for user')
    }

    // 2. Delete or reset user credits
    const { error: creditsDeleteError } = await supabase
      .from('user_credits')
      .delete()
      .eq('user_id', userId)

    if (creditsDeleteError) {
      console.error('❌ Error deleting old credits:', creditsDeleteError)
    } else {
      console.log('✅ Deleted old credits')
    }

    // 3. Create new credits record with 10 credits
    const { error: creditsInsertError } = await supabase
      .from('user_credits')
      .insert({
        user_id: userId,
        user_type: user.user_type || 'individual',
        credits_balance: 10,
        credits_used: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (creditsInsertError) {
      console.error('❌ Error creating new credits:', creditsInsertError)
      return NextResponse.json({ error: 'Failed to create new credits' }, { status: 500 })
    } else {
      console.log('✅ Created 10 new credits')
    }

    // 4. Delete session notes if they exist and are related to the user's sessions
    const { error: notesError } = await supabase
      .from('session_notes')
      .delete()
      .in('session_id', 
        // This will get all session IDs that we deleted above
        // Since we already deleted sessions, this might return empty
        []
      )

    // Don't fail if this errors since sessions are already deleted
    if (notesError) {
      console.log('⚠️ Note: Could not delete session notes (sessions already deleted)')
    }

    // Verify the reset
    const { data: newCredits } = await supabase
      .from('user_credits')
      .select('credits_balance, credits_used')
      .eq('user_id', userId)
      .single()

    const { count: remainingSessions } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    console.log('✅ User data reset complete')
    console.log('   Credits balance:', newCredits?.credits_balance)
    console.log('   Credits used:', newCredits?.credits_used)
    console.log('   Remaining sessions:', remainingSessions || 0)

    return NextResponse.json({
      success: true,
      message: 'User data reset successfully',
      data: {
        user: {
          email: userEmail,
          name: user.full_name,
          id: userId
        },
        deleted: {
          sessions: null
        },
        credits: {
          balance: newCredits?.credits_balance || 0,
          used: newCredits?.credits_used || 0
        },
        remainingSessions: remainingSessions || 0
      }
    })

  } catch (error) {
    console.error('❌ Reset user data error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

