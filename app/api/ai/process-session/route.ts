import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/server-auth'
import { handleApiError, ValidationError, successResponse, validateRequired } from '@/lib/api-response'
import { generateSOAPNotes } from '@/lib/ai'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, transcript, audioBlob } = await request.json()

    // Validate required fields
    validateRequired({ sessionId }, ['sessionId'])

    let userId = null
    let isTestSession = false
    
    if (sessionId.startsWith('test-session-') || sessionId.startsWith('perf-test-')) {
      // Only allow unauthenticated test sessions if feature flag enabled
      const allowTest = process.env.FEATURE_ALLOW_TEST_ENDPOINTS === 'true'
      if (!allowTest) {
        return NextResponse.json({
          error: 'Test endpoints are disabled',
          code: 'TEST_ENDPOINTS_DISABLED'
        }, { status: 403 })
      }
      isTestSession = true
      userId = 'test-user-id'
      console.log('🧪 Processing test session without authentication:', sessionId)
    } else {
      // SECURE Authentication Check for real sessions
      const authResult = await requireApiAuth(['individual', 'therapist'])
      if ('error' in authResult) {
        return authResult.error
      }

      const { session } = authResult
      userId = session.user.id // This is now TRUSTED and verified
    }

    if (!transcript && !audioBlob) {
      throw new ValidationError('Either transcript or audio data is required')
    }

    console.log('🧠 Processing AI request:', {
      sessionId,
      userId,
      hasTranscript: !!transcript,
      hasAudio: !!audioBlob,
      transcriptLength: transcript?.length || 0
    })

    // Prepare session data for AI processing
    let formattedSessionData

    if (isTestSession) {
      // Use mock data for test sessions
      formattedSessionData = {
        id: sessionId,
        user_id: 'test-user',
        therapist_id: 'test-therapist'
      }
      console.log('🧪 Using mock session data for test:', formattedSessionData)
    } else {
      // Verify session ownership and get session data for real sessions
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          id,
          scheduled_date,
          scheduled_time,
          duration_minutes,
          status,
          therapist_id,
          user_id,
          therapists (
            full_name,
            email
          ),
          users (
            full_name,
            email
          )
        `)
        .eq('id', sessionId)
        .or(`therapist_id.eq.${userId},user_id.eq.${userId}`)
        .single()

      if (sessionError || !sessionData) {
        console.error('Session not found or access denied:', sessionError)
        return NextResponse.json({ 
          error: 'Session not found or access denied' 
        }, { status: 404 })
      }

      formattedSessionData = {
        id: sessionData.id,
        user_id: sessionData.user_id,
        therapist_id: sessionData.therapist_id
      }
    }

    let finalTranscript = transcript

    // If we have audio but no transcript, we would transcribe it here
    // For now, we'll use the provided transcript or generate a placeholder
    if (!finalTranscript && audioBlob) {
      // TODO: Implement audio transcription with OpenAI Whisper or similar
      console.log('⚠️ Audio transcription not yet implemented, using placeholder')
      finalTranscript = 'Audio transcription not yet implemented. Please provide transcript directly.'
    }

    if (!finalTranscript) {
      throw new ValidationError('No transcript available for processing')
    }

    // Generate SOAP notes using AI
    console.log('🤖 Generating SOAP notes with AI...')
    const soapNotes = await generateSOAPNotes(finalTranscript, formattedSessionData)

    // Save SOAP notes to database (skip for test sessions)
    if (!isTestSession) {
      const { data: updatedSession, error: updateError } = await supabase
        .from('sessions')
        .update({
          notes: soapNotes.soapNotes || 'AI notes generated',
          soap_notes: soapNotes.soapNotes || 'AI notes generated',
          ai_summary: soapNotes.soapNotes || 'AI notes generated',
          ai_processed_at: new Date().toISOString(),
          ai_provider: 'openai'
        })
        .eq('id', sessionId)
        .select()
        .single()

      if (updateError) {
        console.error('Failed to save SOAP notes:', updateError)
        throw new Error(`Failed to save SOAP notes to database: ${updateError.message}`)
      }
    } else {
      console.log('🧪 Skipping database save for test session')
    }

    console.log('✅ SOAP notes generated and saved successfully')

    return successResponse({
      sessionId,
      soapNotes: {
        success: soapNotes.success,
        soapNotes: soapNotes.soapNotes,
        error: soapNotes.error
      },
      message: 'SOAP notes generated successfully with AI'
    })

  } catch (error) {
    console.error('💥 AI Processing Error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })

    // Normalized error responses
    const message = error instanceof Error ? error.message : String(error)

    if (message.includes('API key') || message.includes('configuration')) {
      return NextResponse.json({ 
        error: 'AI service configuration error',
        details: 'AI provider API key is invalid or not configured',
        code: 'AI_CONFIG_ERROR'
      }, { status: 500 })
    }

    if (message.includes('rate limit') || message.includes('429')) {
      return NextResponse.json({ 
        error: 'AI service temporarily unavailable',
        details: 'Rate limit exceeded. Please try again in a few minutes.',
        code: 'AI_RATE_LIMIT'
      }, { status: 429 })
    }

    if (message.includes('validation') || error instanceof ValidationError) {
      return NextResponse.json({ 
        error: 'Invalid input',
        details: message,
        code: 'VALIDATION_ERROR'
      }, { status: 400 })
    }

    return handleApiError(error)
  }
}
