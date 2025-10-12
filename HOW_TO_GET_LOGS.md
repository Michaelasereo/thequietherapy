# How to Get the Error Logs

## 🔍 What I Need to See

I need BOTH of these:

### 1. Terminal Logs (Server-Side)
**Where:** The terminal window where you ran `npm run dev`

**What to look for:**
```
📋 Clients API called with: ...
📅 Received request body: ...
📅 Time formatting: ...
📅 Creating session with data: ...
❌ Error creating session: ...
```

**How to get it:**
1. Look at your terminal (not browser)
2. Try to create a session again
3. Copy ALL the log lines that appear
4. Paste them here

---

### 2. Browser Console Error (Client-Side)
**Where:** Browser DevTools Console (F12 → Console tab)

**What to look for:**
```
page.tsx:230 📅 Response status: 500
page.tsx:231 📅 Response data: {error: '...', details: '...'}
```

**How to get it:**
1. Open DevTools (F12 or right-click → Inspect)
2. Go to Console tab
3. Try to create a session again
4. Find the line that says "📅 Response data:"
5. Click the arrow to expand the error object
6. Copy the ENTIRE error message including details, hint, code
7. Paste it here

---

## 🎯 Example of What I Need

**Terminal logs should show:**
```
📅 Received request body: {
  patientId: '...',
  scheduledDate: '2024-10-15',
  scheduledTime: '10:00',
  ...
}
📅 Creating session with data: { user_id: '...', therapist_id: '...', ... }
❌ Error creating session: { message: '...', code: '...', details: '...' }
```

**Browser console should show:**
```
📅 Response data: {
  error: 'Failed to create session',
  details: 'Could not find the 'X' column of 'sessions' in the schema cache',
  hint: null,
  code: 'PGRST204'
}
```

---

## 🚨 Quick Steps

1. **Keep your terminal visible** (don't close it)
2. **Open browser DevTools Console**
3. **Try to create a session**
4. **Immediately look at BOTH:**
   - Terminal logs (scroll up if needed)
   - Browser console logs
5. **Copy everything** starting from "📅 Received request" or "📋 Clients API"
6. **Paste it ALL here**

Without these logs, I'm working blind! 🙈

