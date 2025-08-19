import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export interface TranscriptionResult {
  text: string
  duration?: number
  language?: string
}

export interface SOAPNotes {
  subjective: string
  objective: string
  assessment: string
  plan: string
  summary: string
  mood_rating?: number
  progress_notes?: string
  homework_assigned?: string
  next_session_focus?: string
}

/**
 * Transcribe audio file using OpenAI Whisper
 */
export async function transcribeAudio(audioFilePath: string): Promise<TranscriptionResult> {
  try {
    console.log('Starting transcription for:', audioFilePath)
    
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['word']
    })

    return {
      text: transcription.text,
      duration: transcription.duration,
      language: transcription.language
    }
  } catch (error) {
    console.error('Error transcribing audio:', error)
    throw new Error('Failed to transcribe audio')
  }
}

/**
 * Generate SOAP notes from transcript using GPT-4
 */
export async function generateSOAPNotes(transcript: string): Promise<SOAPNotes> {
  try {
    console.log('Generating SOAP notes from transcript...')
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective option
      messages: [
        {
          role: 'system',
          content: `You are a clinical documentation assistant specializing in mental health therapy sessions. 
          Create comprehensive SOAP notes from therapy session transcripts.
          
          Format your response as a JSON object with these fields:
          - subjective: Patient's reported symptoms, feelings, and concerns
          - objective: Observable behaviors, demeanor, and clinical observations
          - assessment: Clinical analysis, progress evaluation, and mental status
          - plan: Treatment recommendations, interventions, and next steps
          - summary: Brief overall session summary
          - mood_rating: Rate patient's mood 1-10 (10 being excellent)
          - progress_notes: Key progress indicators and improvements
          - homework_assigned: Any assignments or exercises given to patient
          - next_session_focus: Areas to focus on in the next session
          
          Be professional, accurate, and maintain patient confidentiality. Focus on therapeutic content and avoid including personal identifying information.`
        },
        {
          role: 'user',
          content: `Please create SOAP notes for this therapy session transcript:

${transcript}

Provide a thorough but concise analysis following the SOAP format.`
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent, clinical output
      max_tokens: 2000
    })

    const response = completion.choices[0].message.content
    if (!response) {
      throw new Error('No response from GPT-4')
    }

    try {
      // Try to parse as JSON first
      const soapNotes = JSON.parse(response)
      return soapNotes as SOAPNotes
    } catch (parseError) {
      console.log('JSON parsing failed, extracting from text:', parseError)
      // If JSON parsing fails, extract sections manually
      return parseSOAPFromText(response)
    }
  } catch (error) {
    console.error('Error generating SOAP notes:', error)
    throw new Error('Failed to generate SOAP notes')
  }
}

/**
 * Parse SOAP notes from text when JSON parsing fails
 */
function parseSOAPFromText(text: string): SOAPNotes {
  const sections = {
    subjective: extractSection(text, ['subjective', 'patient reported', 'patient states']),
    objective: extractSection(text, ['objective', 'observed', 'clinical observations']),
    assessment: extractSection(text, ['assessment', 'analysis', 'clinical impression']),
    plan: extractSection(text, ['plan', 'treatment plan', 'recommendations']),
    summary: extractSection(text, ['summary', 'session summary', 'overview']),
    mood_rating: extractMoodRating(text),
    progress_notes: extractSection(text, ['progress', 'improvements', 'progress notes']),
    homework_assigned: extractSection(text, ['homework', 'assignments', 'exercises']),
    next_session_focus: extractSection(text, ['next session', 'future focus', 'next steps'])
  }

  return sections
}

/**
 * Extract a section from text based on keywords
 */
function extractSection(text: string, keywords: string[]): string {
  const lines = text.split('\n')
  let sectionLines: string[] = []
  let inSection = false

  for (const line of lines) {
    const lowerLine = line.toLowerCase()
    
    // Check if this line starts a section we're looking for
    if (keywords.some(keyword => lowerLine.includes(keyword))) {
      inSection = true
      sectionLines = [line]
      continue
    }
    
    // Check if this line starts a different section (stop collecting)
    if (inSection && (lowerLine.includes('subjective:') || lowerLine.includes('objective:') || 
                     lowerLine.includes('assessment:') || lowerLine.includes('plan:'))) {
      break
    }
    
    if (inSection && line.trim()) {
      sectionLines.push(line)
    }
  }

  return sectionLines.join('\n').trim() || 'No information recorded'
}

/**
 * Extract mood rating from text
 */
function extractMoodRating(text: string): number {
  const moodMatch = text.match(/mood.*?(\d+)\/10|(\d+)\s*out\s*of\s*10|mood.*?(\d+)/i)
  if (moodMatch) {
    const rating = parseInt(moodMatch[1] || moodMatch[2] || moodMatch[3])
    return Math.min(Math.max(rating, 1), 10) // Ensure rating is between 1-10
  }
  return 5 // Default neutral mood
}

/**
 * Enhanced SOAP notes generation with therapy-specific prompts
 */
export async function generateTherapySOAPNotes(transcript: string, sessionType?: string): Promise<SOAPNotes> {
  try {
    const sessionContext = sessionType ? `This is a ${sessionType} therapy session.` : ''
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an experienced clinical psychologist creating SOAP notes for therapy sessions. ${sessionContext}
          
          Create detailed, professional SOAP notes following these guidelines:
          
          SUBJECTIVE: What the patient reports
          - Current symptoms and concerns
          - Mood and emotional state as described by patient
          - Recent events or stressors
          - Patient's perception of progress
          
          OBJECTIVE: What you observe
          - Appearance and behavior during session
          - Speech patterns, affect, and mood presentation
          - Cognitive functioning observations
          - Engagement level and therapeutic alliance
          
          ASSESSMENT: Clinical analysis
          - Progress toward treatment goals
          - Symptom severity and changes
          - Risk assessment if applicable
          - Diagnostic considerations
          
          PLAN: Next steps
          - Treatment interventions to continue/modify
          - Homework or between-session activities
          - Medication considerations (if applicable)
          - Next session planning
          
          Respond in JSON format with all required fields. Be thorough but concise.`
        },
        {
          role: 'user',
          content: `Therapy session transcript:

${transcript}

Please create comprehensive SOAP notes for this session.`
        }
      ],
      temperature: 0.2,
      max_tokens: 2500,
      response_format: { type: "json_object" }
    })

    const response = completion.choices[0].message.content
    if (!response) {
      throw new Error('No response from GPT-4')
    }

    return JSON.parse(response) as SOAPNotes
  } catch (error) {
    console.error('Error generating therapy SOAP notes:', error)
    // Fallback to regular SOAP notes generation
    return generateSOAPNotes(transcript)
  }
}

/**
 * Extract key therapeutic insights from transcript
 */
export async function extractTherapeuticInsights(transcript: string): Promise<{
  breakthroughs: string[]
  concerns: string[]
  therapeutic_relationship: string
  treatment_progress: string
}> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Extract key therapeutic insights from this session transcript. Focus on:
          1. Breakthroughs or significant moments
          2. Areas of concern or difficulty
          3. Quality of therapeutic relationship
          4. Overall treatment progress
          
          Respond in JSON format with arrays for breakthroughs and concerns, and strings for relationship and progress.`
        },
        {
          role: 'user',
          content: transcript
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    })

    const response = completion.choices[0].message.content
    return response ? JSON.parse(response) : {
      breakthroughs: [],
      concerns: [],
      therapeutic_relationship: 'Good rapport established',
      treatment_progress: 'Steady progress noted'
    }
  } catch (error) {
    console.error('Error extracting therapeutic insights:', error)
    return {
      breakthroughs: [],
      concerns: [],
      therapeutic_relationship: 'Unable to assess',
      treatment_progress: 'Unable to assess'
    }
  }
}
