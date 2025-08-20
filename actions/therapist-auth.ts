"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createMagicLinkForAuthType, verifyMagicLinkForAuthType } from "@/lib/auth"

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
    // Create magic link for therapist using the auth type specific function
    const result = await createMagicLinkForAuthType(
      email.trim(),
      'therapist',
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
    const result = await verifyMagicLinkForAuthType(token, 'therapist')
    
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
    // Extract form data
    const fullName = formData.get("fullName") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const mdcnCode = formData.get("mdcnCode") as string
    const specialization = formData.getAll("specialization") as string[]
    const languages = formData.getAll("languages") as string[]
    const termsAccepted = formData.get("termsAccepted") === "true"

    console.log("Extracted form data:", {
      fullName,
      email,
      phone,
      mdcnCode,
      specialization,
      languages,
      termsAccepted
    })

    // Validate required fields
    if (!fullName || !email || !phone || !mdcnCode) {
      return { error: "All required fields must be filled out." }
    }

    if (!termsAccepted) {
      return { error: "You must accept the terms and conditions." }
    }

    // Create magic link for therapist signup
    const result = await createMagicLinkForAuthType(
      email.trim(),
      'therapist',
      'signup',
      {
        first_name: fullName,
        user_type: 'therapist',
        phone,
        mdcn_code: mdcnCode,
        specialization,
        languages
      }
    )

    if (result.success) {
      console.log("Therapist enrollment successful for:", email)
      return { 
        success: "Enrollment submitted successfully! Please check your email to complete the verification process." 
      }
    } else {
      return { error: result.error || "Failed to process enrollment. Please try again." }
    }

  } catch (error) {
    console.error("Error in therapistEnrollAction:", error)
    return { error: "An error occurred during enrollment. Please try again." }
  }
}

export async function therapistLogoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete("trpi_therapist_user")
  redirect("/therapist/login")
}
