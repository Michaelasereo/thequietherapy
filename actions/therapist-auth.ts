"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createMagicLink, verifyMagicLink } from "@/lib/auth"

// Simulate a therapist user type
type TherapistUser = {
  id: string
  name: string
  email: string
  role: "therapist"
  // Add other therapist-specific properties like specialization, MDCN code etc.
}

export async function therapistMagicLinkAction(_prevState: any, formData: FormData) {
  const email = (formData.get("email") as string) || ""

  console.log("therapistMagicLinkAction called with:", { email })

  if (!email.trim()) {
    return { error: "Please enter your email address." }
  }

  try {
    // Create magic link for therapist
    const result = await createMagicLink(
      email.trim(),
      'login',
      {
        user_type: 'therapist'
      }
    )

    if (result.success) {
      return { success: "Magic link sent! Check your email to log in." }
    } else {
      return { error: result.error || "Failed to send magic link. Please try again." }
    }
  } catch (error) {
    console.error("Error in therapistMagicLinkAction:", error)
    return { error: "An error occurred. Please try again." }
  }
}

export async function therapistVerifyMagicLinkAction(token: string) {
  try {
    const result = await verifyMagicLink(token)
    
    if (result.success && result.user) {
      // Check if user is a therapist
      if (result.user.user_type !== 'therapist') {
        return { error: "This link is not valid for therapist access." }
      }

      // Set therapist session cookie
      const cookieStore = await cookies()
      cookieStore.set("trpi_therapist_user", JSON.stringify({
        id: result.user.id,
        name: result.user.full_name || result.user.email.split('@')[0],
        email: result.user.email,
        role: "therapist",
        session_token: result.user.session_token
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
      })

      redirect("/therapist/dashboard")
    } else {
      return { error: result.error || "Invalid or expired magic link." }
    }
  } catch (error) {
    console.error("Error in therapistVerifyMagicLinkAction:", error)
    return { error: "An error occurred while verifying the magic link." }
  }
}

export async function therapistEnrollAction(_prevState: any, formData: FormData) {
  console.log("therapistEnrollAction called") // Debug log
  console.log("FormData received in server action:") // Debug log
  for (let [key, value] of formData.entries()) {
    console.log(`${key}:`, value)
  }
  
  try {
    const { createClient } = await import('@supabase/supabase-js')
    
    const name = formData.get("fullName") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const mdcnCode = formData.get("mdcnCode") as string
    const specialization = formData.getAll("specialization") as string[]
    const languages = formData.getAll("languages") as string[]
    const termsAccepted = formData.get("termsAccepted") === "on" || formData.get("termsAccepted") === "true"

    console.log("Form data received:", { name, email, phone, mdcnCode, specialization, languages, termsAccepted }) // Debug log

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.trim())) {
    return { error: "Please enter a valid email address." }
  }

  if (
    !name ||
    !email ||
    !phone ||
    !mdcnCode ||
    specialization.length === 0 ||
    languages.length === 0 ||
    !termsAccepted
  ) {
    console.log("Validation failed:", { name, email, phone, mdcnCode, specialization, languages, termsAccepted })
    return { error: "Please fill all required fields and accept terms." }
  }

  console.log("Validation passed, creating Supabase client...") // Debug log

  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log("Supabase client created, inserting therapist data...") // Debug log

  // Save therapist enrollment to database
  console.log("Inserting therapist enrollment data into database...") // Debug log
  
  // Try different column names for MDCN code
  const insertData: any = {
    full_name: name,
    email: email.trim(),
    phone,
    specialization: specialization,
    languages: languages,
    status: 'pending',
    created_at: new Date().toISOString()
  }

  // First, check if a therapist with this email already exists
  const { data: existingTherapist, error: checkError } = await supabase
    .from('therapist_enrollments')
    .select('*')
    .eq('email', email.trim())
    .single()

  if (existingTherapist) {
    console.log("Therapist with this email already exists:", existingTherapist)
    if (existingTherapist.status === 'pending') {
      return { success: "Enrollment submitted! Please check your email to complete the verification process." }
    } else if (existingTherapist.status === 'verified') {
      return { success: "You are already enrolled and verified! Please use the login page to access your dashboard." }
    }
  }

  // Try different possible column names for MDCN code
  const mdcnColumns = ['mdcn_code', 'license_number', 'mdcn', 'license', 'registration_number']
  let mdcnColumnFound = false
  let therapist: any = null

  for (const column of mdcnColumns) {
    try {
      const testData = { ...insertData, [column]: mdcnCode }
      const { data: testResult, error: testError } = await supabase
        .from('therapist_enrollments')
        .insert(testData)
        .select()
        .single()
      
      if (!testError) {
        console.log(`Successfully used column: ${column}`)
        therapist = testResult
        mdcnColumnFound = true
        break
      } else {
        console.log(`Error with column ${column}:`, testError)
        // Check if it's a duplicate email error
        if (testError.code === '23505' && testError.message.includes('email')) {
          console.log("Duplicate email detected")
          return { success: "Enrollment already exists! Please check your email to complete the process." }
        }
      }
    } catch (e) {
      console.log(`Column ${column} not available:`, e)
    }
  }

  if (!mdcnColumnFound) {
    // If no MDCN column found, insert without it
    console.log("No MDCN column found, inserting without MDCN code")
    const { data: therapistData, error: dbError } = await supabase
      .from('therapist_enrollments')
      .insert(insertData)
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Check if it's a duplicate email error
      if (dbError.code === '23505' && dbError.message.includes('email')) {
        return { success: "Enrollment already exists! Please check your email to complete the process." }
      }
      return { error: "Failed to save enrollment data. Please try again." }
    }

    therapist = therapistData
    console.log("Therapist data inserted successfully:", therapist) // Debug log
  }

  console.log("Creating magic link for therapist...") // Debug log
  
  // Create user record in users table for therapist
  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert({
      email: email.trim(),
      full_name: name,
      user_type: 'therapist',
      is_verified: false, // Will be verified when they click the magic link
      is_active: true, // Active by default, but availability controlled by approval
      // No credits for therapists - they are service providers
    })
    .select()
    .single()

  if (userError) {
    console.error('Error creating user record:', userError)
    // Don't fail the enrollment if user creation fails - the verifyMagicLink function will handle it
  } else {
    console.log('User record created for therapist:', userData.id)
  }
  
  console.log("About to call createMagicLink with data:", {
    email: email.trim(),
    type: 'signup',
    metadata: {
      first_name: name,
      user_type: 'therapist',
      therapist_id: therapist.id,
      phone,
      mdcn_code: mdcnCode,
      specialization,
      languages
    }
  })
  
  // Create magic link for therapist login
  const result = await createMagicLink(
    email.trim(),
    'signup',
    {
      first_name: name,
      user_type: 'therapist',
      therapist_id: therapist.id,
      phone,
      mdcn_code: mdcnCode,
      specialization,
      languages
    }
  )

  console.log("Magic link result:", result) // Debug log

  if (result.success) {
    console.log("Enrollment successful, returning success response") // Debug log
    return { success: "Enrollment submitted successfully! Please check your email to complete the verification process and access your dashboard." }
  } else {
    console.log("Magic link failed, but enrollment was successful") // Debug log
    // Return success even if email fails, since the enrollment data was saved
    return { 
      success: "Enrollment submitted successfully! Your data has been saved. Please contact support to complete the verification process." 
    }
  }
  } catch (error) {
    console.error("Error in therapistEnrollAction:", error)
    return { error: "An error occurred. Please try again." }
  }
}

export async function therapistLogoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete("trpi_therapist_user")
  redirect("/therapist/login")
}
