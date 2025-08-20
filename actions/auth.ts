"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createMagicLinkForAuthType, verifyMagicLinkForAuthType } from "@/lib/auth"

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  console.log("loginAction called with:", { email })

  if (!email.trim()) {
    return { error: "Please enter your email address." }
  }

  try {
    // Create magic link for individual user
    const result = await createMagicLinkForAuthType(
      email.trim(),
      'individual',
      'login',
      {
        user_type: 'individual'
      }
    )

    if (result.success) {
      return { success: "Magic link sent! Check your email to log in." }
    } else {
      return { error: result.error || "Failed to send magic link. Please try again." }
    }
  } catch (error) {
    console.error("Error in loginAction:", error)
    return { error: "An error occurred. Please try again." }
  }
}

export async function verifyMagicLinkAction(token: string) {
  try {
    const result = await verifyMagicLinkForAuthType(token, 'individual')
    
    if (result.success && result.user) {
      // Check if user is an individual
      if (result.user.user_type !== 'individual') {
        return { error: "This link is not valid for individual access." }
      }

      // Set individual session cookie
      const cookieStore = await cookies()
      cookieStore.set("trpi_individual_user", JSON.stringify({
        id: result.user.id,
        name: result.user.full_name || result.user.email.split('@')[0],
        email: result.user.email,
        role: "individual",
        session_token: result.user.session_token
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
      })

      redirect("/dashboard")
    } else {
      return { error: result.error || "Invalid or expired magic link." }
    }
  } catch (error) {
    console.error("Error in verifyMagicLinkAction:", error)
    return { error: "An error occurred while verifying the magic link." }
  }
}

export async function signupAction(formData: FormData) {
  const email = formData.get("email") as string
  const fullName = formData.get("fullName") as string

  console.log("signupAction called with:", { email, fullName })

  if (!email.trim() || !fullName.trim()) {
    return { error: "Please enter your email and full name." }
  }

  try {
    // Create magic link for individual user signup
    const result = await createMagicLinkForAuthType(
      email.trim(),
      'individual',
      'signup',
      {
        first_name: fullName,
        user_type: 'individual'
      }
    )

    if (result.success) {
      return { success: "Magic link sent! Check your email to complete signup." }
    } else {
      return { error: result.error || "Failed to send magic link. Please try again." }
    }
  } catch (error) {
    console.error("Error in signupAction:", error)
    return { error: "An error occurred. Please try again." }
  }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete("trpi_individual_user")
  cookieStore.delete("trpi_user") // Also delete the old cookie name
  redirect("/login")
}
