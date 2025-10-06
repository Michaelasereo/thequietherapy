# 🏗️ Video Session Architecture - Current vs Required

## Current Architecture (Broken)

```
┌─────────────────────────────────────────────────────────────────┐
│                     VIDEO SESSION FLOW (CURRENT)                 │
└─────────────────────────────────────────────────────────────────┘

THERAPIST/PATIENT
      │
      ├─► Join Video Session
      │         │
      │         ▼
      │   ┌─────────────────────────────┐
      │   │ Video Session Page          │
      │   │ /app/video-session/[id]     │
      │   └─────────────────────────────┘
      │         │
      │         ├─► Loads Daily.co iframe
      │         │   (No JS access to streams)
      │         │
      │         ▼
      │   ┌─────────────────────────────┐
      │   │  <iframe src=daily.co>      │
      │   │  - Video works ✅           │
      │   │  - Audio works ✅           │
      │   │  - Recording NOT accessible │
      │   └─────────────────────────────┘
      │
      │   ❌ DailyAudioRecorder component
      │      EXISTS but NOT USED
      │
      └─► Session Ends
              │
              ▼
        ┌─────────────────────────────┐
        │ Complete Session API        │
        │ /api/sessions/complete      │
        └─────────────────────────────┘
              │
              ├─► Uses MOCK transcript ❌
              │   "Patient discussed..."
              │
              ▼
        ┌─────────────────────────────┐
        │ AI Service (lib/ai.ts)      │
        │ generateSOAPNotes()         │
        └─────────────────────────────┘
              │
              ├─► Returns MOCK notes ❌
              │   Just template text
              │
              ▼
        ┌─────────────────────────────┐
        │ Database: sessions table    │
        │ soap_notes = fake data      │
        └─────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ SEPARATE DISCONNECTED FLOW (Not Used):              │
│                                                      │
│  DailyAudioRecorder → Transcription API →           │
│       (Unused)      /api/transcribe                 │
│                           │                         │
│                           ▼                         │
│                    session_notes table              │
│                    (Has real transcript!)           │
│                    (But SOAP notes don't use it!)   │
└──────────────────────────────────────────────────────┘

RESULT: Video works, but no recording, fake AI notes
```

---

## Required Architecture (Fixed)

```
┌─────────────────────────────────────────────────────────────────┐
│                    VIDEO SESSION FLOW (REQUIRED)                 │
└─────────────────────────────────────────────────────────────────┘

THERAPIST/PATIENT
      │
      ├─► Join Video Session
      │         │
      │         ▼
      │   ┌─────────────────────────────────────────────┐
      │   │ Video Session Page                          │
      │   │ /app/video-session/[id]                     │
      │   │                                             │
      │   │ import DailyIframe from '@daily-co/daily-js'│
      │   │ import DailyAudioRecorder                   │
      │   └─────────────────────────────────────────────┘
      │         │
      │         ├─► Creates Daily.co Call Object ✅
      │         │   const daily = DailyIframe.createFrame()
      │         │
      │         ▼
      │   ┌─────────────────────────────────────────────┐
      │   │  Daily.co Call Object                       │
      │   │  - Video works ✅                           │
      │   │  - Audio works ✅                           │
      │   │  - JS Access to streams ✅                  │
      │   │  - callObject available ✅                  │
      │   └─────────────────────────────────────────────┘
      │         │
      │         ├─────────────────────┐
      │         │                     │
      │         ▼                     ▼
      │   ┌──────────────┐    ┌──────────────────────────┐
      │   │ Video UI     │    │ DailyAudioRecorder       │
      │   │ (embedded)   │    │ - Auto-starts ✅         │
      │   │              │    │ - Records audio ✅       │
      │   └──────────────┘    │ - Shows timer ✅         │
      │                       └──────────────────────────┘
      │                              │
      │                              │ Recording stops
      │                              │ when session ends
      │                              ▼
      │                       ┌──────────────────────────┐
      │                       │ Transcription API        │
      │                       │ /api/transcribe          │
      │                       │ - OpenAI Whisper ✅      │
      │                       └──────────────────────────┘
      │                              │
      │                              ▼
      │                       ┌──────────────────────────┐
      │                       │ Database                 │
      │                       │ session_notes table      │
      │                       │ transcript = REAL DATA ✅│
      │                       └──────────────────────────┘
      │
      └─► Session Ends
              │
              ▼
        ┌─────────────────────────────────────────────┐
        │ Complete Session API                        │
        │ /api/sessions/complete                      │
        └─────────────────────────────────────────────┘
              │
              ├─► Fetch REAL transcript from DB ✅
              │   SELECT transcript FROM session_notes
              │   WHERE session_id = ...
              │
              ▼
        ┌─────────────────────────────────────────────┐
        │ AI Service (lib/ai.ts)                      │
        │ generateSOAPNotes(REAL_TRANSCRIPT)          │
        │                                             │
        │ - OpenAI GPT-4 API ✅                       │
        │   OR                                        │
        │ - DeepSeek API ✅                           │
        │                                             │
        │ Prompt:                                     │
        │ "Generate SOAP notes from:                  │
        │  [ACTUAL SESSION TRANSCRIPT]"               │
        └─────────────────────────────────────────────┘
              │
              ├─► Returns REAL AI analysis ✅
              │   Based on actual conversation
              │
              ▼
        ┌─────────────────────────────────────────────┐
        │ Database: sessions table                    │
        │ soap_notes = REAL AI-GENERATED NOTES ✅     │
        │ ai_notes_generated = true                   │
        │ ai_notes_generated_at = timestamp           │
        └─────────────────────────────────────────────┘
              │
              ▼
        ┌─────────────────────────────────────────────┐
        │ Therapist Dashboard                         │
        │ /app/therapist/dashboard/client-sessions    │
        │                                             │
        │ ✅ View SOAP notes                          │
        │ ✅ View transcript                          │
        │ ✅ Edit notes (TODO)                        │
        │ ✅ Download PDF (TODO)                      │
        └─────────────────────────────────────────────┘

RESULT: Complete workflow - Recording, Transcription, Real AI Notes
```

---

## Component Interaction Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                        COMPONENT INTERACTIONS                       │
└────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  VIDEO SESSION PAGE                              │
│  /app/video-session/[sessionId]/page.tsx                         │
│                                                                  │
│  ┌────────────────────┐       ┌──────────────────────────┐     │
│  │                    │       │                          │     │
│  │  Daily.co Frame    │◄──────┤  Daily.co Call Object   │     │
│  │  (Video UI)        │       │  - callObject.join()    │     │
│  │                    │       │  - callObject.leave()   │     │
│  └────────────────────┘       │  - event listeners      │     │
│                               └──────────────────────────┘     │
│                                         │                       │
│                                         │ callObject            │
│                                         │ passed as prop        │
│                                         ▼                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  DailyAudioRecorder Component                          │    │
│  │  /components/daily-audio-recorder.tsx                  │    │
│  │                                                        │    │
│  │  • Receives callObject                                │    │
│  │  • Gets audio tracks from callObject.participants()   │    │
│  │  • Records with MediaRecorder API                     │    │
│  │  • Uploads to /api/transcribe                         │    │
│  │  • Displays transcription result                      │    │
│  └────────────────────────────────────────────────────────┘    │
│                               │                                 │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                                │ POST /api/transcribe
                                │ FormData { file, sessionId }
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              TRANSCRIPTION API                                   │
│  /app/api/transcribe/route.ts                                   │
│                                                                  │
│  • Receives audio file                                          │
│  • Calls OpenAI Whisper API ✅                                  │
│  • Saves to session_notes table ✅                              │
│  • Returns transcript text                                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ INSERT INTO session_notes
                                │ (session_id, transcript)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              DATABASE (Supabase)                                 │
│                                                                  │
│  ┌─────────────────────┐       ┌────────────────────────┐      │
│  │ session_notes       │       │ sessions               │      │
│  │                     │       │                        │      │
│  │ • session_id        │       │ • id                   │      │
│  │ • transcript ✅     │       │ • soap_notes           │      │
│  │ • created_at        │       │ • status               │      │
│  └─────────────────────┘       │ • recording_url        │      │
│                                └────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ When session ends
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              SESSION COMPLETE API                                │
│  /app/api/sessions/complete/route.ts                            │
│                                                                  │
│  1. Update session status to "completed"                        │
│  2. Fetch transcript from session_notes ← FIX NEEDED           │
│  3. Call generateSOAPNotes(REAL_TRANSCRIPT) ← FIX NEEDED        │
│  4. Save SOAP notes to sessions table                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ generateSOAPNotes(transcript)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              AI SERVICE                                          │
│  /lib/ai.ts                                                     │
│                                                                  │
│  Current: Returns mock template ❌                              │
│                                                                  │
│  Required: Call real AI API ✅                                  │
│  • OpenAI GPT-4                                                 │
│    POST https://api.openai.com/v1/chat/completions             │
│  OR                                                             │
│  • DeepSeek                                                     │
│    POST https://api.deepseek.com/v1/chat/completions           │
│                                                                  │
│  Returns: Real SOAP notes based on transcript                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ SOAP notes saved
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              THERAPIST DASHBOARD                                 │
│  /app/therapist/dashboard/client-sessions/page.tsx              │
│                                                                  │
│  ✅ Fetches past sessions                                       │
│  ✅ Shows AI-generated SOAP notes                               │
│  ✅ Shows manual notes                                          │
│  ✅ Toggle expand/collapse                                      │
│  ❌ Edit functionality (TODO)                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌───────────────────────────────────────────────────────────────────┐
│                         DATA FLOW                                  │
└───────────────────────────────────────────────────────────────────┘

TIME: Session Start
────────────────────
    1. Therapist clicks "Join Session"
         ↓
    2. Video Session Page loads
         ↓
    3. Daily.co Call Object created
         ↓
    4. DailyAudioRecorder component mounts
         ↓
    5. Recording starts automatically
         ↓
       [AUDIO RECORDING IN PROGRESS]
         ↓

TIME: Session End (30 minutes)
──────────────────────────────
    6. Recording stops automatically
         ↓
    7. Audio Blob created (WebM format)
         ↓
    8. POST /api/transcribe
       { file: audioBlob, sessionId: "xxx" }
         ↓
    9. OpenAI Whisper API called
         ↓
   10. Transcript returned: "Patient said... Therapist responded..."
         ↓
   11. Transcript saved to session_notes table
       ┌──────────────────────────────────┐
       │ session_notes                    │
       │ ─────────────────────────────── │
       │ session_id: "xxx"                │
       │ transcript: "Patient said..."    │
       │ created_at: 2025-10-01 14:30:00  │
       └──────────────────────────────────┘
         ↓

TIME: AI Processing
───────────────────
   12. POST /api/sessions/complete
       { sessionId: "xxx" }
         ↓
   13. Fetch transcript from session_notes
       SELECT transcript FROM session_notes
       WHERE session_id = "xxx"
         ↓
   14. Call generateSOAPNotes(transcript)
         ↓
   15. AI API processes transcript
       OpenAI GPT-4 or DeepSeek analyzes:
       "Patient said..." 
       → Generates SOAP format
         ↓
   16. SOAP notes returned
       ```
       Subjective: Patient reports...
       Objective: Therapist observed...
       Assessment: Clinical impression...
       Plan: Treatment recommendations...
       ```
         ↓
   17. Save to sessions table
       ┌──────────────────────────────────┐
       │ sessions                         │
       │ ─────────────────────────────── │
       │ id: "xxx"                        │
       │ status: "completed"              │
       │ soap_notes: "Subjective: ..."    │
       │ ai_notes_generated: true         │
       │ ai_notes_generated_at: timestamp │
       └──────────────────────────────────┘
         ↓

TIME: Therapist Views Notes
───────────────────────────
   18. Therapist opens dashboard
         ↓
   19. Fetches completed sessions
       SELECT * FROM sessions 
       WHERE therapist_id = "yyy"
       AND status = "completed"
         ↓
   20. Displays SOAP notes in UI
       ┌──────────────────────────────────┐
       │ ✅ Session #xxx                  │
       │ Date: Oct 1, 2025                │
       │ Client: John Doe                 │
       │                                  │
       │ 🧠 AI Notes Available            │
       │ [View Notes] ← Click             │
       │                                  │
       │ ▼ Expanded:                      │
       │ Subjective: Patient reports...   │
       │ Objective: Therapist observed... │
       │ Assessment: Clinical...          │
       │ Plan: Treatment...               │
       └──────────────────────────────────┘
```

---

## Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE SCHEMA                             │
└─────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ sessions                                       │
├────────────────────────────────────────────────┤
│ id                    UUID PK                  │
│ user_id               UUID FK → users          │
│ therapist_id          UUID FK → therapists     │
│ start_time            TIMESTAMP                │
│ end_time              TIMESTAMP                │
│ status                VARCHAR                  │
│ session_type          VARCHAR                  │
│ notes                 TEXT (manual notes)      │
│ soap_notes            TEXT (AI generated) ⭐   │
│ recording_url         TEXT                     │
│ daily_room_url        TEXT                     │
│ daily_room_name       TEXT                     │
│ ai_notes_generated    BOOLEAN ⭐               │
│ ai_notes_generated_at TIMESTAMP ⭐             │
│ created_at            TIMESTAMP                │
│ updated_at            TIMESTAMP                │
└────────────────────────────────────────────────┘
            │
            │ session_id FK
            ▼
┌────────────────────────────────────────────────┐
│ session_notes                                  │
├────────────────────────────────────────────────┤
│ id                    UUID PK                  │
│ session_id            UUID FK → sessions ⭐    │
│ transcript            TEXT (from Whisper) ⭐   │
│ notes                 TEXT                     │
│ created_by            VARCHAR                  │
│ ai_generated          BOOLEAN                  │
│ therapist_id          UUID FK                  │
│ created_at            TIMESTAMP                │
│ updated_at            TIMESTAMP                │
└────────────────────────────────────────────────┘

Key Points:
⭐ session_notes.transcript = Source for AI
⭐ sessions.soap_notes = AI output destination
⭐ Currently NOT linked in code!
```

---

## File Structure Reference

```
trpi-app/
│
├── app/
│   ├── video-session/
│   │   └── [sessionId]/
│   │       └── page.tsx ← MAIN INTEGRATION POINT
│   │                      (Need to add DailyAudioRecorder)
│   │
│   ├── therapist/
│   │   └── dashboard/
│   │       └── client-sessions/
│   │           └── page.tsx ← Notes display (works ✅)
│   │
│   └── api/
│       ├── transcribe/
│       │   └── route.ts ← Transcription API (works ✅)
│       │
│       ├── sessions/
│       │   ├── complete/
│       │   │   └── route.ts ← Need to fetch real transcript
│       │   │
│       │   └── notes/
│       │       └── route.ts ← Notes API (works ✅)
│       │
│       └── daily/
│           ├── create-room/
│           │   └── route.ts ← Room creation (works ✅)
│           └── token/
│               └── route.ts ← Token generation (works ✅)
│
├── components/
│   ├── daily-audio-recorder.tsx ← EXISTS but NOT USED ❌
│   │                               Need to integrate
│   └── video-session.tsx ← Old component (not main)
│
└── lib/
    ├── ai.ts ← MOCK implementation ❌
    │           Need real AI service
    │
    ├── daily.ts ← Daily.co API (works ✅)
    └── supabase.ts ← Database client (works ✅)
```

---

## Summary

### ✅ What Works:
- Video calls via Daily.co iframe
- Room creation and token generation
- Transcription API with OpenAI Whisper
- Database storage (schema correct)
- Notes display in therapist dashboard

### ❌ What's Broken:
- Recording component not integrated into video sessions
- AI SOAP notes use mock data (not real AI)
- Transcript not linked to SOAP note generation
- No automatic recording trigger
- No notes editing functionality

### 🔧 Key Fixes Needed:
1. Replace iframe with Daily.co JS SDK in video session page
2. Integrate DailyAudioRecorder component
3. Connect transcript fetch to SOAP notes generation
4. Implement real AI service (OpenAI or DeepSeek)
5. Add automatic recording on session start


