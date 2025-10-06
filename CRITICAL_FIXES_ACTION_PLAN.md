# 🚨 Critical Fixes Action Plan

## **Priority 1: Authentication & API Stability** 🔐

### **Issue**: 401/403 Errors, WebSocket Failures, API 500 Errors
### **Root Cause**: Session token management and Supabase configuration

### **Immediate Actions:**

#### **1. Fix Authentication Flow**
```typescript
// File: app/video-session/[sessionId]/page.tsx
// Add at the top of useEffect for session fetching

const validateAndRefreshAuth = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Auth error:', error)
      throw new Error('Authentication failed')
    }
    
    if (!session) {
      console.log('🔄 No session, redirecting to login...')
      router.push('/auth/login')
      return false
    }
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000)
    if (session.expires_at && session.expires_at < now) {
      console.log('🔄 Token expired, refreshing...')
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.error('❌ Token refresh failed:', refreshError)
        router.push('/auth/login')
        return false
      }
    }
    
    return true
  } catch (error) {
    console.error('❌ Auth validation failed:', error)
    router.push('/auth/login')
    return false
  }
}
```

#### **2. Fix API Error Handling**
```typescript
// File: app/video-session/[sessionId]/page.tsx
// Replace the current fetchSessionDetails function

const fetchSessionDetails = async () => {
  try {
    // Validate auth first
    const isAuthenticated = await validateAndRefreshAuth()
    if (!isAuthenticated) return null

    console.log('🔄 Fetching session details...')
    
    // Try multiple endpoints with proper error handling
    const endpoints = [
      `/api/sessions/${sessionId}`,
      '/api/sessions/upcoming',
      '/api/sessions/history'
    ]
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Session data fetched from:', endpoint)
          return data
        }
        
        if (response.status === 401) {
          console.log('🔄 401 error, refreshing auth...')
          await validateAndRefreshAuth()
          continue
        }
        
        console.log(`❌ ${endpoint} failed with status:`, response.status)
      } catch (error) {
        console.error(`❌ ${endpoint} error:`, error)
        continue
      }
    }
    
    throw new Error('All session endpoints failed')
  } catch (error) {
    console.error('❌ Failed to fetch session details:', error)
    throw error
  }
}
```

#### **3. Fix Supabase Configuration**
```typescript
// File: lib/supabase.ts (create if doesn't exist)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})
```

---

## **Priority 2: Timer Display Bug** ⏰

### **Issue**: Timer shows 60 minutes instead of 30-minute countdown
### **Root Cause**: Incorrect time calculations in timer logic

### **Immediate Actions:**

#### **1. Fix Timer Calculation Logic**
```typescript
// File: app/video-session/[sessionId]/page.tsx
// Replace the timer useEffect (lines 85-158)

useEffect(() => {
  if (!session) return

  const interval = setInterval(() => {
    const now = new Date()
    
    // Get session start time (prioritize scheduled_date + scheduled_time)
    let sessionStartTime
    if (session.scheduled_date && session.scheduled_time) {
      sessionStartTime = new Date(`${session.scheduled_date}T${session.scheduled_time}`)
    } else {
      sessionStartTime = new Date(session.start_time)
    }
    
    // Define durations in seconds
    const THERAPY_DURATION = 30 * 60 // 30 minutes
    const BUFFER_DURATION = 30 * 60 // 30 minutes
    const TOTAL_DURATION = THERAPY_DURATION + BUFFER_DURATION // 60 minutes total
    
    const therapyEndTime = new Date(sessionStartTime.getTime() + THERAPY_DURATION * 1000)
    const bufferEndTime = new Date(sessionStartTime.getTime() + TOTAL_DURATION * 1000)
    
    // Debug logging
    console.log('🔍 Timer Debug:', {
      now: now.toISOString(),
      sessionStart: sessionStartTime.toISOString(),
      therapyEnd: therapyEndTime.toISOString(),
      bufferEnd: bufferEndTime.toISOString(),
      therapyDuration: THERAPY_DURATION,
      bufferDuration: BUFFER_DURATION
    })
    
    if (now < sessionStartTime) {
      // WAITING: Countdown to session start
      const timeUntilStart = Math.floor((sessionStartTime.getTime() - now.getTime()) / 1000)
      setSessionTime(-timeUntilStart)
      setSessionPhase('waiting')
      console.log('⏰ WAITING:', { timeUntilStart })
      
    } else if (now >= sessionStartTime && now < therapyEndTime) {
      // THERAPY: 30-minute countdown from session start
      const elapsed = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000)
      const remaining = Math.max(0, THERAPY_DURATION - elapsed)
      setSessionTime(remaining)
      setSessionPhase('therapy')
      console.log('⏰ THERAPY:', { elapsed, remaining, sessionTime: remaining })
      
    } else if (now >= therapyEndTime && now < bufferEndTime) {
      // BUFFER: 30-minute buffer period
      const bufferElapsed = Math.floor((now.getTime() - therapyEndTime.getTime()) / 1000)
      const bufferRemaining = Math.max(0, BUFFER_DURATION - bufferElapsed)
      setSessionTime(bufferRemaining)
      setSessionPhase('buffer')
      console.log('⏰ BUFFER:', { bufferElapsed, bufferRemaining })
      
    } else {
      // ENDED: Session completely finished
      setSessionTime(0)
      setSessionPhase('ended')
      console.log('⏰ ENDED')
    }
  }, 1000)
  
  setTimerRef(interval)
  return () => clearInterval(interval)
}, [session])
```

#### **2. Fix Video Call Control**
```typescript
// File: app/video-session/[sessionId]/page.tsx
// Update the video control useEffect

useEffect(() => {
  const iframe = document.getElementById('daily-iframe') as HTMLIFrameElement
  if (!iframe || !session) return

  console.log('🎥 Video Control:', { sessionPhase, isConnected })
  
  if (sessionPhase === 'therapy' && isConnected) {
    // Show video call during therapy phase only
    iframe.style.display = 'block'
    console.log('✅ Video call active during therapy')
  } else {
    // Hide video call during waiting, buffer, and ended phases
    iframe.style.display = 'none'
    console.log('❌ Video call hidden - phase:', sessionPhase)
  }
}, [sessionPhase, session, isConnected])
```

---

## **Priority 3: Performance & Production Readiness** 🚀

### **Immediate Actions:**

#### **1. Remove Debug Logging**
```typescript
// File: app/video-session/[sessionId]/page.tsx
// Remove or comment out all console.log statements in production

// Replace debug logs with conditional logging
const DEBUG = process.env.NODE_ENV === 'development'

if (DEBUG) {
  console.log('🔍 Timer Debug:', { ... })
}
```

#### **2. Add Error Boundaries**
```typescript
// File: components/ErrorBoundary.tsx (create new file)
'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Session Error</h2>
            <p className="mb-4">Something went wrong with your session.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Session
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

#### **3. Add Loading States**
```typescript
// File: app/video-session/[sessionId]/page.tsx
// Add loading state management

const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

// Update the loading UI
if (isLoading) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p>Loading session...</p>
      </div>
    </div>
  )
}

if (error) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center text-white">
        <h2 className="text-2xl font-bold mb-4 text-red-400">Session Error</h2>
        <p className="mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    </div>
  )
}
```

---

## **Testing Checklist** ✅

### **Before Deployment:**
- [ ] Timer shows correct 30-minute countdown
- [ ] Video call only active during therapy phase
- [ ] Authentication works without 401/403 errors
- [ ] API calls succeed without 500 errors
- [ ] WebSocket connections stable
- [ ] Error boundaries catch and handle failures
- [ ] Loading states display properly
- [ ] Debug logs removed from production

### **Test Scenarios:**
1. **Session Start**: Timer counts down from 30:00 to 00:00
2. **Buffer Period**: Timer shows buffer countdown after therapy
3. **Video Control**: Video only visible during therapy phase
4. **Error Handling**: Graceful failure with retry options
5. **Authentication**: Token refresh works automatically

---

## **Deployment Steps** 🚀

1. **Fix authentication flow** (Priority 1)
2. **Fix timer calculations** (Priority 2)  
3. **Add error handling** (Priority 3)
4. **Test with real session data**
5. **Remove debug logging**
6. **Deploy to staging**
7. **Run integration tests**
8. **Deploy to production**

This action plan addresses the critical issues in order of priority, with specific code fixes and testing procedures for your senior developer to implement immediately.
