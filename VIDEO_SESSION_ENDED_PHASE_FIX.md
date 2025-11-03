# ✅ Video Session "Ended" Phase Fix

**Issue:** Users could not leave the video session after it completely ended (after both therapy and buffer periods).

**Root Cause:** The "ended" phase existed in the timer logic but had no UI rendering, so users saw a confusing state with no way to leave.

**Files Fixed:**
1. `app/video-session/[sessionId]/page.tsx` - Added "ended" phase UI

**Changes Made:**

### Added "Ended" Phase UI

**Before:** 
- Timer would set `sessionPhase` to `'ended'`
- But no UI was rendered for this state
- Users were stuck on a confusing screen with no leave button

**After:**
- Added a dedicated "ended" phase UI section
- Shows green checkmark icon
- Displays "Session Complete" message
- Provides "Return to Dashboard" button
- Clean, satisfying end to the session experience

### Phase Flow Now Works Correctly

```
WAITING (before session) 
  ↓
THERAPY (30 minutes - can leave anytime) 
  ↓
BUFFER (30 minutes - can leave anytime)
  ↓
ENDED (completely over - can leave to dashboard) ✅ NEW
```

**Result:** Users can now leave at ANY phase of the session! ✅

**User Experience:**
- ✅ Can leave during therapy if needed
- ✅ Can leave during buffer period  
- ✅ Can leave when session completely ended
- ✅ Always redirected to correct dashboard (therapist/user/admin)
- ✅ Clean, clear messaging at each phase

