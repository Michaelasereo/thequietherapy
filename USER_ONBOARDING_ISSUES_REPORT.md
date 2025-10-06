# User Onboarding Flow - Critical Issues Report

**Date:** October 1, 2025  
**Status:** 🔴 INCOMPLETE - Multiple Critical Gaps  
**Priority:** HIGH - Blocking new user acquisition

---

## Executive Summary

The core user onboarding flow has **significant gaps** that prevent new users from properly joining and using the platform. Users cannot select their account type during registration, there's no profile setup wizard, and the registration flow is incomplete or simulated in several places.

---

## 1. USER REGISTRATION → DASHBOARD FLOW

### Issue #1.1: Duplicate Registration Pages with Different Implementations

**Files Affected:**
- `/app/register/page.tsx` (Lines 39-47)
- `/app/signup/page.tsx` (Lines 23-56)

**Problem:**
```typescript
// /app/register/page.tsx - COMPLETELY SIMULATED
function onSubmit(data: RegisterFormValues) {
  // Simulate API call for registration
  console.log("Registering user:", data)
  toast({
    title: "Registration Successful!",
    description: "Please check your email for a verification link.",
  })
  setIsVerificationModalOpen(true)
}
```

- `/register` page **doesn't make any API calls** - it just logs to console and shows a modal
- `/signup` page properly calls `/api/auth/signup` endpoint
- **Confusion:** Landing page buttons link to `/signup`, but `/register` also exists
- Users might land on either page causing inconsistent experiences

**Impact:** 🔴 CRITICAL - Users registering via `/register` are not actually created in the database

---

### Issue #1.2: No User Type Selection During Registration

**Files Affected:**
- `/app/signup/page.tsx`
- `/components/hero-section.tsx` (Line 28)
- `/components/landing-navbar.tsx` (Lines 28, 37, 40)

**Problem:**
```typescript
// Signup page hardcodes user type to 'individual'
const response = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: formData.email, 
    fullName: formData.fullName 
  }),  // userType defaults to 'individual' in API
})
```

**Current State:**
- Landing page "Get Started" button → `/signup` → creates individual user only
- No option to choose: Individual | Therapist | Partner
- Separate pages exist but not discoverable:
  - Therapists: `/therapist/enroll`
  - Partners: `/partner/onboarding`
- No clear navigation path for different user types

**What's Missing:**
1. User type selection screen before/during registration
2. Clear CTA buttons for each user type on landing page
3. Routing logic to direct users to correct onboarding flow

**Impact:** 🔴 CRITICAL - Therapists and Partners cannot self-register through the main flow

---

### Issue #1.3: Direct Dashboard Redirect After Email Verification (No Onboarding)

**Files Affected:**
- `/app/api/auth/verify-email/route.ts` (Lines 119-135)

**Problem:**
```typescript
// After successful email verification:
const response = NextResponse.redirect(new URL('/dashboard', request.url))

response.cookies.set("trpi_user", JSON.stringify({
  id: userData.id,
  email: userData.email,
  name: userData.full_name,
  session_token: sessionToken
}), { ... })

console.log('✅ Redirecting to dashboard')
return response
```

**Issue:** Users are immediately sent to dashboard after verifying email with:
- ❌ No profile completion
- ❌ No biodata collection
- ❌ No onboarding tutorial
- ❌ No welcome wizard
- ❌ Empty dashboard (no context on what to do next)

**Impact:** 🟡 HIGH - Poor first-time user experience, likely high drop-off rate

---

## 2. USER PROFILE COMPLETION

### Issue #2.1: No Profile Setup Wizard for Individual Users

**Files Affected:**
- `/app/dashboard/biodata/page.tsx`
- `/app/dashboard/settings/page.tsx`

**Problem:**
- Biodata page exists at `/dashboard/biodata` but users aren't directed there
- No step-by-step wizard for:
  - Personal information
  - Medical history
  - Therapy preferences
  - Emergency contacts
  - Profile picture

**What Exists:**
```
✅ Therapist has multi-step enrollment: /therapist/enroll
   - Step 1: Basic Details
   - Step 2: Document Verification  
   - Step 3: Specialization & Languages
   - Step 4: Terms & Conditions

✅ Partner has multi-step onboarding: /partner/onboarding
   - Step 1: Institution Profile
   - Step 2: Privacy & Service Agreement

❌ Individual has NO onboarding wizard
   - Just gets dumped into dashboard
```

**Impact:** 🟡 HIGH - Incomplete user profiles, cannot book sessions without biodata

---

### Issue #2.2: Profile Completion Not Enforced

**Files Affected:**
- `/middleware.ts` (Lines 65-77)
- `/app/dashboard/layout.tsx` (Lines 13-23)

**Problem:**
```typescript
// Middleware only checks if user is authenticated
if (url.pathname.startsWith('/dashboard')) {
  const session = await SessionManager.getSessionFromRequest(req);
  
  if (!session || session.role !== 'individual') {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next(); // ❌ No profile completion check
}
```

**Missing:**
- No check for profile completion status
- Users can access entire dashboard with incomplete profiles
- No redirect to `/dashboard/biodata` or setup wizard
- No `is_profile_complete` flag in user table

**Impact:** 🟡 MEDIUM - Users may try to book sessions without completing required biodata

---

## 3. USER TYPE ROUTING & SELECTION

### Issue #3.1: No User Type Selection UI

**What's Needed:**
A page like `/signup/select-type` with:
```
┌─────────────────────────────────────────┐
│     Choose Your Account Type            │
├─────────────────────────────────────────┤
│                                         │
│  [I'm seeking therapy] → Individual     │
│  [I'm a therapist]     → Therapist      │
│  [I'm an organization] → Partner        │
│                                         │
└─────────────────────────────────────────┘
```

**Current State:**
- ❌ No such page exists
- Routes exist but are disconnected:
  - `/signup` → individual only
  - `/therapist/enroll` → therapist only  
  - `/partner/onboarding` → partner only

**Impact:** 🔴 CRITICAL - Cannot onboard therapists/partners through main flow

---

### Issue #3.2: Landing Page CTAs Don't Support All User Types

**Files Affected:**
- `/components/hero-section.tsx` (Line 28)
- `/components/landing-navbar.tsx` (Lines 37, 40)

**Current Implementation:**
```tsx
// Hero section
<Button asChild>
  <Link href="/signup">Get Started</Link>  {/* Only goes to individual signup */}
</Button>

// Navbar  
<Button asChild>
  <Link href="/signup">Get Started</Link>
</Button>
<Button asChild>
  <Link href="/book-session">Book a Session</Link>
</Button>
```

**What's Missing:**
- No "Join as Therapist" button
- No "Partner with Us" button
- Footer might have these links but not prominent

**Impact:** 🔴 CRITICAL - Therapists and partners cannot discover registration flow

---

## 4. EMAIL VERIFICATION FLOW

### Issue #4.1: Email Verification Works But Missing Post-Verification Flow

**Files Affected:**
- `/app/api/auth/verify-email/route.ts`

**Current State:**
```typescript
✅ Magic link created and sent
✅ Token validation works
✅ User marked as verified
✅ Session created
❌ No post-verification onboarding
```

**What Happens:**
1. User receives email → ✅
2. Clicks verification link → ✅
3. Account verified → ✅
4. Redirected to `/dashboard` → 🟡 (should go to onboarding)
5. Empty dashboard shown → ❌

**Impact:** 🟡 HIGH - Verified users don't know what to do next

---

## 5. USER ONBOARDING CHECKLIST

### Issue #5.1: No Onboarding Checklist Component

**Missing Component:**
```typescript
// Doesn't exist
<OnboardingChecklist>
  <ChecklistItem completed={user.emailVerified}>
    Verify your email
  </ChecklistItem>
  <ChecklistItem completed={user.profileComplete}>
    Complete your profile
  </ChecklistItem>
  <ChecklistItem completed={user.biodataComplete}>
    Fill in your biodata
  </ChecklistItem>
  <ChecklistItem completed={user.hasBookedSession}>
    Book your first session
  </ChecklistItem>
</OnboardingChecklist>
```

**Impact:** 🟡 MEDIUM - Users don't have clear next steps

---

### Issue #5.2: No User Progress Tracking

**Database Schema Missing:**
```sql
-- users table needs these columns:
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS biodata_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
```

**Impact:** 🟡 MEDIUM - Cannot track or enforce onboarding completion

---

## 6. SPECIFIC CODE LOCATIONS TO FIX

### Critical Files That Need Work:

1. **`/app/register/page.tsx`**
   - Lines 39-47: Remove simulated submit, call real API or delete this page entirely

2. **`/app/signup/page.tsx`**
   - Add user type selection before form
   - Or redirect to `/signup/select-type` first

3. **`/app/api/auth/verify-email/route.ts`**
   - Line 120: Change redirect from `/dashboard` to `/onboarding/welcome` or `/onboarding/profile-setup`

4. **`/middleware.ts`**
   - Lines 65-77: Add profile completion check
   - Redirect incomplete profiles to setup wizard

5. **`/components/hero-section.tsx`**
   - Line 28: Change "Get Started" to show user type selection

6. **`/components/landing-navbar.tsx`**
   - Lines 37-40: Add separate CTAs for different user types

---

## 7. RECOMMENDED FIXES (Priority Order)

### 🔴 P0 - Critical (Ship Blockers)

1. **Create User Type Selection Page**
   - File: `/app/signup/select-type/page.tsx` (NEW)
   - Update hero & navbar CTAs to link here
   - Route to appropriate onboarding based on selection

2. **Fix or Remove `/app/register/page.tsx`**
   - Either implement proper API call or delete page
   - Update all internal links

3. **Create Individual User Onboarding Wizard**
   - File: `/app/onboarding/individual/page.tsx` (NEW)
   - Multi-step wizard similar to therapist enrollment
   - Steps: Welcome → Profile → Biodata → Preferences → Complete

### 🟡 P1 - High Priority

4. **Add Profile Completion Middleware**
   - Update `/middleware.ts`
   - Check `profile_completed` flag
   - Redirect to setup wizard if incomplete

5. **Create Onboarding Checklist Component**
   - File: `/components/onboarding-checklist.tsx` (NEW)
   - Show on dashboard until completed
   - Track progress in database

6. **Update Database Schema**
   - Add onboarding tracking columns to `users` table
   - Create migration script

### 🟢 P2 - Medium Priority

7. **Add Post-Verification Onboarding**
   - Update email verification redirect
   - Create welcome page with next steps

8. **Improve Landing Page CTAs**
   - Clear buttons for each user type
   - Better discovery of therapist/partner flows

---

## 8. EXAMPLE: PROPER ONBOARDING FLOW (What It Should Be)

### Individual User:
```
1. Land on homepage
2. Click "Get Started" → /signup/select-type
3. Choose "I'm seeking therapy" → /signup/individual
4. Enter email + name → Verification email sent
5. Click email link → Email verified
6. Redirect to /onboarding/individual/welcome
7. Step 1: Welcome & Platform Overview
8. Step 2: Complete Profile (name, DOB, gender)
9. Step 3: Medical History & Biodata
10. Step 4: Therapy Preferences
11. Step 5: Choose Therapist Matching Preferences
12. Redirect to /dashboard (with onboarding checklist)
13. Prompt to book first session
```

### Therapist:
```
1. Land on homepage  
2. Click "Join as Therapist" → /therapist/enroll
3. [ALREADY EXISTS - Multi-step enrollment works]
4. Verification & approval process
5. Access to /therapist/dashboard
```

### Partner:
```
1. Land on homepage
2. Click "Partner with Us" → /partner/onboarding  
3. [ALREADY EXISTS - Multi-step onboarding works]
4. Verification & approval process
5. Access to /partner/dashboard
```

---

## 9. TESTING CHECKLIST (After Fixes)

- [ ] User can select account type before registration
- [ ] Individual signup creates account and sends verification email
- [ ] Email verification redirects to onboarding wizard (not dashboard)
- [ ] Onboarding wizard collects all required profile data
- [ ] Profile completion is enforced before accessing dashboard features
- [ ] Dashboard shows onboarding checklist until complete
- [ ] First-time users see clear next steps
- [ ] Therapist enrollment flow still works
- [ ] Partner onboarding flow still works
- [ ] Middleware redirects incomplete profiles to setup wizard
- [ ] Cannot book session without completing biodata

---

## 10. ESTIMATED EFFORT

| Task | Complexity | Time Estimate |
|------|-----------|---------------|
| User type selection page | Medium | 4-6 hours |
| Individual onboarding wizard | High | 12-16 hours |
| Profile completion middleware | Low | 2-3 hours |
| Database schema updates | Low | 1-2 hours |
| Onboarding checklist component | Medium | 4-6 hours |
| Landing page CTA updates | Low | 2-3 hours |
| Testing & QA | Medium | 6-8 hours |
| **TOTAL** | | **31-44 hours** |

---

## 11. RELATED ISSUES

This report connects to:
- **Authentication Issues** - Users getting authenticated but not onboarded
- **Dashboard Experience** - Empty dashboard for new users
- **Session Booking** - Cannot book without complete profile
- **User Retention** - High drop-off due to poor onboarding

---

## 12. RECOMMENDED SOLUTIONS (Two Approaches)

### 🚀 **OPTION A: QUICK FIX - Simple Onboarding Modal (30 minutes)**

**Best for:** Immediate deployment, minimal changes, non-blocking UX

**Implementation:**

1. **Create Modal Component** - `components/onboarding-modal.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X } from 'lucide-react'

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed')
    if (!hasCompletedOnboarding) {
      setIsOpen(true)
    }
  }, [])

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true')
    setIsOpen(false)
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4"
          onClick={handleComplete}
        >
          <X className="h-4 w-4" />
        </Button>

        <CardHeader>
          <CardTitle>
            {currentStep === 1 && 'Welcome to TRPI! 👋'}
            {currentStep === 2 && 'Complete Your Profile 📝'}
            {currentStep === 3 && "You're All Set! 🎉"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {currentStep === 1 && (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Let's get you set up in just a few quick steps.
              </p>
              <ul className="text-sm space-y-2">
                <li>• Complete your profile</li>
                <li>• Set your preferences</li>
                <li>• Start your wellness journey</li>
              </ul>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Add some basic info to personalize your experience.
              </p>
              <Button asChild variant="outline" className="w-full">
                <a href="/dashboard/biodata">Complete Profile Now</a>
              </Button>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                You're ready to start your mental wellness journey!
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <div className="flex space-x-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full ${
                    i + 1 <= currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            
            <div className="flex space-x-2">
              {currentStep < totalSteps && (
                <Button variant="outline" onClick={handleComplete}>
                  Skip
                </Button>
              )}
              <Button onClick={handleNext}>
                {currentStep === totalSteps ? 'Get Started' : 'Next'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

2. **Add to Dashboard Layout** - Update `app/dashboard/layout.tsx`:
```tsx
import { OnboardingModal } from '@/components/onboarding-modal'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex h-screen">
        {children}
      </div>
      <OnboardingModal />
    </>
  )
}
```

**Benefits:**
- ✅ Non-blocking - users can skip anytime
- ✅ No routing changes needed
- ✅ No database migrations required
- ✅ Ships in 30 minutes
- ✅ Mobile-friendly

---

### 🏗️ **OPTION B: PROPER ARCHITECTURE - Separate Login Flows**

**Best for:** Long-term scalability, proper separation of concerns

**Architecture Overview:**

```
/app/
├── login/                    # Generic login (redirects by type)
├── signup/                   # User type selection page
├── individual/               # INDIVIDUAL USER FLOW
│   ├── login/page.tsx       
│   ├── signup/page.tsx      
│   └── onboarding/page.tsx  
├── therapist/               # THERAPIST FLOW
│   ├── login/page.tsx
│   ├── signup/page.tsx 
│   └── onboarding/page.tsx
└── partner/                 # PARTNER FLOW
    ├── login/page.tsx
    ├── signup/page.tsx
    └── onboarding/page.tsx
```

**Implementation Steps:**

1. **Fix Landing Page CTAs** - `components/hero-section.tsx`:
```tsx
<div className="flex flex-col gap-3 min-[400px]:flex-row">
  <Button asChild size="lg" className="bg-black text-white hover:bg-gray-800">
    <Link href="/signup">I Need Therapy</Link>
  </Button>
  <Button asChild variant="outline" size="lg">
    <Link href="/therapist/enroll">I'm a Therapist</Link>
  </Button>
  <Button asChild variant="outline" size="lg">
    <Link href="/partner/onboarding">Partner with Us</Link>
  </Button>
</div>
```

2. **Create User Type Selection** - `app/signup/page.tsx`:
```tsx
export default function SignupTypeSelection() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">Choose Your Account Type</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle>I Need Therapy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Find the right therapist for your needs
              </p>
              <Button asChild className="w-full">
                <Link href="/individual/signup">Sign Up</Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle>I'm a Therapist</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Join our network of professionals
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/therapist/enroll">Apply Now</Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle>I'm a Partner</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Organization or healthcare provider
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/partner/onboarding">Partner With Us</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
```

3. **Create Individual Signup** - `app/individual/signup/page.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

export default function IndividualSignup() {
  const { toast } = useToast()
  const [formData, setFormData] = useState({ email: '', fullName: '' })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email, 
          fullName: formData.fullName,
          userType: 'individual' 
        }),
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Verification Link Sent!',
          description: 'Please check your email to complete registration.',
        })
      } else {
        toast({
          title: 'Signup Failed',
          description: result.error || 'Something went wrong.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Signup Failed',
        description: 'Network error. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Your Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

4. **Fix Register Page** - `app/register/page.tsx`:
```tsx
import { redirect } from 'next/navigation'

export default function RegisterPage() {
  redirect('/signup')
}
```

5. **Update Email Verification** - `app/api/auth/verify-email/route.ts` (line ~120):
```tsx
// Get user type from verification metadata
const userType = verification.metadata?.user_type || 'individual'

// Redirect based on user type
const dashboardPath = {
  individual: '/dashboard',
  therapist: '/therapist/dashboard',
  partner: '/partner/dashboard'
}[userType]

const response = NextResponse.redirect(new URL(dashboardPath, request.url))
```

**Benefits:**
- ✅ Clear separation of user types
- ✅ Dedicated flows for each type
- ✅ Scalable architecture
- ✅ Better user experience per type
- ✅ Easier to maintain

**Effort:** 8-12 hours implementation

---

### 🎯 **OPTION C: FOCUSED FIX - Progressive Onboarding with Tracking (1 hour)**

**Best for:** Quick deployment with proper tracking, maintains separate user type flows

**Implementation:**

1. **Create Progressive Onboarding Modal** - `components/onboarding-modal.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  user: any
}

export function OnboardingModal({ isOpen, onClose, user }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [canSkip, setCanSkip] = useState(false)
  const router = useRouter()

  // Allow skipping after 10 seconds (not immediately)
  useEffect(() => {
    const timer = setTimeout(() => setCanSkip(true), 10000)
    return () => clearTimeout(timer)
  }, [])

  const steps = [
    { number: 1, title: 'Welcome!', description: "Let's set up your profile" },
    { number: 2, title: 'Basic Info', description: 'Tell us about yourself' },
    { number: 3, title: 'Health Goals', description: 'What brings you here?' },
    { number: 4, title: 'Preferences', description: 'Therapist matching preferences' },
    { number: 5, title: 'Complete!', description: 'Ready to start your journey' }
  ]

  const handleComplete = async () => {
    // Mark onboarding as completed in database
    await fetch('/api/user/complete-onboarding', { method: 'POST' })
    onClose()
    router.refresh()
  }

  const handleSkip = () => {
    // Still mark as seen but not completed
    localStorage.setItem('onboarding-skipped', 'true')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Step {currentStep} of 5</span>
              <span>{Math.round((currentStep / 5) * 100)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>
          </div>

          <CardTitle className="text-center">
            {steps[currentStep - 1].title}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* Step content */}
          <p className="text-center text-muted-foreground mb-6">
            {steps[currentStep - 1].description}
          </p>

          {/* Step-specific content */}
          {currentStep === 2 && (
            <Button asChild variant="outline" className="w-full mb-4">
              <a href="/dashboard/biodata">Complete Profile</a>
            </Button>
          )}

          {currentStep === 3 && (
            <div className="space-y-2 text-sm mb-4">
              <p>• Manage stress and anxiety</p>
              <p>• Improve relationships</p>
              <p>• Personal growth</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            {currentStep > 1 ? (
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Back
              </Button>
            ) : (
              <div /> // Spacer
            )}

            <div className="flex gap-2">
              {canSkip && currentStep === 1 && (
                <Button
                  variant="outline"
                  onClick={handleSkip}
                >
                  Skip for now
                </Button>
              )}
              
              {currentStep < 5 ? (
                <Button onClick={() => setCurrentStep(currentStep + 1)}>
                  Continue
                </Button>
              ) : (
                <Button onClick={handleComplete}>
                  Complete Setup
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

2. **Add Onboarding Helper** - `lib/onboarding.ts`:
```tsx
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function checkOnboardingStatus() {
  try {
    // Get user from session cookie
    const cookieStore = cookies()
    const userCookie = cookieStore.get('trpi_user')
    
    if (!userCookie) {
      return { user: null, hasCompletedOnboarding: false }
    }

    const user = JSON.parse(userCookie.value)

    // Check if user has completed onboarding
    const { data, error } = await supabase
      .from('users')
      .select('has_completed_onboarding, onboarding_data')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error checking onboarding status:', error)
      return { user, hasCompletedOnboarding: false }
    }

    return {
      user,
      hasCompletedOnboarding: data?.has_completed_onboarding || false
    }
  } catch (error) {
    console.error('Onboarding status check failed:', error)
    return { user: null, hasCompletedOnboarding: false }
  }
}
```

3. **Update Dashboard** - Modify `app/dashboard/page.tsx`:
```tsx
import { OnboardingModal } from '@/components/onboarding-modal'
import { checkOnboardingStatus } from '@/lib/onboarding'

export default async function DashboardPage() {
  const { user, hasCompletedOnboarding } = await checkOnboardingStatus()
  
  return (
    <>
      <div className="p-6">
        <h1 className="text-2xl font-bold">Welcome to Your Dashboard</h1>
        
        {!hasCompletedOnboarding && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              Complete your profile to get the most out of TRPI
            </p>
          </div>
        )}
        
        {/* Your existing dashboard content */}
      </div>

      {/* Show onboarding modal for new users */}
      {!hasCompletedOnboarding && (
        <OnboardingModal 
          isOpen={true}
          onClose={() => {}}
          user={user}
        />
      )}
    </>
  )
}
```

4. **Database Migration** - Run this SQL:
```sql
-- Add onboarding tracking columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1;

-- Update existing users to have completed onboarding (grandfathered)
UPDATE users 
SET has_completed_onboarding = TRUE 
WHERE created_at < NOW() - INTERVAL '1 day';
```

5. **Completion API** - Create `app/api/user/complete-onboarding/route.ts`:
```tsx
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Get user from cookie
    const cookieStore = cookies()
    const userCookie = cookieStore.get('trpi_user')
    
    if (!userCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = JSON.parse(userCookie.value)

    // Mark user as having completed onboarding
    const { error } = await supabase
      .from('users')
      .update({ 
        has_completed_onboarding: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) {
      console.error('Error completing onboarding:', error)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Onboarding completion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Benefits:**
- ✅ Proper database tracking (not just localStorage)
- ✅ 5-step progressive flow with clear progression
- ✅ Non-blocking with delayed skip option
- ✅ Links directly to profile completion pages
- ✅ Maintains separate user type flows
- ✅ Grandfathers existing users automatically

**What This Fixes:**

| Problem | Solution |
|---------|----------|
| Users dumped into empty dashboard | Friendly 5-step modal welcome |
| No guidance on next steps | Clear progression with CTAs |
| Can't track onboarding | Database columns + API endpoint |
| Poor first-time experience | Engaging, skippable flow |
| No profile completion tracking | has_completed_onboarding flag |

**Effort:** 1 hour implementation (components + migration + API)

---

## 13. IMPLEMENTATION PRIORITY

### 🚦 **RECOMMENDED APPROACH BY SCENARIO:**

#### **Scenario 1: Need Something NOW (Ship This Week)**
→ **Choose Option A or C**
- **Option A:** 30 minutes, localStorage-based, zero dependencies
- **Option C:** 1 hour, database-backed, proper tracking
- Both are non-blocking and ready to ship immediately

#### **Scenario 2: Building for Scale (Next Month)**
→ **Choose Option B**
- 8-12 hours implementation
- Separate flows for individual/therapist/partner
- Proper architecture for long-term maintenance
- Best user experience per type

#### **Scenario 3: Two-Phase Approach (Recommended)**

**Phase 1 (This Week):**
- Implement **Option C (Progressive Modal)** 
- Time: 1 hour
- Gets you proper tracking + good UX immediately

**Phase 2 (Next Sprint):**
- Implement **Option B (Separate Flows)** 
- Time: 8-12 hours
- Proper long-term architecture

**Why This Approach?**
1. Option C provides immediate UX improvement with proper tracking
2. Option B provides proper long-term architecture
3. They work together - modal stays even after separate flows
4. No wasted work - both solutions complement each other
5. Database schema from Option C is reused in Option B

---

### 📊 **COMPARISON TABLE:**

| Feature | Option A | Option C | Option B |
|---------|----------|----------|----------|
| **Time to Ship** | 30 min | 1 hour | 8-12 hours |
| **Database Changes** | None | Yes (simple) | Yes (complex) |
| **Tracking** | localStorage | Database | Database |
| **User Experience** | Good | Better | Best |
| **Scalability** | Limited | Good | Excellent |
| **Maintains Separate Flows** | ✅ | ✅ | ✅ |
| **Grandfathers Existing Users** | Manual | ✅ Automatic | ✅ Automatic |
| **Profile Completion Links** | Basic | Direct CTAs | Integrated |
| **Skip Option** | Immediate | Delayed (10s) | N/A |
| **Progress Tracking** | ❌ | ✅ | ✅ |
| **Best For** | MVP/Testing | Production | Enterprise |

---

## NEXT STEPS

1. **Review this document** with senior developer
2. **Choose approach:** Quick modal fix vs. proper architecture vs. both
3. **Prioritize P0 fixes** for immediate implementation
4. **Create detailed technical specs** for chosen approach
5. **Assign tasks** to development team
6. **Set up staging environment** for testing
7. **Create test scenarios** for QA validation

---

**Report Generated:** October 1, 2025  
**Last Updated:** October 1, 2025  
**For Questions Contact:** Development Team


