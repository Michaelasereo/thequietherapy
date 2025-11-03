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

    if (!sessionId || sessionId === 'null' || sessionId === 'undefined') {
      console.error('❌ Session notes API: Invalid sessionId provided:', sessionId);
      return NextResponse.json(
        { 
          success: false,
          error: 'Session ID is required',
          details: 'Please provide a valid session ID'
        },
        { status: 400 }
      );
    }

    console.log(`📝 Fetching notes for session: ${sessionId}`);

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
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      console.error('Error fetching session data:', sessionError);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Fetch therapist information separately
    let therapistData = null;
    if (sessionData.therapist_id) {
      const { data: therapist } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('id', sessionData.therapist_id)
        .single();
      therapistData = therapist;
    }

    // Fetch user information separately
    let userData = null;
    if (sessionData.user_id) {
      const { data: user } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('id', sessionData.user_id)
        .single();
      userData = user;
    }

    // Combine the data
    const enrichedSession = {
      ...sessionData,
      therapist: therapistData,
      user: userData
    };

    console.log('✅ Enriched session data:', {
      sessionId: enrichedSession.id,
      therapist: therapistData,
      user: userData
    });

    // Build SOAP notes object from individual fields if needed
    let enrichedNotes = notesData
    if (notesData && (notesData.soap_subjective || notesData.soap_objective || notesData.soap_assessment || notesData.soap_plan)) {
      enrichedNotes = {
        ...notesData,
        soap_notes: {
          subjective: notesData.soap_subjective || '',
          objective: notesData.soap_objective || '',
          assessment: notesData.soap_assessment || '',
          plan: notesData.soap_plan || ''
        }
      }
    }

    return NextResponse.json({
      success: true,
      session: enrichedSession,
      notes: enrichedNotes || null,
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

    console.log(`📝 Updating notes for session: ${sessionId}`, {
      hasNotes: notes !== undefined,
      hasTherapistNotes: therapistNotes !== undefined,
      hasPatientNotes: patientNotes !== undefined,
      hasSoapNotes: soapNotes !== undefined
    });

    // First, get session details to ensure it exists and get therapist/user IDs
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('id, therapist_id, user_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      console.error('❌ Session not found:', sessionError);
      return NextResponse.json(
        { error: 'Session not found', details: sessionError?.message },
        { status: 404 }
      );
    }

    // Check if session_notes record already exists
    const { data: existingNotes, error: checkError } = await supabase
      .from('session_notes')
      .select('id, therapist_id, user_id')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing notes:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing notes', details: checkError.message },
        { status: 500 }
      );
    }

    // Prepare notes data
    const notesData: any = {
      session_id: sessionId,
      updated_at: new Date().toISOString()
    };

    // If this is a new record and therapist_id/user_id are required, include them
    if (!existingNotes && sessionData.therapist_id && sessionData.user_id) {
      // Check if the table has these columns by trying to include them
      // Some table schemas require these fields
      notesData.therapist_id = sessionData.therapist_id;
      notesData.user_id = sessionData.user_id;
    } else if (existingNotes) {
      // For updates, preserve existing IDs if they exist
      if (existingNotes.therapist_id) notesData.therapist_id = existingNotes.therapist_id;
      if (existingNotes.user_id) notesData.user_id = existingNotes.user_id;
    }

    // Only update fields that are provided (not undefined)
    // Handle notes - use the notes column since therapist_notes/patient_notes columns may not exist
    if (notes !== undefined) {
      notesData.notes = notes;
    } else if (therapistNotes !== undefined) {
      // Store therapist notes in the notes column (since therapist_notes column doesn't exist)
      notesData.notes = therapistNotes;
    } else if (patientNotes !== undefined) {
      // Store patient notes in the notes column (since patient_notes column doesn't exist)
      notesData.notes = patientNotes;
    }
    
    // Note: We don't set therapist_notes or patient_notes because those columns
    // don't exist in the current table schema. If you need separate columns,
    // you'll need to add them to the database first.
    
    // Handle SOAP notes - convert object to JSONB if needed
    if (soapNotes !== undefined) {
      if (typeof soapNotes === 'object' && soapNotes !== null) {
        // If it's an object, store as JSONB
        notesData.soap_notes = soapNotes;
      } else if (typeof soapNotes === 'string') {
        // If it's a string, try to parse it or store as-is
        try {
          notesData.soap_notes = JSON.parse(soapNotes);
        } catch {
          notesData.soap_notes = soapNotes;
        }
      } else {
        notesData.soap_notes = soapNotes;
      }
    }

    console.log('📦 Prepared notes data:', {
      session_id: notesData.session_id,
      fieldsToUpdate: Object.keys(notesData).filter(k => k !== 'session_id' && k !== 'updated_at')
    });

    // Use update if record exists, otherwise insert
    let notesResult, notesError;

    if (existingNotes) {
      // Update existing record
      console.log('🔄 Updating existing session notes record');
      const updateData = { ...notesData };
      delete updateData.session_id; // Don't update session_id
      
      const { data, error } = await supabase
        .from('session_notes')
        .update(updateData)
        .eq('session_id', sessionId)
        .select()
        .single();
      
      notesResult = data;
      notesError = error;
    } else {
      // Insert new record
      console.log('➕ Inserting new session notes record');
      const insertData = {
        ...notesData,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('session_notes')
        .insert(insertData)
        .select()
        .single();
      
      notesResult = data;
      notesError = error;
    }

    if (notesError) {
      console.error('❌ Error updating session notes:', {
        error: notesError,
        code: notesError.code,
        message: notesError.message,
        details: notesError.details,
        hint: notesError.hint
      });
      return NextResponse.json(
        { 
          error: 'Failed to update session notes',
          details: notesError.message,
          code: notesError.code,
          hint: notesError.hint
        },
        { status: 500 }
      );
    }

    console.log('✅ Session notes updated successfully:', notesResult?.id);

    return NextResponse.json({
      success: true,
      notes: notesResult,
      message: 'Session notes updated successfully'
    });

  } catch (error) {
    console.error('❌ Error in session notes POST API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update session notes',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
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