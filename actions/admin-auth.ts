"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// Simple admin credentials (in production, use proper authentication)
const ADMIN_CREDENTIALS = {
  email: "admin@trpi.com",
  password: "admin123"
}

export async function adminLoginAction(_prevState: any, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Please enter both email and password." }
  }

  // Check admin credentials
  if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
    // Set admin session cookie
    const cookieStore = await cookies()
    cookieStore.set("trpi_admin_user", JSON.stringify({
      id: "admin-1",
      email: email,
      role: "admin",
      name: "Admin User"
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return { success: "Login successful! Redirecting to admin dashboard..." }
  } else {
    return { error: "Invalid admin credentials." }
  }
}

export async function adminLogoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete("trpi_admin_user")
  redirect("/admin/auth")
}

export async function approveTherapistAction(therapistId: string) {
  const { createClient } = await import('@supabase/supabase-js')
  
  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Update therapist status to approved
    const { data, error } = await supabase
      .from('therapists')
      .update({
        is_verified: true,
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', therapistId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return { error: "Failed to approve therapist. Please try again." }
    }

    return { success: "Therapist approved successfully!" }
  } catch (error) {
    console.error("Error in approveTherapistAction:", error)
    return { error: "An error occurred. Please try again." }
  }
}

export async function rejectTherapistAction(therapistId: string, reason: string) {
  const { createClient } = await import('@supabase/supabase-js')
  
  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Update therapist status to rejected
    const { data, error } = await supabase
      .from('therapists')
      .update({
        is_verified: false,
        is_active: false,
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', therapistId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return { error: "Failed to reject therapist. Please try again." }
    }

    return { success: "Therapist rejected successfully!" }
  } catch (error) {
    console.error("Error in rejectTherapistAction:", error)
    return { error: "An error occurred. Please try again." }
  }
}
