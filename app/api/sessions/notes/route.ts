import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch session notes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching notes for session: ${sessionId}`);

    // Get session notes
    const { data: notesData, error: notesError } = await supabase
      .from('session_notes')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (notesError && notesError.code !== 'PGRST116') {
      console.error('Error fetching session notes:', notesError);
      return NextResponse.json(
        { error: 'Failed to fetch session notes' },
        { status: 500 }
      );
    }

    // Get session details
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        id,
        user_id,
        therapist_id,
        duration,
        session_type,
        status,
        users:user_id(full_name, email),
        therapist:therapist_id(full_name, email)
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      console.error('Error fetching session data:', sessionError);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session: sessionData,
      notes: notesData || null,
      message: 'Session notes fetched successfully'
    });

  } catch (error) {
    console.error('Error in session notes GET API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch session notes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create or update session notes
export async function POST(request: NextRequest) {
  try {
    const { sessionId, notes, therapistNotes, patientNotes, soapNotes } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log(`Updating notes for session: ${sessionId}`);

    // Prepare notes data
    const notesData: any = {
      session_id: sessionId,
      updated_at: new Date().toISOString()
    };

    if (notes !== undefined) notesData.notes = notes;
    if (therapistNotes !== undefined) notesData.therapist_notes = therapistNotes;
    if (patientNotes !== undefined) notesData.patient_notes = patientNotes;
    if (soapNotes !== undefined) notesData.soap_notes = soapNotes;

    // Upsert session notes
    const { data: notesResult, error: notesError } = await supabase
      .from('session_notes')
      .upsert(notesData, {
        onConflict: 'session_id'
      })
      .select()
      .single();

    if (notesError) {
      console.error('Error updating session notes:', notesError);
      return NextResponse.json(
        { error: 'Failed to update session notes' },
        { status: 500 }
      );
    }

    console.log('Session notes updated successfully');

    return NextResponse.json({
      success: true,
      notes: notesResult,
      message: 'Session notes updated successfully'
    });

  } catch (error) {
    console.error('Error in session notes POST API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update session notes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}