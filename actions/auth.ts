"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  // Simulate authentication (replace with actual database/auth logic)
  if (email && password) {
    // In a real app, you'd verify credentials against a database
    // For simulation, any non-empty email/password works
    const user = {
      id: `user-${Date.now()}`,
      name: email.split("@")[0], // Use email prefix as dummy name
      email: email,
    }

    // Set the cookie on the server
    const cookieStore = await cookies()
    cookieStore.set("trpi_user", JSON.stringify(user), {
      httpOnly: true, // Important for security
      secure: process.env.NODE_ENV === "production", // Use secure in production
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    // Redirect to dashboard after successful login
    redirect("/dashboard")
  } else {
    // Handle login failure (e.g., return an error message)
    return { error: "Invalid credentials." }
  }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete("trpi_user")
  redirect("/login")
}
