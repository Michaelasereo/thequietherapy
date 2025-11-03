import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, notes, recordingUrl, transcript } = body;

    console.log('🔍 Completing session manually:', { sessionId, notes, recordingUrl, hasTranscript: !!transcript });

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
      
      // ✅ USE TRANSCRIPT IF PROVIDED, OTHERWISE FETCH FROM DATABASE
      let realTranscript = transcript;
      
      if (!realTranscript) {
        console.log('📥 Transcript not provided, fetching from database...');
        
        // Try fetching from database with retry logic
        let sessionNote = null;
        let noteError = null;
        
        // Retry up to 5 times with delays (to handle race conditions with transcription)
        for (let attempt = 0; attempt < 5; attempt++) {
          if (attempt > 0) {
            console.log(`⏳ Retry attempt ${attempt + 1} after 2 second delay...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
          const { data, error } = await supabase
            .from('session_notes')
            .select('transcript')
            .eq('session_id', sessionId)
            .single();
          
          if (data?.transcript) {
            sessionNote = data;
            break;
          }
          noteError = error;
        }

        if (sessionNote?.transcript) {
          realTranscript = sessionNote.transcript;
        } else {
          console.warn('⚠️ No transcript found for session after retries:', sessionId);
          console.warn('Error:', noteError);
          
          // Fallback: create a basic session_notes entry and notify therapist so they still get meeting details
          const { data: sessMeta, error: sessMetaErr } = await supabase
            .from('sessions')
            .select('user_id, therapist_id')
            .eq('id', sessionId)
            .single();

          if (!sessMetaErr && sessMeta) {
            // Ensure a minimal notes record exists
            await supabase
              .from('session_notes')
              .upsert({
                session_id: sessionId,
                therapist_id: sessMeta.therapist_id,
                user_id: sessMeta.user_id,
                notes: notes || '',
                ai_generated: false,
                transcript: null,
              });

            // Notify therapist that session is completed and notes can be added/reviewed
            await supabase
              .from('notifications')
              .insert({
                user_id: sessMeta.therapist_id,
                title: 'Session completed',
                message: 'Your session has ended. Review or add SOAP notes.',
                type: 'session_completed',
                data: { session_id: sessionId }
              });
          }

          return NextResponse.json({
            success: true,
            message: 'Session completed. No transcript found; created placeholder notes and notified therapist.',
            noTranscript: true
          });
        }
      }
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

      console.log('🤖 Starting SOAP notes generation...');
      console.log('📊 Session data:', { sessionId, userId: sessionData.user_id, therapistId: sessionData.therapist_id });

      // ✅ GENERATE SOAP NOTES WITH REAL TRANSCRIPT
      const soapResult = await generateSOAPNotes(realTranscript, {
        id: sessionId,
        user_id: sessionData.user_id,
        therapist_id: sessionData.therapist_id
      });

      console.log('🤖 SOAP notes generation result:', {
        success: soapResult.success,
        hasSoapNotes: !!soapResult.soapNotes,
        error: soapResult.error,
        provider: soapResult.provider
      });
      
      if (soapResult.success && soapResult.soapNotes) {
        console.log('✅ SOAP notes generated successfully, saving to database...');
        
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
          console.error('❌ Error saving SOAP notes to sessions table:', soapError);
        } else {
          console.log('✅ SOAP notes saved to sessions table');
        }

        // Also update session_notes table with SOAP notes
        const { error: notesError } = await supabase
          .from('session_notes')
          .upsert({
            session_id: sessionId,
            therapist_id: sessionData.therapist_id,
            user_id: sessionData.user_id,
            soap_notes: soapResult.soapNotes,
            transcript: realTranscript,
            ai_generated: true,
            ai_notes_generated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'session_id'
          });

        if (notesError) {
          console.error('❌ Error saving SOAP notes to session_notes table:', notesError);
        } else {
          console.log('✅ SOAP notes saved to session_notes table');
        }

        if (soapError || notesError) {
          console.error('⚠️ SOAP notes generation succeeded but saving failed');
          return NextResponse.json({
            success: true,
            message: 'Session completed but SOAP notes failed to save',
            soapNotesError: soapError?.message || notesError?.message
          });
        } else {
          console.log('✅✅ SOAP notes generated and saved successfully to both tables');
          console.log('📝 SOAP notes preview:', typeof soapResult.soapNotes === 'string' 
            ? soapResult.soapNotes.substring(0, 200) 
            : JSON.stringify(soapResult.soapNotes).substring(0, 200));
          
          return NextResponse.json({
            success: true,
            message: 'Session completed and SOAP notes generated successfully',
            soapNotes: soapResult.soapNotes
          });
        }
      } else {
        console.error('❌ SOAP notes generation failed:', soapResult.error);
        console.error('📊 Full result:', JSON.stringify(soapResult, null, 2));
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