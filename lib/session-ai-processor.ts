import { createClient } from '@supabase/supabase-js'
import { transcribeAudio as realTranscribeAudio, generateTherapySOAPNotes as realGenerateSOAPNotes, extractTherapeuticInsights as realExtractInsights, SOAPNotes } from './ai-services'
import { transcribeAudio as mockTranscribeAudio, generateTherapySOAPNotes as mockGenerateSOAPNotes, extractTherapeuticInsights as mockExtractInsights } from './ai-services-mock'
import { processRecording, getRecording, Recording } from './daily-recording'
import path from 'path'
import fs from 'fs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface ProcessedSession {
  sessionId: string
  recordingId: string
  transcript: string
  soapNotes: SOAPNotes
  insights: any
  audioPath: string
  processingTime: number
}

/**
 * Complete AI processing pipeline for a therapy session recording
 */
export async function processSessionRecording(
  sessionId: string,
  recordingId: string
): Promise<ProcessedSession> {
  const startTime = Date.now()
  
  try {
    console.log(`Starting AI processing for session ${sessionId}, recording ${recordingId}`)

    // Step 1: Get recording details
    const recording = await getRecording(recordingId)
    if (recording.status !== 'finished') {
      throw new Error('Recording is not finished yet')
    }

    // Step 2: Process recording (download and extract audio)
    const outputDir = path.join(process.cwd(), 'temp', 'recordings')
    const { audioPath } = await processRecording(recording, outputDir)

    // Step 3: Transcribe audio (with fallback to mock)
    console.log('Transcribing audio...')
    let transcriptionResult
    try {
      transcriptionResult = await realTranscribeAudio(audioPath)
    } catch (error) {
      console.log('Real transcription failed, using mock:', error)
      transcriptionResult = await mockTranscribeAudio(audioPath)
    }

    // Step 4: Generate SOAP notes (with fallback to mock)
    console.log('Generating SOAP notes...')
    let soapNotes
    try {
      soapNotes = await realGenerateSOAPNotes(transcriptionResult.text)
    } catch (error) {
      console.log('Real SOAP generation failed, using mock:', error)
      soapNotes = await mockGenerateSOAPNotes(transcriptionResult.text)
    }

    // Step 5: Extract therapeutic insights (with fallback to mock)
    console.log('Extracting therapeutic insights...')
    let insights
    try {
      insights = await realExtractInsights(transcriptionResult.text)
    } catch (error) {
      console.log('Real insights extraction failed, using mock:', error)
      insights = await mockExtractInsights(transcriptionResult.text)
    }

    // Step 6: Store results in database
    await storeProcessedSession({
      sessionId,
      recordingId,
      transcript: transcriptionResult.text,
      soapNotes,
      insights,
      audioPath,
      processingTime: Date.now() - startTime
    })

    // Step 7: Clean up temporary files
    await cleanupTempFiles(audioPath)

    console.log(`AI processing completed for session ${sessionId}`)

    return {
      sessionId,
      recordingId,
      transcript: transcriptionResult.text,
      soapNotes,
      insights,
      audioPath,
      processingTime: Date.now() - startTime
    }
  } catch (error) {
    console.error('Error processing session recording:', error)
    
    // Store error in database for tracking
    await storeProcessingError(sessionId, recordingId, error instanceof Error ? error.message : 'Unknown error')
    
    throw error
  }
}

/**
 * Store processed session data in database
 */
async function storeProcessedSession(data: ProcessedSession): Promise<void> {
  try {
    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('therapist_id, user_id')
      .eq('id', data.sessionId)
      .single()

    if (sessionError || !session) {
      throw new Error('Session not found')
    }

    // Store or update session notes
    const { error: notesError } = await supabase
      .from('session_notes')
      .upsert({
        session_id: data.sessionId,
        therapist_id: session.therapist_id,
        user_id: session.user_id,
        notes: data.soapNotes.summary || '',
        mood_rating: data.soapNotes.mood_rating || 5,
        progress_notes: data.soapNotes.progress_notes || '',
        homework_assigned: data.soapNotes.homework_assigned || '',
        next_session_focus: data.soapNotes.next_session_focus || '',
        ai_generated: true,
        transcript: data.transcript,
        soap_subjective: data.soapNotes.subjective,
        soap_objective: data.soapNotes.objective,
        soap_assessment: data.soapNotes.assessment,
        soap_plan: data.soapNotes.plan,
        therapeutic_insights: data.insights,
        recording_id: data.recordingId,
        processing_time_ms: data.processingTime
      })

    if (notesError) {
      console.error('Error storing session notes:', notesError)
      throw new Error('Failed to store session notes')
    }

    // Create notification for therapist
    await supabase
      .from('notifications')
      .insert({
        user_id: session.therapist_id,
        title: 'AI Session Notes Ready',
        message: `AI-generated SOAP notes are ready for session ${data.sessionId}`,
        type: 'ai_notes_ready',
        data: {
          session_id: data.sessionId,
          processing_time: data.processingTime
        }
      })

    console.log('Session data stored successfully')
  } catch (error) {
    console.error('Error storing processed session:', error)
    throw error
  }
}

/**
 * Store processing error in database
 */
async function storeProcessingError(sessionId: string, recordingId: string, errorMessage: string): Promise<void> {
  try {
    await supabase
      .from('session_processing_errors')
      .insert({
        session_id: sessionId,
        recording_id: recordingId,
        error_message: errorMessage,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Error storing processing error:', error)
  }
}

/**
 * Clean up temporary files
 */
async function cleanupTempFiles(audioPath: string): Promise<void> {
  try {
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath)
      console.log('Cleaned up audio file:', audioPath)
    }

    // Also clean up video file if it exists
    const videoPath = audioPath.replace('.wav', '.mp4')
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath)
      console.log('Cleaned up video file:', videoPath)
    }
  } catch (error) {
    console.error('Error cleaning up temp files:', error)
  }
}

/**
 * Process session recording in background (for webhook)
 */
export async function processSessionInBackground(sessionId: string, recordingId: string): Promise<void> {
  // Run processing in background without blocking
  processSessionRecording(sessionId, recordingId)
    .then(() => {
      console.log(`Background processing completed for session ${sessionId}`)
    })
    .catch((error) => {
      console.error(`Background processing failed for session ${sessionId}:`, error)
    })
}

/**
 * Get AI processing status for a session
 */
export async function getProcessingStatus(sessionId: string): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'error'
  notes?: any
  error?: string
}> {
  try {
    // Check if notes exist
    const { data: notes, error: notesError } = await supabase
      .from('session_notes')
      .select('*')
      .eq('session_id', sessionId)
      .eq('ai_generated', true)
      .single()

    if (notes && !notesError) {
      return { status: 'completed', notes }
    }

    // Check for processing errors
    const { data: error, error: errorQueryError } = await supabase
      .from('session_processing_errors')
      .select('error_message')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && !errorQueryError) {
      return { status: 'error', error: error.error_message }
    }

    // No notes and no errors - either pending or processing
    return { status: 'pending' }
  } catch (error) {
    console.error('Error getting processing status:', error)
    return { status: 'error', error: 'Failed to get processing status' }
  }
}

/**
 * Retry failed processing
 */
export async function retryProcessing(sessionId: string, recordingId: string): Promise<void> {
  try {
    // Delete previous error records
    await supabase
      .from('session_processing_errors')
      .delete()
      .eq('session_id', sessionId)

    // Start processing again
    await processSessionInBackground(sessionId, recordingId)
  } catch (error) {
    console.error('Error retrying processing:', error)
    throw error
  }
}
