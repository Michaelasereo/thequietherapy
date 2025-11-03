# How to Test SOAP Notes Generation

## Method 1: Using Dev Console (Easiest)

1. Go to `http://localhost:3001/dev-console` in your browser
2. Find an existing session or create a new one
3. Click the "Generate Test Transcript" button (if available)
4. This will:
   - Create a test transcript
   - Save it to `session_notes` table
   - Call `/api/sessions/complete` to generate SOAP notes
5. Check the browser console for logs:
   - Look for: `✅ Retrieved transcript:`
   - Look for: `✅ SOAP notes generated and saved successfully`
6. Verify in database:
   - Check `sessions` table - `soap_notes` column should have data
   - Check `session_notes` table - `soap_notes` column should have data

## Method 2: Test with Real Session Flow

1. **Start a test session:**
   - Book/create a session
   - Go to the video session page: `http://localhost:3001/video-session/[sessionId]`

2. **During the session:**
   - The `DailyAudioRecorder` will automatically record
   - When session ends or you stop recording, it will transcribe

3. **Watch for transcription completion:**
   - Open browser console (F12)
   - Look for: `✅ Transcription complete:`
   - Look for: `Calling onTranscriptionComplete with:`
   - Look for: `🔍 Completing session manually:` with `hasTranscript: true`

4. **Verify SOAP notes generation:**
   - Check console for: `✅ Retrieved transcript:`
   - Check console for: `✅ SOAP notes generated and saved successfully to both tables`
   - Should redirect to post-session page

## Method 3: Direct API Test (Quickest)

You can test directly using curl or browser console:

```javascript
// In browser console on any page:
const testSessionId = 'your-session-id';
const testTranscript = `Therapist: Hello, how have you been feeling this week?
Patient: I've been feeling a bit better. I tried the breathing exercises you suggested.
Therapist: That's wonderful to hear! Can you tell me more?
Patient: Well, when I started feeling overwhelmed, I remembered to take deep breaths.`;

fetch('/api/sessions/complete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    sessionId: testSessionId,
    transcript: testTranscript // Passing transcript directly - this is our fix!
  })
})
.then(r => r.json())
.then(data => {
  console.log('Result:', data);
  if (data.success && data.soapNotes) {
    console.log('✅ SOAP notes generated!', data.soapNotes);
  } else {
    console.error('❌ Failed:', data);
  }
});
```

## Method 4: Update Dev Console to Pass Transcript

The dev console currently doesn't pass the transcript. Update it:

```typescript
// In app/dev-console/page.tsx, update the generateTestTranscript function:
const soapResponse = await fetch('/api/sessions/complete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    sessionId,
    transcript: testTranscript // Add this line to pass transcript directly
  })
})
```

## What to Look For in Console Logs

### Successful Generation:
```
🔍 Completing session manually: { sessionId: '...', hasTranscript: true }
🧠 Generating AI SOAP notes for session: ...
✅ Retrieved transcript: ...
📝 Transcript length: ... characters
✅ SOAP notes generated and saved successfully to both tables
```

### If Transcript Not Found (Retry Logic):
```
📥 Transcript not provided, fetching from database...
⏳ Retry attempt 2 after 1 second delay...
⏳ Retry attempt 3 after 1 second delay...
⚠️ No transcript found for session after retries
```

### If SOAP Generation Fails:
```
❌ SOAP notes generation failed: [error message]
```

## Verify in Database

### Check Sessions Table:
```sql
SELECT id, soap_notes, ai_notes_generated, ai_notes_generated_at 
FROM sessions 
WHERE id = 'your-session-id';
```

### Check Session Notes Table:
```sql
SELECT session_id, soap_notes, transcript, ai_generated, ai_notes_generated_at 
FROM session_notes 
WHERE session_id = 'your-session-id';
```

## Troubleshooting

1. **No transcript found:**
   - Make sure transcription completed successfully
   - Check `session_notes` table has a transcript
   - Our fix adds retry logic, so wait a few seconds if transcript just saved

2. **SOAP notes not generating:**
   - Check OpenAI API key is set in `.env.local`
   - Check browser console for errors
   - Check server logs for API errors

3. **SOAP notes saved but not showing:**
   - Check both `sessions` and `session_notes` tables
   - Clear browser cache
   - Refresh the session page

## Expected Result

After a successful test, you should see:
- ✅ SOAP notes object with: `subjective`, `objective`, `assessment`, `plan`
- ✅ Data in `sessions.soap_notes` column
- ✅ Data in `session_notes.soap_notes` column
- ✅ `ai_notes_generated: true` flag set
- ✅ Success toast message in UI

