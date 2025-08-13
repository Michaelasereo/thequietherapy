"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createMagicLink, verifyMagicLink } from "@/lib/auth"

// Partner user type
type PartnerUser = {
  id: string
  name: string
  email: string
  role: "partner"
  organization_name?: string
}

export async function partnerMagicLinkAction(_prevState: any, formData: FormData) {
  const email = (formData.get("email") as string) || ""

  console.log("partnerMagicLinkAction called with:", { email })

  if (!email.trim()) {
    return { error: "Please enter your email address." }
  }

  try {
    // Create magic link for partner
    const result = await createMagicLink({
      email: email.trim(),
      type: 'login',
      metadata: {
        user_type: 'partner'
      }
    })

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
    const result = await verifyMagicLink(token)
    
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
        organization_name: result.user.organization_name,
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
  const organizationName = formData.get("organizationName") as string
  const contactName = formData.get("contactName") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const employeeCount = formData.get("employeeCount") as string
  const industry = formData.get("industry") as string
  const termsAccepted = formData.get("termsAccepted") === "on"

  if (
    !organizationName ||
    !contactName ||
    !email ||
    !phone ||
    !employeeCount ||
    !industry ||
    !termsAccepted
  ) {
    return { error: "Please fill all required fields and accept terms." }
  }

  try {
    // Create magic link for partner onboarding
    const result = await createMagicLink({
      email: email.trim(),
      type: 'signup',
      metadata: {
        first_name: contactName,
        user_type: 'partner',
        organization_name: organizationName,
        phone,
        employee_count: employeeCount,
        industry
      }
    })

    if (result.success) {
      return { success: "Onboarding initiated! Check your email to complete the process." }
    } else {
      return { error: result.error || "Failed to send onboarding email. Please try again." }
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
