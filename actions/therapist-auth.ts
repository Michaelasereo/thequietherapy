"use server"

import { signIn, signUp, signOut, verifyMagicLink } from "./unified-auth"
import type { AuthResult, SignUpData } from "./unified-auth"

/**
 * Therapist-specific authentication actions
 * These are convenience wrappers around the unified auth system
 */

export async function therapistSignIn(email: string): Promise<AuthResult> {
  return signIn(email, 'therapist')
}

export async function therapistSignUp(signUpData: SignUpData): Promise<AuthResult> {
  return signUp(signUpData, 'therapist')
}

export async function verifyTherapistMagicLink(token: string): Promise<void> {
  return verifyMagicLink(token, 'therapist')
}

export async function therapistLogoutAction(): Promise<void> {
  return signOut()
}

/**
 * Therapist enrollment action for the enrollment flow
 * Only allows enrollment with official company email domain
 */
export async function therapistEnrollAction(prevState: any, formData: FormData) {
  try {
    const email = formData.get('email') as string
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const fullName = `${firstName} ${lastName}`.trim()
    
    if (!email || !firstName || !lastName) {
      return {
        success: false,
        error: 'All fields are required'
      }
    }

    // SECURITY: Restrict therapist enrollment to official company email domain
    const ALLOWED_DOMAIN = '@thequietherapy.live'
    if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
      return {
        success: false,
        error: `Therapist enrollment is restricted to official company emails (${ALLOWED_DOMAIN}). Please use your company email address or contact support.`
      }
    }

    const result = await therapistSignUp({
      email,
      firstName,
      fullName
    })

    return result
  } catch (error) {
    console.error('Therapist enrollment error:', error)
    return {
      success: false,
      error: 'An error occurred during enrollment. Please try again.'
    }
  }
}
