"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createMagicLinkForAuthType, verifyMagicLinkForAuthType } from "@/lib/auth"

// Simulate a partner user type
type PartnerUser = {
  id: string
  name: string
  email: string
  role: "partner"
  company_name?: string
}

export async function partnerMagicLinkAction(_prevState: any, formData: FormData) {
  const email = (formData.get("email") as string) || ""

  console.log("partnerMagicLinkAction called with:", { email })

  if (!email.trim()) {
    return { error: "Please enter your email address." }
  }

  try {
    // Create magic link for partner using the auth type specific function
    const result = await createMagicLinkForAuthType(
      email.trim(),
      'partner',
      'login',
      {
        user_type: 'partner'
      }
    )

    if (result.success) {
      return { success: "Magic link sent! Check your email to log in." }
    } else {
      return { error: result.error || "Failed to send magic link. Please try again." }
    }
  } catch (error) {
    console.error("Error in partnerMagicLinkAction:", error)
    return { error: "An error occurred. Please try again." }
  }
}

export async function partnerVerifyMagicLinkAction(token: string) {
  try {
    const result = await verifyMagicLinkForAuthType(token, 'partner')
    
    if (result.success && result.user) {
      // Check if user is a partner
      if (result.user.user_type !== 'partner') {
        return { error: "This link is not valid for partner access." }
      }

      // Set partner session cookie
      const cookieStore = await cookies()
      cookieStore.set("trpi_partner_user", JSON.stringify({
        id: result.user.id,
        name: result.user.full_name || result.user.email.split('@')[0],
        email: result.user.email,
        role: "partner",
        company_name: result.user.company_name, // Use company_name from users table
        session_token: result.user.session_token
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
      })

      redirect("/partner/dashboard")
    } else {
      return { error: result.error || "Invalid or expired magic link." }
    }
  } catch (error) {
    console.error("Error in partnerVerifyMagicLinkAction:", error)
    return { error: "An error occurred while verifying the magic link." }
  }
}

export async function partnerOnboardingAction(_prevState: any, formData: FormData) {
  console.log("partnerOnboardingAction called") // Debug log
  console.log("FormData received in server action:") // Debug log
  for (let [key, value] of formData.entries()) {
    console.log(`${key}:`, value)
  }
  
  try {
    const { createClient } = await import('@supabase/supabase-js')
    
    const organizationName = formData.get("organizationName") as string
    const contactName = formData.get("contactName") as string
    const email = formData.get("email") as string
    const employeeCount = formData.get("employeeCount") as string
    const industry = formData.get("industry") as string
    const address = formData.get("address") as string
    const phone = formData.get("phone") as string
    const termsAccepted = formData.get("termsAccepted") === "on" || formData.get("termsAccepted") === "true"

    console.log("Form data received:", { organizationName, contactName, email, employeeCount, industry, address, phone, termsAccepted }) // Debug log

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return { error: "Please enter a valid email address." }
    }

    if (
      !organizationName ||
      !contactName ||
      !email ||
      !employeeCount ||
      !industry ||
      !termsAccepted
    ) {
      console.log("Validation failed:", { organizationName, contactName, email, employeeCount, industry, termsAccepted })
      return { error: "Please fill all required fields and accept terms." }
    }

    console.log("Validation passed, creating Supabase client...") // Debug log

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log("Supabase client created, inserting partner data...") // Debug log

    // Save partner enrollment to database
    console.log("Inserting partner enrollment data into database...") // Debug log
    
    // Map organization type to database enum values
    const mapOrganizationType = (type: string): string => {
      const mapping: Record<string, string> = {
        'Hospital': 'hospital',
        'Clinic': 'clinic',
        'NGO': 'ngo',
        'School': 'school',
        'Corporate HR': 'corporate',
        'Government Agency': 'government',
        'Other': 'corporate' // Default to corporate for "Other"
      }
      return mapping[type] || 'corporate'
    }
    
    const insertData: any = {
      organization_name: organizationName,
      contact_person: contactName,
      email: email.trim(),
      employee_count: employeeCount,
      organization_type: mapOrganizationType(industry),
      address: address || 'Not provided',
      phone: phone || 'Not provided',
      status: 'pending',
      created_at: new Date().toISOString()
    }

    // First, check if a partner with this email already exists
    const { data: existingPartner, error: checkError } = await supabase
      .from('partners')
      .select('*')
      .eq('email', email.trim())
      .single()

    if (existingPartner) {
      console.log("Partner with this email already exists:", existingPartner)
      if (existingPartner.status === 'pending') {
        return { success: "Enrollment submitted! Please check your email to complete the verification process." }
      } else if (existingPartner.status === 'verified') {
        return { success: "You are already enrolled and verified! Please use the login page to access your dashboard." }
      }
    }

    // Insert partner data
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .insert(insertData)
      .select()
      .single()

    if (partnerError) {
      console.error('Database error:', partnerError)
      // Check if it's a duplicate email error
      if (partnerError.code === '23505' && partnerError.message.includes('email')) {
        return { success: "Enrollment already exists! Please check your email to complete the process." }
      }
      return { error: "Failed to save enrollment data. Please try again." }
    }

    console.log("Partner data inserted successfully:", partner) // Debug log

    console.log("Creating magic link for partner...") // Debug log
    
    // Create user record in users table for partner
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        email: email.trim(),
        full_name: contactName,
        user_type: 'partner',
        is_verified: false, // Will be verified when they click the magic link
        is_active: true, // Active by default, but availability controlled by approval
        company_name: organizationName,
        organization_type: mapOrganizationType(industry),
        contact_person: contactName,
        partner_status: 'temporary', // Grant temporary approval immediately
        temporary_approval: true, // Mark as temporarily approved
        approval_date: new Date().toISOString()
      })
      .select()
      .single()

    if (userError) {
      console.error('Error creating user record:', userError)
      // Don't fail the enrollment if user creation fails - the verifyMagicLink function will handle it
    } else {
      console.log('User record created for partner:', userData.id)
    }
    
    console.log("About to call createMagicLink with data:", {
      email: email.trim(),
      type: 'signup',
      metadata: {
        first_name: contactName,
        user_type: 'partner',
        partner_id: partner.id,
        organization_name: organizationName,
        organization_type: mapOrganizationType(industry),
        employee_count: employeeCount,
        phone,
        address
      }
    })
    
    // Create magic link for partner login
    const result = await createMagicLinkForAuthType(
      email.trim(),
      'partner',
      'signup',
      {
        first_name: contactName,
        user_type: 'partner',
        partner_id: partner.id,
        organization_name: organizationName,
        organization_type: mapOrganizationType(industry),
        employee_count: employeeCount,
        phone,
        address
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
    console.error("Error in partnerOnboardingAction:", error)
    return { error: "An error occurred. Please try again." }
  }
}

export async function partnerLogoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete("trpi_partner_user")
  redirect("/partner/auth")
}
