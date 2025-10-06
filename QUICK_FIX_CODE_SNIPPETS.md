# ⚡ Quick Fix Code Snippets - Video Sessions

Copy-paste solutions for senior developer to implement quickly.

---

## Fix #1: Integrate Recording into Video Session Page

### File: `/app/video-session/[sessionId]/page.tsx`

**Add these imports at the top:**

```typescript
// Add after existing imports (around line 31)
import DailyIframe from '@daily-co/daily-js'
import DailyAudioRecorder from '@/components/daily-audio-recorder'
```

**Add state for call object (around line 70):**

```typescript
// Add after existing useState declarations
const [callObject, setCallObject] = useState<any>(null)
const callFrameRef = useRef<HTMLDivElement>(null)
```

**Replace the iframe section (lines 666-683) with:**

```typescript
{/* Replace the <iframe> element with Daily.co JS SDK */}
{sessionPhase === 'therapy' && (
  <div className="relative w-full h-full">
    {/* Daily.co call frame container */}
    <div ref={callFrameRef} className="w-full h-full" />
    
    {/* Recording controls overlay */}
    <div className="absolute top-4 right-4 z-10">
      {callObject && (
        <DailyAudioRecorder
          callObject={callObject}
          sessionId={sessionId}
          onTranscriptionComplete={async (transcript) => {
            console.log('✅ Transcription complete:', transcript)
            toast.success('Session recorded and transcribed!')
            
            // Optionally trigger SOAP notes generation here
            try {
              const response = await fetch('/api/sessions/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
              })
              
              if (response.ok) {
                toast.success('AI notes generated successfully!')
              }
            } catch (error) {
              console.error('Failed to generate AI notes:', error)
            }
          }}
        />
      )}
    </div>
  </div>
)}
```

**Add useEffect to initialize Daily.co SDK (after fetchSessionData useEffect):**

```typescript
// Initialize Daily.co call object when session is available
useEffect(() => {
  if (!session?.daily_room_url || !callFrameRef.current) return
  
  console.log('🎥 Initializing Daily.co call object...')
  
  // Create Daily.co call frame
  const daily = DailyIframe.createFrame(callFrameRef.current, {
    showLeaveButton: true,
    showFullscreenButton: true,
    iframeStyle: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      border: '0',
      borderRadius: '8px'
    }
  })
  
  // Join the call
  daily.join({ url: session.daily_room_url })
    .then(() => {
      console.log('✅ Joined Daily.co call')
      setCallObject(daily)
      setIsConnected(true)
    })
    .catch((error) => {
      console.error('❌ Failed to join call:', error)
      setError('Failed to join video call')
    })
  
  // Cleanup on unmount
  return () => {
    console.log('🧹 Cleaning up Daily.co call object')
    if (daily) {
      daily.leave()
      daily.destroy()
    }
  }
}, [session?.daily_room_url])
```

---

## Fix #2: Link Real Transcript to SOAP Notes

### File: `/app/api/sessions/complete/route.ts`

**Replace the mock transcript section (lines 54-107) with:**

```typescript
// Generate AI SOAP notes using REAL transcript
try {
  console.log('🧠 Generating AI SOAP notes for session:', sessionId);
  
  // ✅ FETCH REAL TRANSCRIPT FROM DATABASE
  const { data: sessionNote, error: noteError } = await supabase
    .from('session_notes')
    .select('transcript')
    .eq('session_id', sessionId)
    .single();

  // Check if transcript exists
  if (noteError || !sessionNote?.transcript) {
    console.warn('⚠️ No transcript found for session:', sessionId);
    console.warn('Error:', noteError);
    
    return NextResponse.json({
      success: true,
      message: 'Session completed but no transcript available for SOAP notes',
      noTranscript: true,
      warning: 'Session may not have been recorded'
    });
  }

  const realTranscript = sessionNote.transcript;
  console.log('✅ Retrieved transcript:', realTranscript.substring(0, 100) + '...');

  // Import AI service
  const { generateSOAPNotes } = await import('@/lib/ai');
  
  // Get session data for context
  const { data: sessionData, error: sessionError } = await supabase
    .from('sessions')
    .select('user_id, therapist_id')
    .eq('id', sessionId)
    .single();

  if (sessionError) {
    throw new Error('Failed to fetch session data');
  }

  // ✅ GENERATE SOAP NOTES WITH REAL TRANSCRIPT
  const soapResult = await generateSOAPNotes(realTranscript, {
    id: sessionId,
    user_id: sessionData.user_id,
    therapist_id: sessionData.therapist_id
  });
  
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
```

---

## Fix #3: Implement Real AI Service

### File: `/lib/ai.ts`

**Replace entire file with:**

```typescript
// AI service for generating SOAP notes and other AI-powered features

export interface SOAPNotesResult {
  success: boolean;
  soapNotes?: string;
  error?: string;
}

export interface SessionData {
  id: string;
  user_id: string;
  therapist_id: string;
}

/**
 * Generate SOAP notes from session transcript using AI
 */
export async function generateSOAPNotes(
  transcript: string,
  sessionData: SessionData
): Promise<SOAPNotesResult> {
  try {
    console.log('🧠 Generating SOAP notes for session:', sessionData.id);
    console.log('📝 Transcript length:', transcript.length, 'characters');

    // Validate transcript
    if (!transcript || transcript.trim().length < 50) {
      console.warn('⚠️ Transcript too short or empty');
      return {
        success: false,
        error: 'Transcript is too short to generate meaningful SOAP notes'
      };
    }

    // Choose AI provider based on environment variable
    const aiProvider = process.env.AI_PROVIDER || 'openai'; // 'openai' or 'deepseek'
    
    if (aiProvider === 'deepseek') {
      return await generateSOAPNotesWithDeepSeek(transcript, sessionData);
    } else {
      return await generateSOAPNotesWithOpenAI(transcript, sessionData);
    }
  } catch (error) {
    console.error('❌ Error generating SOAP notes:', error);
    return {
      success: false,
      error: 'Failed to generate SOAP notes'
    };
  }
}

/**
 * Generate SOAP notes using OpenAI GPT-4
 */
async function generateSOAPNotesWithOpenAI(
  transcript: string,
  sessionData: SessionData
): Promise<SOAPNotesResult> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    console.error('❌ OpenAI API key not configured');
    return {
      success: false,
      error: 'OpenAI API key not configured'
    };
  }

  try {
    console.log('🤖 Using OpenAI GPT-4 for SOAP notes generation');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a professional mental health clinician generating SOAP (Subjective, Objective, Assessment, Plan) notes from therapy session transcripts. 
            
Your notes should be:
- Professional and clinical in tone
- Concise but comprehensive
- Following standard SOAP format
- Protecting patient confidentiality
- Based only on information in the transcript

Format your response exactly as:

**Subjective:**
[Patient's reported symptoms, concerns, and experiences in their own words]

**Objective:**
[Observable behaviors, mental status, and therapist's observations during session]

**Assessment:**
[Clinical interpretation, diagnosis considerations, and progress evaluation]

**Plan:**
[Treatment recommendations, follow-up actions, and next steps]`
          },
          {
            role: 'user',
            content: `Generate SOAP notes from this therapy session transcript:\n\n${transcript}`
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent, factual output
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorData);
      return {
        success: false,
        error: `OpenAI API error: ${response.status}`
      };
    }

    const data = await response.json();
    const soapNotes = data.choices[0].message.content;

    console.log('✅ SOAP notes generated successfully with OpenAI');
    console.log('📄 Notes length:', soapNotes.length, 'characters');

    return {
      success: true,
      soapNotes
    };
  } catch (error) {
    console.error('❌ Error calling OpenAI API:', error);
    return {
      success: false,
      error: `OpenAI API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Generate SOAP notes using DeepSeek (cheaper alternative)
 */
async function generateSOAPNotesWithDeepSeek(
  transcript: string,
  sessionData: SessionData
): Promise<SOAPNotesResult> {
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
  
  if (!DEEPSEEK_API_KEY) {
    console.error('❌ DeepSeek API key not configured');
    return {
      success: false,
      error: 'DeepSeek API key not configured'
    };
  }

  try {
    console.log('🤖 Using DeepSeek for SOAP notes generation');

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are a professional mental health clinician generating SOAP notes from therapy sessions. Format your response in standard SOAP format with Subjective, Objective, Assessment, and Plan sections.`
          },
          {
            role: 'user',
            content: `Generate SOAP notes from this therapy session transcript:\n\n${transcript}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ DeepSeek API error:', response.status, errorData);
      return {
        success: false,
        error: `DeepSeek API error: ${response.status}`
      };
    }

    const data = await response.json();
    const soapNotes = data.choices[0].message.content;

    console.log('✅ SOAP notes generated successfully with DeepSeek');
    return {
      success: true,
      soapNotes
    };
  } catch (error) {
    console.error('❌ Error calling DeepSeek API:', error);
    return {
      success: false,
      error: `DeepSeek API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Generate session summary from transcript
 */
export async function generateSessionSummary(
  transcript: string,
  sessionData: SessionData
): Promise<{ success: boolean; summary?: string; error?: string }> {
  try {
    console.log('📝 Generating session summary for:', sessionData.id);

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return {
        success: false,
        error: 'OpenAI API key not configured'
      };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a therapist generating a brief 2-3 sentence summary of a therapy session.'
          },
          {
            role: 'user',
            content: `Summarize this therapy session in 2-3 sentences:\n\n${transcript}`
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      return {
        success: false,
        error: 'Failed to generate summary'
      };
    }

    const data = await response.json();
    const summary = data.choices[0].message.content;

    return {
      success: true,
      summary
    };
  } catch (error) {
    console.error('❌ Error generating session summary:', error);
    return {
      success: false,
      error: 'Failed to generate session summary'
    };
  }
}
```

---

## Fix #4: Environment Variables

### Add to `.env.local`:

```bash
# Video Sessions (Already have)
DAILY_API_KEY=your_daily_api_key
DAILY_DOMAIN=your_domain.daily.co

# Transcription (Already have)
OPENAI_API_KEY=your_openai_key

# AI SOAP Notes - Choose ONE:

# Option 1: OpenAI (High quality, expensive ~$0.03/session)
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-key-here

# Option 2: DeepSeek (Good quality, cheap ~$0.003/session)
# AI_PROVIDER=deepseek
# DEEPSEEK_API_KEY=sk-your-deepseek-key-here

# Database (Already have)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

---

## Fix #5: Add Daily.co Package

### Run this command:

```bash
npm install @daily-co/daily-js @daily-co/daily-react
```

---

## Testing After Fixes

### Test Flow:

1. **Start a video session:**
   ```
   Navigate to: /video-session/[sessionId]
   ```

2. **Verify recording component appears:**
   - Should see recording controls in top-right
   - Should see "Start Recording" button

3. **Start recording (or make it auto-start):**
   - Click "Start Recording"
   - Verify timer shows duration

4. **Stop recording:**
   - Click "Stop Recording"
   - Should see "Transcribing audio..." message

5. **Check database:**
   ```sql
   -- Check transcript was saved
   SELECT * FROM session_notes WHERE session_id = 'your-session-id';
   
   -- Complete the session
   -- (Call /api/sessions/complete endpoint)
   
   -- Check SOAP notes were generated
   SELECT soap_notes FROM sessions WHERE id = 'your-session-id';
   ```

6. **View in therapist dashboard:**
   ```
   Navigate to: /therapist/dashboard/client-sessions
   Click: Past Sessions tab
   Click: View Notes
   ```

---

## Quick Auto-Recording Modification

### To make recording start automatically:

**In `/components/daily-audio-recorder.tsx`, add this useEffect:**

```typescript
// Add after line 36 (after state declarations)
// Auto-start recording when component mounts
useEffect(() => {
  if (callObject && !recording) {
    console.log('🎙️ Auto-starting recording...')
    // Wait 2 seconds for call to fully connect
    setTimeout(() => {
      startRecording()
    }, 2000)
  }
}, [callObject])
```

---

## Quick Test Script

**Create `/scripts/test-video-session.js`:**

```javascript
// Test the complete video session flow

async function testVideoSessionFlow() {
  const sessionId = 'test-session-' + Date.now()
  
  console.log('1. Testing transcription API...')
  // Test transcription
  const mockAudio = new Blob(['mock audio'], { type: 'audio/webm' })
  const formData = new FormData()
  formData.append('file', mockAudio)
  formData.append('sessionId', sessionId)
  
  const transcribeResponse = await fetch('http://localhost:3000/api/transcribe', {
    method: 'POST',
    body: formData
  })
  
  console.log('Transcription result:', await transcribeResponse.json())
  
  console.log('2. Testing session completion...')
  const completeResponse = await fetch('http://localhost:3000/api/sessions/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId })
  })
  
  console.log('Completion result:', await completeResponse.json())
}

testVideoSessionFlow()
```

---

## Priority Order:

1. ✅ **Add Daily.co package** (1 min)
2. ✅ **Add environment variables** (2 min)
3. ✅ **Fix AI service** (`/lib/ai.ts`) (5 min)
4. ✅ **Link transcript to SOAP** (`/api/sessions/complete/route.ts`) (5 min)
5. ✅ **Integrate recording** (`/app/video-session/[sessionId]/page.tsx`) (15 min)
6. ✅ **Test complete flow** (10 min)

**Total time: ~40 minutes** ⚡


