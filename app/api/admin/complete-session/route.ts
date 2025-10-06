import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    console.log('🔍 Admin completing session:', sessionId);

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
    const { data, error } = await supabase
      .from('sessions')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select();

    if (error) {
      console.error('❌ Error completing session:', error);
      return NextResponse.json(
        { error: 'Failed to complete session', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Session completed successfully:', data);

    // Generate AI SOAP notes
    try {
      console.log('🧠 Generating AI SOAP notes for session:', sessionId);
      
      // Import AI service
      const { generateSOAPNotes } = await import('@/lib/ai');
      
      // Generate SOAP notes with mock transcript
      const mockTranscript = `Therapy session transcript for session ${sessionId}. Patient discussed their concerns about anxiety and stress management. The therapist provided CBT techniques and relaxation exercises. Patient showed good engagement and understanding of the techniques discussed.`;
      const sessionData = { id: sessionId, user_id: 'test', therapist_id: 'test' };
      
      const soapResult = await generateSOAPNotes(mockTranscript, sessionData);
      
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
    console.error('❌ Admin session completion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
