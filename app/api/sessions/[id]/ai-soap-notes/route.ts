import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params

    // Get session data
    const { data: session, error: sessionError } = await supabase
      .from('global_sessions')
      .select(`
        *,
        therapist:global_users!therapist_id(full_name, email),
        patient:global_users!user_id(full_name, email, metadata)
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Get session transcript
    const { data: transcript } = await supabase
      .from('session_transcripts')
      .select('transcript_text')
      .eq('session_id', sessionId)
      .single()

    // Get previous SOAP notes for context
    const { data: previousNotes } = await supabase
      .from('session_soap_notes')
      .select('*')
      .eq('patient_id', session.user_id)
      .order('created_at', { ascending: false })
      .limit(3)

    // Prepare context for AI
    const context = {
      session: {
        id: session.id,
        date: session.scheduled_date,
        duration: session.duration,
        therapist: session.therapist?.full_name,
        patient: session.patient?.full_name,
        patientMetadata: session.patient?.metadata
      },
      transcript: transcript?.transcript_text || '',
      previousNotes: previousNotes || []
    }

    // Generate SOAP notes using AI
    const soapPrompt = `
You are a licensed mental health professional creating SOAP notes for a therapy session. 
Please analyze the session transcript and create comprehensive SOAP notes following standard medical documentation practices.

Session Context:
- Patient: ${context.session.patient}
- Therapist: ${context.session.therapist}
- Date: ${context.session.date}
- Duration: ${context.session.duration} minutes

Session Transcript:
${context.transcript}

Previous Session Notes (for context):
${context.previousNotes.map(note => `
Date: ${note.created_at}
Subjective: ${note.subjective?.chief_complaint || 'N/A'}
Assessment: ${note.assessment?.primary_diagnosis || 'N/A'}
Plan: ${note.plan?.next_session_focus || 'N/A'}
`).join('\n')}

Please create comprehensive SOAP notes with the following structure:

SUBJECTIVE:
- Chief Complaint: Patient's main concern
- History of Present Illness: Detailed symptom history
- Past Psychiatric History: Previous mental health treatment
- Family History: Family mental health history
- Social History: Social context, relationships, work
- Current Medications: List current medications
- Allergies: Any known allergies
- Review of Systems: Relevant system review

OBJECTIVE:
- Mental Status Examination:
  * Appearance: Physical appearance
  * Behavior: Behavioral observations
  * Mood: Patient's reported mood
  * Affect: Observed emotional expression
  * Speech: Speech characteristics
  * Thought Process: Thought organization
  * Thought Content: Thought content
  * Perception: Perceptual experiences
  * Cognition: Cognitive functioning
  * Insight: Patient's insight
  * Judgment: Patient's judgment
- Physical Examination: Any physical findings
- Laboratory Findings: Any lab results
- Assessment Tools: Any assessment tools used

ASSESSMENT:
- Primary Diagnosis: Main diagnosis
- Differential Diagnosis: Alternative diagnoses
- Risk Assessment:
  * Suicide Risk: low/moderate/high
  * Violence Risk: low/moderate/high
  * Self-Harm Risk: low/moderate/high
  * Risk Notes: Detailed risk assessment
- Clinical Impression: Clinical formulation
- Progress Notes: Progress assessment

PLAN:
- Treatment Goals: List specific goals
- Interventions Used: List interventions
- Homework Assigned: Homework assignments
- Medication Changes: Any medication changes
- Referrals: Any referrals made
- Follow-up Plan: Follow-up arrangements
- Next Session Focus: Focus for next session
- Crisis Plan: Crisis intervention plan

Additional Ratings:
- Session Rating: 1-10 scale
- Therapeutic Alliance: 1-10 scale
- Patient Engagement: 1-10 scale
- Treatment Compliance: 1-10 scale

Please provide the response in JSON format with the exact structure shown above. Be thorough but concise, and ensure clinical accuracy.
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a licensed mental health professional creating SOAP notes. Be thorough, clinically accurate, and follow standard medical documentation practices."
        },
        {
          role: "user",
          content: soapPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 4000
    })

    const aiResponse = completion.choices[0]?.message?.content
    if (!aiResponse) {
      return NextResponse.json(
        { error: 'Failed to generate AI notes' },
        { status: 500 }
      )
    }

    // Parse AI response
    let parsedNotes
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedNotes = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      )
    }

    // Structure the notes for database
    const soapNotes = {
      session_id: sessionId,
      therapist_id: session.therapist_id,
      patient_id: session.user_id,
      subjective: parsedNotes.SUBJECTIVE || {},
      objective: parsedNotes.OBJECTIVE || {},
      assessment: parsedNotes.ASSESSMENT || {},
      plan: parsedNotes.PLAN || {},
      session_rating: parsedNotes.session_rating || 5,
      therapeutic_alliance_rating: parsedNotes.therapeutic_alliance || 5,
      patient_engagement: parsedNotes.patient_engagement || 5,
      treatment_compliance: parsedNotes.treatment_compliance || 5,
      notes: aiResponse,
      ai_generated: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Save to database
    const { data: savedNotes, error: saveError } = await supabase
      .from('session_soap_notes')
      .upsert(soapNotes, { onConflict: 'session_id' })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving AI notes:', saveError)
      return NextResponse.json(
        { error: 'Failed to save AI notes' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      notes: savedNotes,
      aiResponse: aiResponse 
    })

  } catch (error) {
    console.error('Error in AI SOAP notes generation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
