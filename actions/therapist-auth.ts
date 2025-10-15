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
    const fullName = formData.get('fullName') as string
    const phone = formData.get('phone') as string
    const licensedQualification = formData.get('licensedQualification') as string
    
    if (!email || !fullName || !phone || !licensedQualification) {
      return {
        success: false,
        error: 'All required fields must be filled'
      }
    }

    // SECURITY: Restrict therapist enrollment to official company email domain
    const ALLOWED_DOMAIN = '@thequietherapy.live'
    if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
      return {
        success: false,
        error: 'Therapist enrollment is restricted to official company emails. Please use your assigned work email or contact support.'
      }
    }

    const result = await therapistSignUp({
      email,
      fullName,
      phone,
      licensedQualification
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
