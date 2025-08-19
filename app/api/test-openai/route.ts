import { NextResponse } from 'next/server'
import { generateSOAPNotes } from '@/lib/ai-services'

export async function GET() {
  try {
    // Test with a sample therapy session transcript
    const sampleTranscript = `
    Therapist: Hello, how have you been feeling this week?
    Patient: I've been feeling a bit better actually. I tried the breathing exercises you suggested and they really helped when I felt anxious at work.
    Therapist: That's wonderful to hear! Can you tell me more about how you used them?
    Patient: Well, when I started feeling overwhelmed during a meeting, I remembered to take deep breaths and count to five. It really calmed me down.
    Therapist: That's excellent progress. How often were you able to practice these exercises?
    Patient: I tried to do them every morning for 10 minutes, and then whenever I felt stressed during the day.
    Therapist: That's a great routine. What other challenges did you face this week?
    Patient: I still have trouble sleeping sometimes, but it's getting better. I'm not waking up as often in the middle of the night.
    Therapist: That's a positive sign. Let's talk about your sleep hygiene. Are you still avoiding screens before bed?
    Patient: Yes, I've been trying to read a book instead of looking at my phone. It seems to help me fall asleep faster.
    Therapist: Excellent. I'm really pleased with your progress. For next week, I'd like you to continue with the breathing exercises and maybe try some progressive muscle relaxation before bed.
    Patient: I can do that. Thank you for helping me with this.
    Therapist: You're very welcome. You're doing great work. See you next week!
    `

    console.log('Testing OpenAI SOAP notes generation...')
    
    const soapNotes = await generateSOAPNotes(sampleTranscript)
    
    return NextResponse.json({
      success: true,
      message: 'OpenAI API is working correctly!',
      soapNotes,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('OpenAI test error:', error)
    return NextResponse.json({
      success: false,
      error: 'OpenAI API test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
