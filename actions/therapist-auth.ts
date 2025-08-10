"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// Simulate a therapist user type
type TherapistUser = {
  id: string
  name: string
  email: string
  role: "therapist"
  // Add other therapist-specific properties like specialization, MDCN code etc.
}

export async function therapistLoginAction(_prevState: any, formData: FormData) {
  const email = (formData.get("email") as string) || ""
  const password = (formData.get("password") as string) || ""

  console.log("therapistLoginAction called with:", { email })

  // Accept any non-empty email and password for MVP/demo
  if (email.trim() && password.trim()) {
    const user: TherapistUser = {
      id: `therapist-${Date.now()}`,
      name: "Demo Therapist",
      email,
      role: "therapist",
    }

    cookies().set("trpi_therapist_user", JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })
    console.log("Cookie 'trpi_therapist_user' set successfully. Redirecting to dashboard.")
    redirect("/therapist/dashboard")
  }

  console.log("Login failed: Missing email or password.")
  return { error: "Enter any email and password to continue." }
}

export async function therapistEnrollAction(_prevState: any, formData: FormData) {
  // This is a simplified simulation. In a real app, you'd save data to DB,
  // handle document uploads, send verification emails, etc.
  const name = formData.get("fullName") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const phone = formData.get("phone") as string
  const mdcnCode = formData.get("mdcnCode") as string
  const specialization = formData.getAll("specialization") as string[]
  const languages = formData.getAll("languages") as string[]
  const termsAccepted = formData.get("termsAccepted") === "on"

  if (
    !name ||
    !email ||
    !password ||
    !phone ||
    !mdcnCode ||
    specialization.length === 0 ||
    languages.length === 0 ||
    !termsAccepted
  ) {
    return { error: "Please fill all required fields and accept terms." }
  }

  // Simulate successful enrollment
  const user: TherapistUser = {
    id: `therapist-${Date.now()}`,
    name: name,
    email: email,
    role: "therapist",
  }

  cookies().set("trpi_therapist_user", JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  })
  console.log("Cookie 'trpi_therapist_user' set successfully. Redirecting to dashboard.")
  redirect("/therapist/dashboard") // Redirect to dashboard after enrollment
}

export async function therapistLogoutAction() {
  cookies().delete("trpi_therapist_user")
  redirect("/therapist/login")
}
