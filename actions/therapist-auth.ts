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
    const specialization = formData.getAll('specialization') as string[]
    const languages = formData.getAll('languages') as string[]
    
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

    // Save enrollment data to database FIRST
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if enrollment already exists
    const { data: existingEnrollment } = await supabase
      .from('therapist_enrollments')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingEnrollment) {
      return {
        success: false,
        error: 'An enrollment with this email already exists. Please use the login page.'
      }
    }

    // Create enrollment record
    const { error: enrollmentError } = await supabase
      .from('therapist_enrollments')
      .insert({
        full_name: fullName,
        email: email.toLowerCase(),
        phone,
        licensed_qualification: licensedQualification,
        specialization,
        languages,
        status: 'pending'
      })

    if (enrollmentError) {
      console.error('Error creating enrollment:', enrollmentError)
      return {
        success: false,
        error: 'Failed to save enrollment data. Please try again.'
      }
    }

    // Then send magic link
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
