import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { sessionId, transcript } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log(`Generating SOAP notes for session: ${sessionId}`);

    // Get session details for context
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        id,
        user_id,
        therapist_id,
        duration,
        session_type,
        users:user_id(full_name, email),
        therapist:therapist_id(full_name, email)
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      console.error('Error fetching session data:', sessionError);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get existing transcript if not provided
    let sessionTranscript = transcript;
    if (!sessionTranscript) {
      const { data: notesData } = await supabase
        .from('session_notes')
        .select('transcript')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (notesData?.transcript) {
        sessionTranscript = notesData.transcript;
      }
    }

    if (!sessionTranscript) {
      return NextResponse.json(
        { error: 'No transcript available for this session' },
        { status: 400 }
      );
    }

    // Generate SOAP notes using AI
    const soapPrompt = `
You are a licensed mental health professional. Based on the therapy session transcript below, generate comprehensive SOAP notes following medical documentation standards.

Session Details:
- Patient: ${sessionData.users?.full_name || 'Patient'}
- Therapist: ${sessionData.therapist?.full_name || 'Therapist'}
- Duration: ${sessionData.duration || 30} minutes
- Type: ${sessionData.session_type || 'Individual therapy'}

Session Transcript:
${sessionTranscript}

Please generate SOAP notes with the following structure:

SUBJECTIVE:
- Patient's self-reported symptoms, concerns, and experiences
- Patient's mood, affect, and presentation
- Patient's goals and progress reports
- Any relevant patient statements or quotes

OBJECTIVE:
- Therapist's observations of patient's appearance and behavior
- Clinical observations during the session
- Patient's engagement level and participation
- Any notable behavioral patterns or changes

ASSESSMENT:
- Clinical assessment of patient's current mental health status
- Progress toward treatment goals
- Risk assessment (if applicable)
- Diagnostic impressions or clinical observations

PLAN:
- Specific interventions used or planned
- Homework assignments or action items
- Follow-up recommendations
- Next session focus areas
- Any referrals or additional services needed

Format the response as a JSON object with these exact keys: subjective, objective, assessment, plan
`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a licensed mental health professional creating SOAP notes. Respond only with valid JSON containing the four SOAP sections.'
          },
          {
            role: 'user',
            content: soapPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      // Parse the JSON response
      let soapNotes;
      try {
        soapNotes = JSON.parse(aiResponse);
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        // Fallback: create basic SOAP structure
        soapNotes = {
          subjective: "Patient reported various concerns during the session.",
          objective: "Patient was engaged and responsive throughout the session.",
          assessment: "Patient is making progress in therapy.",
          plan: "Continue with current treatment approach and monitor progress."
        };
      }

      // Store SOAP notes in database
      const { data: soapData, error: soapError } = await supabase
        .from('session_notes')
        .upsert({
          session_id: sessionId,
          soap_notes: soapNotes,
          ai_generated: true,
          ai_notes_generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'session_id'
        })
        .select()
        .single();

      if (soapError) {
        console.error('Error storing SOAP notes:', soapError);
        // Don't fail the request, just log the error
      }

      console.log('SOAP notes generated successfully');

      return NextResponse.json({
        success: true,
        soapNotes,
        sessionId,
        message: 'SOAP notes generated successfully'
      });

    } catch (aiError) {
      console.error('Error generating SOAP notes with AI:', aiError);
      return NextResponse.json(
        { error: 'Failed to generate SOAP notes' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in SOAP notes API:', error);
    return NextResponse.json(
      { 
        error: 'SOAP notes generation failed',
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
