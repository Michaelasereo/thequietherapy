export async function processSessionRecordingMock(sessionId: string, recordingId: string) {
  console.log(`🎭 Mock AI processing started for session ${sessionId}, recording ${recordingId}`)
  
  try {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Generate mock transcript
    const mockTranscript = `Therapist: Hello, how are you feeling today?
Patient: I've been feeling quite anxious lately, especially about work.
Therapist: I understand. Can you tell me more about what's causing this anxiety?
Patient: Well, I have a big presentation coming up next week, and I'm worried I'll mess it up.
Therapist: That's a common concern. What specifically are you worried about?
Patient: I'm afraid I'll forget what to say or that people will judge me.
Therapist: Those are valid fears. Let's work on some coping strategies together.
Patient: That would be really helpful. I just want to feel more confident.
Therapist: We can definitely work on that. Let's start with some breathing exercises.`

    // Generate mock SOAP notes
    const mockSOAP = {
      subjective: "Patient reports increased anxiety related to upcoming work presentation. Expresses fear of forgetting content and being judged by colleagues. Describes feeling overwhelmed and seeking confidence-building strategies.",
      objective: "Patient appears alert and oriented. Speech is clear but shows signs of nervousness when discussing work-related stressors. Maintains good eye contact and engagement in session.",
      assessment: "Anxiety disorder, likely performance anxiety related to work presentation. Patient demonstrates insight into their concerns and motivation for change. No immediate safety concerns identified.",
      plan: "1. Implement breathing exercises and relaxation techniques. 2. Develop presentation preparation strategies. 3. Practice exposure therapy with presentation scenarios. 4. Schedule follow-up session to assess progress. 5. Consider cognitive behavioral therapy techniques for anxiety management."
    }

    // Return mock data without database interaction
    const mockResult = {
      id: `mock-notes-${Date.now()}`,
      session_id: sessionId,
      therapist_id: '394e25db-308b-4dbc-a556-bee963ba39cf',
      user_id: 'c012e073-49d1-4fc6-b580-7714edb45876',
      notes: "AI-generated session notes based on recording analysis.",
      transcript: mockTranscript,
      soap_subjective: mockSOAP.subjective,
      soap_objective: mockSOAP.objective,
      soap_assessment: mockSOAP.assessment,
      soap_plan: mockSOAP.plan,
      ai_generated: true,
      therapeutic_insights: {
        anxiety_triggers: ["work presentations", "fear of judgment"],
        coping_strategies: ["breathing exercises", "preparation techniques"],
        progress_areas: ["confidence building", "anxiety management"]
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log(`✅ Mock AI processing completed for session ${sessionId}`)
    console.log(`📝 Generated mock session notes with transcript and SOAP notes`)
    
    return mockResult

  } catch (error) {
    console.error('Error in mock AI processing:', error)
    throw error
  }
}

// Export alias for the missing function
export const generateFallbackSOAPNotes = processSessionRecordingMock;
