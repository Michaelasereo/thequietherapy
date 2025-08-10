import { supabase } from "./supabase"
import { Database } from "./supabase"

export type User = Database["public"]["Tables"]["users"]["Row"]
export type Therapist = Database["public"]["Tables"]["therapists"]["Row"]
export type Partner = Database["public"]["Tables"]["partners"]["Row"]

export async function signUp(email: string, password: string, userData: Partial<User>) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: userData.full_name,
        user_type: userData.user_type,
      }
    }
  })

  if (error) throw error

  // Create user profile
  if (data.user) {
    const { error: profileError } = await supabase
      .from("users")
      .insert({
        id: data.user.id,
        email: data.user.email!,
        full_name: userData.full_name,
        user_type: userData.user_type || "individual",
        is_verified: false,
        is_active: true,
      })

    if (profileError) throw profileError
  }

  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error

  if (!user) return null

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single()

  if (profileError) throw profileError

  return { ...user, profile }
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw error
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({
    password,
  })
  if (error) throw error
}

export async function updateProfile(userId: string, updates: Partial<User>) {
  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)

  if (error) throw error
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single()

  if (error) throw error
  return data
}

export async function getTherapistProfile(userId: string) {
  const { data, error } = await supabase
    .from("therapists")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (error) throw profileError
  return data
}

export async function getPartnerProfile(userId: string) {
  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (error) throw error
  return data
}
