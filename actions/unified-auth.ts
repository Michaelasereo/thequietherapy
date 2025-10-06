"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createMagicLinkForAuthType, verifyMagicLinkForAuthType } from "@/lib/auth"

export type UserType = 'individual' | 'therapist' | 'partner' | 'admin'

export interface AuthResult {
  success: boolean
  error?: string
  message?: string
}

export interface SignUpData {
  email: string
  firstName?: string
  organizationName?: string
  [key: string]: any
}

/**
 * UNIFIED: Generic login function for all user types
 * Replaces individual auth files with a single, consistent implementation
 */
export async function signIn(email: string, userType: UserType): Promise<AuthResult> {
  console.log(`🔑 signIn called for ${userType}:`, { email })

  if (!email.trim()) {
    return { success: false, error: "Please enter your email address." }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.trim())) {
    return { success: false, error: "Please enter a valid email address." }
  }

  try {
    const result = await createMagicLinkForAuthType(
      email.trim(),
      userType,
      'login',
      {
        user_type: userType
      }
    )

    if (result.success) {
      return { 
        success: true, 
        message: "Magic link sent! Check your email to log in." 
      }
    } else {
      return { 
        success: false, 
        error: result.error || "Failed to send magic link. Please try again." 
      }
    }
  } catch (error) {
    console.error(`Error in signIn for ${userType}:`, error)
    return { success: false, error: "An error occurred. Please try again." }
  }
}

/**
 * UNIFIED: Generic sign-up function for all user types
 */
export async function signUp(
  signUpData: SignUpData, 
  userType: UserType
): Promise<AuthResult> {
  console.log(`🔑 signUp called for ${userType}:`, { email: signUpData.email })

  if (!signUpData.email?.trim()) {
    return { success: false, error: "Please enter your email address." }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(signUpData.email.trim())) {
    return { success: false, error: "Please enter a valid email address." }
  }

  try {
    const result = await createMagicLinkForAuthType(
      signUpData.email.trim(),
      userType,
      'signup',
      {
        user_type: userType,
        first_name: signUpData.firstName,
        organization_name: signUpData.organizationName,
        ...signUpData
      }
    )

    if (result.success) {
      return { 
        success: true, 
        message: "Account created! Check your email to verify and log in." 
      }
    } else {
      return { 
        success: false, 
        error: result.error || "Failed to create account. Please try again." 
      }
    }
  } catch (error) {
    console.error(`Error in signUp for ${userType}:`, error)
    return { success: false, error: "An error occurred. Please try again." }
  }
}

/**
 * UNIFIED: Generic magic link verification for all user types
 */
export async function verifyMagicLink(
  token: string, 
  userType: UserType
): Promise<void> {
  try {
    const result = await verifyMagicLinkForAuthType(token, userType)
    
    if (result.success && result.user) {
      // Verify user type matches
      if (result.user.user_type !== userType) {
        throw new Error("Invalid user type for this verification link.")
      }

      // Set appropriate session cookie based on user type
      const cookieStore = await cookies()
      const cookieName = `trpi_${userType}_user`
      
      cookieStore.set(cookieName, JSON.stringify({
        id: result.user.id,
        name: result.user.full_name || result.user.email.split('@')[0],
        email: result.user.email,
        role: userType,
        session_token: result.user.session_token
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
      })

      // Redirect to appropriate dashboard
      const redirectPath = getDashboardPath(userType)
      redirect(redirectPath)
    } else {
      throw new Error(result.error || "Invalid or expired magic link.")
    }
  } catch (error) {
    console.error(`Error in verifyMagicLink for ${userType}:`, error)
    // Redirect to error page with message
    redirect(`/auth/error?message=${encodeURIComponent(error instanceof Error ? error.message : 'Verification failed')}`)
  }
}

/**
 * Get the appropriate dashboard path for each user type
 */
function getDashboardPath(userType: UserType): string {
  switch (userType) {
    case 'individual':
      return '/dashboard'
    case 'therapist':
      return '/therapist/dashboard'
    case 'partner':
      return '/partner/dashboard'
    case 'admin':
      return '/admin/dashboard'
    default:
      return '/dashboard'
  }
}

/**
 * UNIFIED: Generic logout function for all user types
 */
export async function signOut(): Promise<void> {
  const cookieStore = await cookies()
  
  // Clear all possible auth cookies
  const cookieNames = [
    'quiet_individual_user',
    'quiet_therapist_user', 
    'quiet_partner_user',
    'quiet_admin_user'
  ]
  
  cookieNames.forEach(cookieName => {
    cookieStore.delete(cookieName)
  })
  
  redirect('/login')
}

// SPECIFIC USER TYPE FUNCTIONS (for backward compatibility and convenience)

export async function individualSignIn(email: string): Promise<AuthResult> {
  return signIn(email, 'individual')
}

export async function therapistSignIn(email: string): Promise<AuthResult> {
  return signIn(email, 'therapist')
}

export async function partnerSignIn(email: string): Promise<AuthResult> {
  return signIn(email, 'partner')
}

export async function adminSignIn(email: string): Promise<AuthResult> {
  return signIn(email, 'admin')
}

export async function individualSignUp(signUpData: SignUpData): Promise<AuthResult> {
  return signUp(signUpData, 'individual')
}

export async function therapistSignUp(signUpData: SignUpData): Promise<AuthResult> {
  return signUp(signUpData, 'therapist')
}

export async function partnerSignUp(signUpData: SignUpData): Promise<AuthResult> {
  return signUp(signUpData, 'partner')
}

export async function verifyIndividualMagicLink(token: string): Promise<void> {
  return verifyMagicLink(token, 'individual')
}

export async function verifyTherapistMagicLink(token: string): Promise<void> {
  return verifyMagicLink(token, 'therapist')
}

export async function verifyPartnerMagicLink(token: string): Promise<void> {
  return verifyMagicLink(token, 'partner')
}

export async function verifyAdminMagicLink(token: string): Promise<void> {
  return verifyMagicLink(token, 'admin')
}
