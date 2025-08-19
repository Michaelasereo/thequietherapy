// Mock AI services for testing when OpenAI API quota is exceeded
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
 * Mock transcription - returns sample text
 */
export async function transcribeAudio(audioFilePath: string): Promise<TranscriptionResult> {
  console.log('Mock transcription for:', audioFilePath)
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return {
    text: `Therapist: Hello, how have you been feeling this week?
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
Therapist: You're very welcome. You're doing great work. See you next week!`,
    duration: 1800, // 30 minutes
    language: 'en'
  }
}

/**
 * Mock SOAP notes generation
 */
export async function generateSOAPNotes(transcript: string): Promise<SOAPNotes> {
  console.log('Mock SOAP notes generation from transcript')
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  return {
    subjective: "Patient reports feeling better this week and successfully implemented breathing exercises during work stress. Sleep quality has improved with reduced nighttime awakenings. Patient is actively practicing recommended techniques.",
    objective: "Patient appears engaged and positive during session. Good eye contact and open communication. Reports consistent practice of breathing exercises and improved sleep hygiene habits.",
    assessment: "Significant progress noted in anxiety management. Patient demonstrates good understanding and application of coping strategies. Sleep hygiene improvements are contributing to overall well-being.",
    plan: "Continue daily breathing exercises. Introduce progressive muscle relaxation techniques before bedtime. Maintain current sleep hygiene practices. Schedule follow-up in one week.",
    summary: "Patient shows excellent progress with anxiety management techniques. Breathing exercises are being effectively utilized, and sleep quality has improved. Ready to introduce additional relaxation techniques.",
    mood_rating: 7,
    progress_notes: "Patient demonstrates improved coping skills and reduced anxiety symptoms. Good adherence to treatment recommendations.",
    homework_assigned: "Continue daily breathing exercises for 10 minutes. Practice progressive muscle relaxation before bed. Maintain sleep hygiene routine.",
    next_session_focus: "Review progress with new relaxation techniques. Address any remaining anxiety triggers. Continue building coping skill repertoire."
  }
}

/**
 * Mock therapy SOAP notes generation
 */
export async function generateTherapySOAPNotes(transcript: string, sessionType?: string): Promise<SOAPNotes> {
  console.log('Mock therapy SOAP notes generation')
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  return {
    subjective: "Patient reports continued improvement in anxiety management. Successfully used breathing techniques during stressful work situations. Sleep quality has improved with better sleep hygiene practices.",
    objective: "Patient presents with positive affect and good engagement. Demonstrates understanding of therapeutic techniques. Shows motivation for continued progress.",
    assessment: "Steady progress in anxiety treatment. Patient is effectively applying learned coping strategies. Therapeutic alliance remains strong.",
    plan: "Continue current treatment approach. Introduce progressive muscle relaxation. Maintain regular practice of breathing exercises.",
    summary: "Positive session with continued progress in anxiety management. Patient is actively engaged in treatment and showing good results.",
    mood_rating: 8,
    progress_notes: "Consistent improvement in anxiety symptoms. Good treatment adherence and skill application.",
    homework_assigned: "Daily breathing exercises, progressive muscle relaxation practice, maintain sleep hygiene.",
    next_session_focus: "Advanced relaxation techniques, stress management strategies, progress review."
  }
}

/**
 * Mock therapeutic insights extraction
 */
export async function extractTherapeuticInsights(transcript: string): Promise<{
  breakthroughs: string[]
  concerns: string[]
  therapeutic_relationship: string
  treatment_progress: string
}> {
  console.log('Mock therapeutic insights extraction')
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return {
    breakthroughs: [
      "Successfully implemented breathing exercises in real-world situations",
      "Improved sleep quality through better sleep hygiene",
      "Demonstrated consistent practice of therapeutic techniques"
    ],
    concerns: [
      "May need additional support for high-stress situations",
      "Continue monitoring sleep patterns"
    ],
    therapeutic_relationship: "Strong rapport maintained with good trust and communication",
    treatment_progress: "Significant improvement in anxiety management and coping skills"
  }
}
