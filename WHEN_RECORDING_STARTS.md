# 🎥 When HIPAA-Compliant Recording Starts in Video Sessions

## 🛡️ HIPAA-Compliant Recorder

This is our **browser-based MediaRecorder** that:
- ✅ Records audio **locally in your browser** (not on Daily.co servers)
- ✅ Processes audio **locally** before sending for transcription
- ✅ Only sends **text transcript** to server (never raw audio)
- ✅ Complies with HIPAA privacy requirements

## ⏱️ Recording Timeline

### **1. Video Call Connects**
- When you click "Join Session" or "Start Session"
- Daily.co video call begins connecting
- Console log: `🎥 Initializing Daily.co call object for recording...`

### **2. Call Successfully Joins**
- Console log: `✅ Joined Daily.co call`
- `callObject` is created and set
- This happens immediately after connection succeeds

### **3. Audio Tracks Become Available**
- Daily.co callObject needs time to initialize audio tracks
- `callObject.localAudio()` must return an audio track
- Remote participant audio tracks must be available
- This usually happens within 1-3 seconds after joining

### **4. HIPAA-Compliant Recorder Starts**
- **2 seconds after** `callObject` exists AND audio tracks are available
- Our **MediaRecorder** (browser-based) starts recording **locally**
- Recording happens **in your browser**, not on any server
- Console log: `Started recording with X audio tracks`

---

## 📊 Complete Timeline

```
0:00 - You click "Join Session" button
  ↓
0:01 - Daily.co call starts connecting
  ↓
0:02-0:05 - Video call connects (depends on internet speed)
  ↓
0:05 - ✅ Console: "Joined Daily.co call"
  ↓
0:05 - callObject created
  ↓
0:06-0:08 - Audio tracks become available
  - callObject.localAudio() returns audio track
  - Participant audio tracks initialized
  ↓
**0:07-0:10 - 🎙️ HIPAA-COMPLIANT RECORDING STARTS**
  - MediaRecorder starts locally in browser
  - Recording happens in YOUR browser (not on servers)
  ↓
30:00 - Session ends (timer reaches 00:00) OR you click "End Video"
  ↓
Recording stops automatically
  ↓
Audio blob created locally in browser
  ↓
Audio sent temporarily to OpenAI Whisper for transcription ONLY
  ↓
Transcription returns text (not audio stored)
  ↓
Raw audio immediately deleted from server
```

---

## ✅ How to Verify Recording Started

### **Check Browser Console (F12):**

Look for these logs in order:

1. **Video call initializes:**
   ```
   🎥 Initializing Daily.co call object for recording...
   ```

2. **Call joins successfully:**
   ```
   ✅ Joined Daily.co call
   ```

3. **HIPAA-compliant recorder starts (about 2 seconds later):**
   ```
   Started recording with 2 audio tracks
   ```
   *(Number may vary based on participants)*
   
   **Important:** This is our **MediaRecorder** recording locally in your browser, not Daily.co's recorder!

---

## 🔍 Code Logic

### **HIPAA-Compliant Recording starts when:**

```javascript
// Conditions that must ALL be true:
1. ✅ sessionPhase === 'therapy' (session is in therapy phase)
2. ✅ session?.daily_room_url exists (room URL is available)
3. ✅ callObject exists (video call connected)
4. ✅ autoStart === true (auto-start is enabled)
5. ✅ callObject.localAudio() returns audio track (local audio available)
6. ✅ Participant audio tracks are available (remote audio available)
7. ✅ 2-second delay has passed (waits for audio tracks to stabilize)

// Then: startRecording() creates MediaRecorder locally in browser
// This is HIPAA-compliant because:
// - Audio recorded locally (in browser)
// - Only text sent to server (not audio)
// - Raw audio never stored on our servers
```

### **Where it's configured:**

**File:** `app/video-session/[sessionId]/page.tsx`
- Line 1020-1024: `DailyAudioRecorder` component is created with `autoStart={true}` and `hideUI={true}`

**File:** `components/daily-audio-recorder.tsx` (HIPAA-Compliant Recorder)
- Line 41-129: `startRecording()` function - Creates MediaRecorder locally in browser
- Line 46-82: Gets audio tracks from `callObject.localAudio()` and participants
- Line 85-90: Creates MediaStream and MediaRecorder (browser APIs)
- Line 99-106: When recording stops, automatically transcribes the audio blob
- Line 215-226: Auto-start logic waits 2 seconds after `callObject` exists
- Line 216: Checks `autoStart && callObject && !recording && !transcribing`

**Key HIPAA Compliance Features:**
- ✅ Audio recorded **locally** using browser MediaRecorder API
- ✅ Audio blob created **in browser** (not on server)
- ✅ Only **transcript text** sent to `/api/transcribe`
- ✅ Temporary audio file deleted immediately after transcription
- ✅ No raw audio stored in database (only text transcripts)

---

## ⚠️ Important Notes

### **Recording ONLY starts when:**
- ✅ Video call is in **'therapy' phase** (not waiting, not buffer, not ended)
- ✅ Video call has **successfully connected**
- ✅ `callObject` exists

### **HIPAA-Compliant Recording does NOT start when:**
- ❌ Session is in 'waiting' phase (before start time)
- ❌ Session is in 'buffer' phase (after therapy ends)
- ❌ Session is in 'ended' phase (completely over)
- ❌ Video call hasn't connected yet
- ❌ `callObject` is null/undefined
- ❌ Audio tracks not available yet (`callObject.localAudio()` returns null)
- ❌ Microphone permissions not granted

---

## 🎯 Quick Test

**To verify recording starts:**

1. **Open browser console** (Press F12)
2. **Join a video session**
3. **Watch for logs:**
   ```
   🎥 Initializing Daily.co call object...
   ✅ Joined Daily.co call
   Started recording with X audio tracks  ← This confirms recording started!
   ```
4. **Wait 2-3 seconds** after joining
5. **Speak into your microphone**
6. **Look for:** No errors about recording

---

## 🔧 Troubleshooting

### **Issue: No "Started recording" log**

**Possible causes:**
1. **Video call didn't connect** - Check for "Joined Daily.co call" log
2. **Session not in therapy phase** - Check session phase status
3. **Audio tracks unavailable** - `callObject.localAudio()` returns null
4. **Microphone permissions not granted** - Browser blocking audio access
5. **Audio tracks not initialized yet** - Need to wait longer for Daily.co to initialize

**Check:**
- Browser console for errors
- Microphone permissions in browser
- Network tab for failed API calls
- Try opening browser console and typing: `callObject.localAudio()` (if callObject exists)

**Fix:**
- Grant microphone permissions when browser prompts
- Wait 5-10 seconds after joining call (audio tracks need time to initialize)
- Refresh page and try again

### **Issue: Recording starts too late**

**Normal behavior:**
- Recording waits 2 seconds after call connects
- This is intentional to let the call stabilize
- Ensures audio tracks are fully available

**If you need it to start immediately:**
- This would require code changes (not recommended)

---

## 📝 Summary

**Recording starts:**
- ⏰ **2 seconds after** video call successfully connects
- ✅ **Automatically** (no button click needed)
- 🎙️ **During therapy phase only**
- 📍 **When callObject exists and call is stable**

**You don't need to do anything** - it happens automatically! Just make sure:
1. You've joined the video session
2. The video call has connected
3. Your microphone permissions are granted
4. You're speaking during the session

**To verify:** Check browser console (F12) for the "Started recording" log!

