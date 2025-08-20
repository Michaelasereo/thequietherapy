import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      session_id, 
      transcript, 
      ai_generated, 
      mood_rating, 
      progress_notes, 
      homework_assigned,
      therapist_id,
      user_id 
    } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'Missing required field: session_id' },
        { status: 400 }
      );
    }

    console.log(`Creating session note for session: ${session_id}`);

    // Create session note in database
    const { data, error } = await supabase
      .from('session_notes')
      .insert({
        session_id,
        transcript: transcript || null,
        ai_generated: ai_generated || false,
        mood_rating: mood_rating || null,
        progress_notes: progress_notes || null,
        homework_assigned: homework_assigned || null,
        therapist_id: therapist_id || '550e8400-e29b-41d4-a716-446655440002', // Default therapist ID
        user_id: user_id || '550e8400-e29b-41d4-a716-446655440001', // Default user ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session note:', error);
      return NextResponse.json(
        { error: 'Failed to create session note', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session note created successfully',
      session_note: data
    });

  } catch (error) {
    console.error('Error in session notes API:', error);
    return NextResponse.json(
      { 
        error: 'Session note creation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');
    const therapistId = searchParams.get('therapistId');

    let query = supabase.from('session_notes').select('*');

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    } else if (userId) {
      query = query.eq('user_id', userId);
    } else if (therapistId) {
      query = query.eq('therapist_id', therapistId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching session notes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch session notes', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session_notes: data,
      count: data?.length || 0
    });

  } catch (error) {
    console.error('Error in session notes API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch session notes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
