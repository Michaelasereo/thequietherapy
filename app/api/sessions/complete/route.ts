import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, notes, recordingUrl } = body;

    console.log('🔍 Completing session manually:', { sessionId, notes, recordingUrl });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Complete the session
    const updateData: any = {
      status: 'completed',
      updated_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    };

    if (notes) {
      updateData.notes = notes;
    }

    if (recordingUrl) {
      updateData.recording_url = recordingUrl;
    }

    const { error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (error) {
      console.error('❌ Error completing session:', error);
      return NextResponse.json(
        { error: 'Failed to complete session' },
        { status: 500 }
      );
    }

    console.log('✅ Session completed successfully:', sessionId);

    // Generate AI SOAP notes using REAL transcript
    try {
      console.log('🧠 Generating AI SOAP notes for session:', sessionId);
      
      // ✅ FETCH REAL TRANSCRIPT FROM DATABASE
      const { data: sessionNote, error: noteError } = await supabase
        .from('session_notes')
        .select('transcript')
        .eq('session_id', sessionId)
        .single();

      // Check if transcript exists
      if (noteError || !sessionNote?.transcript) {
        console.warn('⚠️ No transcript found for session:', sessionId);
        console.warn('Error:', noteError);
        
        return NextResponse.json({
          success: true,
          message: 'Session completed but no transcript available for SOAP notes',
          noTranscript: true,
          warning: 'Session may not have been recorded or transcription failed'
        });
      }

      const realTranscript = sessionNote.transcript;
      console.log('✅ Retrieved transcript:', realTranscript.substring(0, 100) + '...');
      console.log('📝 Transcript length:', realTranscript.length, 'characters');

      // Import AI service
      const { generateSOAPNotes } = await import('@/lib/ai');
      
      // Get session data for context
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('user_id, therapist_id')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        console.error('❌ Failed to fetch session data:', sessionError);
        throw new Error('Failed to fetch session data');
      }

      // ✅ GENERATE SOAP NOTES WITH REAL TRANSCRIPT
      const soapResult = await generateSOAPNotes(realTranscript, {
        id: sessionId,
        user_id: sessionData.user_id,
        therapist_id: sessionData.therapist_id
      });
      
      if (soapResult.success && soapResult.soapNotes) {
        // Update session with SOAP notes
        const { error: soapError } = await supabase
          .from('sessions')
          .update({ 
            soap_notes: soapResult.soapNotes,
            ai_notes_generated: true,
            ai_notes_generated_at: new Date().toISOString()
          })
          .eq('id', sessionId);

        if (soapError) {
          console.error('❌ Error saving SOAP notes:', soapError);
          return NextResponse.json({
            success: true,
            message: 'Session completed but SOAP notes failed to save',
            soapNotesError: soapError.message
          });
        } else {
          console.log('✅ SOAP notes generated and saved successfully');
          return NextResponse.json({
            success: true,
            message: 'Session completed and SOAP notes generated successfully',
            soapNotes: soapResult.soapNotes
          });
        }
      } else {
        console.error('❌ SOAP notes generation failed:', soapResult.error);
        return NextResponse.json({
          success: true,
          message: 'Session completed but SOAP notes generation failed',
          soapNotesError: soapResult.error
        });
      }
    } catch (aiError) {
      console.error('❌ Error generating AI SOAP notes:', aiError);
      return NextResponse.json({
        success: true,
        message: 'Session completed but AI SOAP notes generation failed',
        aiError: aiError instanceof Error ? aiError.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('❌ Session completion API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}