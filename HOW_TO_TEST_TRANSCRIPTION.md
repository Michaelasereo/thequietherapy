# 🎤 How to Test Transcription in Video Sessions

This guide will help you test that audio transcription works correctly during video therapy sessions.

## 📋 Quick Test Methods

### Method 1: Test Page (Recommended for Quick Testing)
**Best for:** Testing transcription without a full video session

1. **Go to:** `/test-soap-transcription`
2. **Click:** "Start Recording" 
3. **Speak clearly** into your microphone for 30-60 seconds
4. **Click:** "Stop Recording"
5. **Click:** "Transcribe Audio"
6. **Check:** You should see the transcript appear

### Method 2: Full Video Session Test (Realistic)
**Best for:** Testing the complete flow

---

## 🎬 Step-by-Step Video Session Transcription Test

### **Step 1: Start a Video Session**

1. **Create/Book a session** (therapist creates or patient books)
2. **Join the video session** from dashboard
   - Therapist: `/therapist/dashboard/video-call` → Click "Join Session"
   - Patient: `/dashboard/sessions` → Click "Join Session" or navigate to `/video-session/[sessionId]`

### **Step 2: Verify Recording Started**

**Open Browser Console (F12) and look for:**
```
✅ Started recording with X audio tracks
✅ Recording indicator visible
```

**Visual indicators:**
- Recording should start automatically when video call connects
- You might see console logs about recording starting
- The `DailyAudioRecorder` component runs in the background (hidden)

### **Step 3: Speak During the Session**

**🗣️ Say something like:**
- "Hello, this is a test of the transcription system"
- "I've been feeling stressed about work lately"
- "The therapy session is going well"
- "I'm testing the audio recording and transcription features"

**Important:**
- **Speak clearly** and at normal volume
- **Talk for at least 2-3 minutes** to ensure enough audio content
- **Make sure your microphone is working** (you should see audio level indicators in the video call)
- **Avoid background noise** for best transcription accuracy

### **Step 4: End the Session**

**Option A: Wait for Timer to End**
- Timer counts down from 30:00
- Session automatically ends when timer reaches 00:00

**Option B: Click "End Video" Button**
- Click the red "End Video" button in the video controls
- Session ends immediately

### **Step 5: Check Console for Transcription**

**After ending the session, watch the browser console (F12):**

**Look for these logs:**
```javascript
✅ Transcription complete: [transcript text]...
✅ Session recorded and transcribed!
✅ AI SOAP notes generated successfully!
```

**If you see errors:**
```javascript
❌ Transcription failed: [error message]
❌ Failed to generate AI notes: [error message]
```

### **Step 6: Verify Transcription in Database**

**Option 1: Check Post-Session Page**
1. After ending session, you should be redirected to `/sessions/[sessionId]/post-session`
2. Go to **"SOAP Notes"** tab
3. You should see:
   - ✅ Transcript displayed (if transcription worked)
   - ✅ "Generate SOAP Notes" button (if transcript exists but SOAP notes haven't been generated)
   - ✅ SOAP Notes displayed (if they were auto-generated)

**Option 2: Check Database Directly**

Run this SQL query:
```sql
SELECT 
  session_id,
  transcript,
  LENGTH(transcript) as transcript_length,
  ai_generated,
  created_at
FROM session_notes
WHERE session_id = 'your-session-id'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:**
- `transcript` column should contain the transcribed text
- `transcript_length` should be > 0
- `ai_generated` should be `true`

### **Step 7: Verify in API Response**

**Check the transcription API directly:**

1. **Open Browser Console (F12)**
2. **Go to Network Tab**
3. **Filter by:** "transcribe"
4. **Find the POST request to:** `/api/transcribe`
5. **Click on it** → Go to "Response" tab

**Expected Response:**
```json
{
  "success": true,
  "text": "Hello this is a test of the transcription system...",
  "sessionId": "your-session-id",
  "message": "Audio transcribed successfully"
}
```

---

## 🔍 Debugging Transcription Issues

### **Issue: No Transcription After Session**

**Check 1: Verify Recording Started**
- Open browser console
- Look for: `Started recording with X audio tracks`
- If you don't see this, recording didn't start

**Check 2: Verify Audio is Being Captured**
- Check microphone permissions in browser
- Make sure microphone is not muted
- Check browser console for MediaRecorder errors

**Check 3: Check API Endpoint**
- Go to Network tab in browser console
- Look for POST request to `/api/transcribe`
- Check response status:
  - ✅ `200 OK` = Success
  - ❌ `400 Bad Request` = Missing audio file or sessionId
  - ❌ `500 Internal Server Error` = Server-side error

**Check 4: Verify OpenAI API Key**
- Make sure `OPENAI_API_KEY` is set in environment variables
- Without this, transcription will fail

### **Issue: Empty Transcript**

**Possible causes:**
1. **Audio was too quiet** - Speak louder
2. **No speech detected** - Make sure you're actually speaking
3. **Microphone not working** - Check browser microphone permissions
4. **Recording failed silently** - Check browser console for errors

**Solution:**
- Record longer (at least 2-3 minutes of speech)
- Speak clearly and at normal volume
- Check browser console for specific error messages

### **Issue: Transcription is Inaccurate**

**This is normal!** Transcription accuracy depends on:
- Audio quality
- Clarity of speech
- Background noise
- Language/accent

**OpenAI Whisper (used for transcription) typically achieves:**
- 80-90% accuracy for clear speech
- Lower accuracy for noisy environments or accents

---

## 🧪 Testing Checklist

### **Pre-Session Setup**
- [ ] Microphone permissions granted in browser
- [ ] Microphone is working (test in another app)
- [ ] Browser console is open (F12)
- [ ] Network tab is open (to see API calls)

### **During Session**
- [ ] Video call connects successfully
- [ ] Recording starts automatically (check console logs)
- [ ] Speaking clearly for at least 2-3 minutes
- [ ] No console errors during recording

### **After Session**
- [ ] Session ends successfully
- [ ] Console shows "Transcription complete" message
- [ ] Redirected to post-session page
- [ ] Transcript visible in post-session review
- [ ] SOAP notes button is visible (if transcript exists)
- [ ] SOAP notes generated automatically

---

## 📊 Expected Console Logs

### **Successful Transcription Flow:**

```
1. Recording Started:
   ✅ Started recording with 2 audio tracks

2. Recording Stopped:
   ✅ Recording stopped, processing audio...

3. Transcription Started:
   ✅ Sending audio for transcription...
   ✅ Transcription API response: { success: true, text: "..." }

4. Transcription Complete:
   ✅ Transcription complete: [transcript text]...
   ✅ Session recorded and transcribed!

5. SOAP Notes Generated:
   ✅ AI SOAP notes generated successfully!
```

### **Error Logs to Watch For:**

```
❌ Error: No audio file provided
   → Audio recording didn't capture any audio

❌ Error: Transcription failed: [message]
   → API call to /api/transcribe failed

❌ Error: Failed to generate AI notes
   → SOAP notes generation failed (but transcript might still exist)
```

---

## 🎯 Quick Test Script

**For fastest testing:**

1. **Open:** `/test-soap-transcription` in browser
2. **Open Console:** Press F12
3. **Click:** "Start Recording"
4. **Say:** "This is a transcription test. I am speaking clearly to test the audio recording and transcription system."
5. **Wait:** 30 seconds
6. **Click:** "Stop Recording"
7. **Click:** "Transcribe Audio"
8. **Check:**
   - ✅ Transcript appears with your spoken words
   - ✅ Console shows success messages
   - ✅ No errors in console

---

## 🔧 Manual API Test

**Test transcription API directly:**

```bash
# Replace with actual session ID
SESSION_ID="test-session-123"

# Create a test audio file (if you have one)
curl -X POST http://localhost:3000/api/transcribe \
  -F "file=@test-audio.webm" \
  -F "sessionId=$SESSION_ID"
```

**Expected Response:**
```json
{
  "success": true,
  "text": "Your transcribed text here...",
  "sessionId": "test-session-123",
  "message": "Audio transcribed successfully"
}
```

---

## 💡 Tips for Best Results

1. **Environment:**
   - Quiet room (minimize background noise)
   - Good microphone quality
   - Stable internet connection

2. **Speaking:**
   - Speak clearly and at normal pace
   - Avoid mumbling or speaking too fast
   - Pause between sentences

3. **Duration:**
   - Record at least 2-3 minutes of actual speech
   - Longer recordings = more content = better testing

4. **Testing:**
   - Test multiple times with different audio content
   - Test with different speakers (therapist + patient)
   - Test edge cases (very quiet audio, background noise, etc.)

---

## 📝 Notes

- **Transcription happens automatically** when you end a video session
- **No manual action needed** - the system handles everything
- **Transcription uses OpenAI Whisper API** - requires `OPENAI_API_KEY`
- **Transcripts are stored in `session_notes` table** in database
- **SOAP notes are generated automatically** after transcription completes

---

## ✅ Success Criteria

Transcription is working correctly if:
- ✅ Console shows "Transcription complete" message
- ✅ Transcript appears in post-session review page
- ✅ Transcript text matches what you said (approximately)
- ✅ SOAP notes button is visible or SOAP notes are auto-generated
- ✅ No errors in browser console or network requests

---

**Need more help?** Check:
- `/test-soap-transcription` - Full-featured test page with debugging
- Browser console logs - Real-time debugging information
- Network tab - See API requests and responses
- Database `session_notes` table - Verify data storage

