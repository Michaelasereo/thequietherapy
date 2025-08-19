import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch session notes
    const { data: notes, error } = await supabase
      .from('session_notes')
      .select('*')
      .eq('session_id', id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching session notes:', error)
      return NextResponse.json({ error: 'Failed to fetch session notes' }, { status: 500 })
    }

    return NextResponse.json({ notes: notes || null })
  } catch (error) {
    console.error('Error in GET session notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const { notes, mood_rating, progress_notes, homework_assigned, next_session_focus } = body

    // Get session details to get therapist_id and user_id
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('therapist_id, user_id')
      .eq('id', id)
      .single()

    if (sessionError) {
      console.error('Error fetching session:', sessionError)
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Check if notes already exist
    const { data: existingNotes } = await supabase
      .from('session_notes')
      .select('id')
      .eq('session_id', id)
      .single()

    let result
    if (existingNotes) {
      // Update existing notes
      const { data, error } = await supabase
        .from('session_notes')
        .update({
          notes,
          mood_rating,
          progress_notes,
          homework_assigned,
          next_session_focus,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating session notes:', error)
        return NextResponse.json({ error: 'Failed to update session notes' }, { status: 500 })
      }

      result = data
    } else {
      // Create new notes
      const { data, error } = await supabase
        .from('session_notes')
        .insert({
          session_id: id,
          therapist_id: session.therapist_id,
          user_id: session.user_id,
          notes,
          mood_rating,
          progress_notes,
          homework_assigned,
          next_session_focus
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating session notes:', error)
        return NextResponse.json({ error: 'Failed to create session notes' }, { status: 500 })
      }

      result = data
    }

    return NextResponse.json({ notes: result })
  } catch (error) {
    console.error('Error in POST session notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
