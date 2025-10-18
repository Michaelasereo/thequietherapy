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
  const { cookies } = await import('next/headers')
  const { redirect } = await import('next/navigation')
  
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
  
  console.log('✅ Therapist logged out, redirecting to therapist login')
  
  // Redirect to THERAPIST login with fresh_login flag
  redirect('/therapist/login?fresh_login=true')
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
    
    // NEW: Personal information fields
    const gender = formData.get('gender') as string
    const age = formData.get('age') as string
    const maritalStatus = formData.get('maritalStatus') as string
    const bio = formData.get('bio') as string
    
    if (!email || !fullName || !phone || !licensedQualification || !gender || !age || !maritalStatus || !bio) {
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

    // Create enrollment record with ALL fields
    const { error: enrollmentError } = await supabase
      .from('therapist_enrollments')
      .insert({
        full_name: fullName,
        email: email.toLowerCase(),
        phone,
        licensed_qualification: licensedQualification,
        specialization,
        languages,
        gender,
        age: parseInt(age),
        marital_status: maritalStatus,
        bio,
        status: 'pending' // Admin needs to approve before they can set availability
      })

    if (enrollmentError) {
      console.error('Error creating enrollment:', enrollmentError)
      return {
        success: false,
        error: 'Failed to save enrollment data. Please try again.'
      }
    }

    console.log('✅ Enrollment saved successfully')

    // Send magic link to create account and access dashboard
    // They can login but can't set availability until admin approves
    const result = await therapistSignUp({
      email,
      fullName,
      phone,
      licensedQualification,
      specialization,
      languages,
      gender,
      age,
      maritalStatus,
      bio
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
