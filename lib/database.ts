import { supabase } from "./supabase"
import { Database } from "./supabase"

export type User = Database["public"]["Tables"]["users"]["Row"]
export type Therapist = Database["public"]["Tables"]["therapists"]["Row"]
export type Partner = Database["public"]["Tables"]["partners"]["Row"]
export type Session = Database["public"]["Tables"]["sessions"]["Row"]
export type Payment = Database["public"]["Tables"]["payments"]["Row"]
export type Credit = Database["public"]["Tables"]["credits"]["Row"]
export type Content = Database["public"]["Tables"]["content"]["Row"]

// User Management
export async function getUsers(limit = 50, offset = 0) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data
}

export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw error
  return data
}

export async function updateUser(id: string, updates: Partial<User>) {
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteUser(id: string) {
  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", id)

  if (error) throw error
}

// Therapist Management
export async function getTherapists(limit = 50, offset = 0) {
  const { data, error } = await supabase
    .from("therapists")
    .select(`
      *,
      users (
        id,
        email,
        full_name,
        is_verified,
        is_active
      )
    `)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data
}

export async function getTherapistById(id: string) {
  const { data, error } = await supabase
    .from("therapists")
    .select(`
      *,
      users (
        id,
        email,
        full_name,
        is_verified,
        is_active
      )
    `)
    .eq("id", id)
    .single()

  if (error) throw error
  return data
}

export async function createTherapist(therapistData: Database["public"]["Tables"]["therapists"]["Insert"]) {
  const { data, error } = await supabase
    .from("therapists")
    .insert(therapistData)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTherapist(id: string, updates: Partial<Therapist>) {
  const { data, error } = await supabase
    .from("therapists")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Partner Management
export async function getPartners(limit = 50, offset = 0) {
  const { data, error } = await supabase
    .from("partners")
    .select(`
      *,
      users (
        id,
        email,
        full_name,
        is_verified,
        is_active
      )
    `)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data
}

export async function getPartnerById(id: string) {
  const { data, error } = await supabase
    .from("partners")
    .select(`
      *,
      users (
        id,
        email,
        full_name,
        is_verified,
        is_active
      )
    `)
    .eq("id", id)
    .single()

  if (error) throw error
  return data
}

export async function createPartner(partnerData: Database["public"]["Tables"]["partners"]["Insert"]) {
  const { data, error } = await supabase
    .from("partners")
    .insert(partnerData)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePartner(id: string, updates: Partial<Partner>) {
  const { data, error } = await supabase
    .from("partners")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Session Management
export async function getSessions(limit = 50, offset = 0) {
  const { data, error } = await supabase
    .from("sessions")
    .select(`
      *,
      clients:users!sessions_client_id_fkey (
        id,
        email,
        full_name
      ),
      therapists:users!sessions_therapist_id_fkey (
        id,
        email,
        full_name
      ),
      partners:partners (
        id,
        organization_name
      )
    `)
    .order("session_date", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data
}

export async function getSessionsByUser(userId: string) {
  const { data, error } = await supabase
    .from("sessions")
    .select(`
      *,
      clients:users!sessions_client_id_fkey (
        id,
        email,
        full_name
      ),
      therapists:users!sessions_therapist_id_fkey (
        id,
        email,
        full_name
      ),
      partners:partners (
        id,
        organization_name
      )
    `)
    .or(`client_id.eq.${userId},therapist_id.eq.${userId}`)
    .order("session_date", { ascending: false })

  if (error) throw error
  return data
}

export async function createSession(sessionData: Database["public"]["Tables"]["sessions"]["Insert"]) {
  const { data, error } = await supabase
    .from("sessions")
    .insert(sessionData)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateSession(id: string, updates: Partial<Session>) {
  const { data, error } = await supabase
    .from("sessions")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Payment Management
export async function getPayments(limit = 50, offset = 0) {
  const { data, error } = await supabase
    .from("payments")
    .select(`
      *,
      users (
        id,
        email,
        full_name
      ),
      sessions (
        id,
        session_date,
        start_time
      )
    `)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data
}

export async function getPaymentsByUser(userId: string) {
  const { data, error } = await supabase
    .from("payments")
    .select(`
      *,
      sessions (
        id,
        session_date,
        start_time
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function createPayment(paymentData: Database["public"]["Tables"]["payments"]["Insert"]) {
  const { data, error } = await supabase
    .from("payments")
    .insert(paymentData)
    .select()
    .single()

  if (error) throw error
  return data
}

// Credit Management
export async function getCreditsByUser(userId: string) {
  const { data, error } = await supabase
    .from("credits")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (error) throw error
  return data
}

export async function updateCredits(userId: string, updates: Partial<Credit>) {
  const { data, error } = await supabase
    .from("credits")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Content Management
export async function getContent(limit = 50, offset = 0) {
  const { data, error } = await supabase
    .from("content")
    .select(`
      *,
      users!content_author_id_fkey (
        id,
        email,
        full_name
      )
    `)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data
}

export async function getContentById(id: string) {
  const { data, error } = await supabase
    .from("content")
    .select(`
      *,
      users!content_author_id_fkey (
        id,
        email,
        full_name
      )
    `)
    .eq("id", id)
    .single()

  if (error) throw error
  return data
}

export async function createContent(contentData: Database["public"]["Tables"]["content"]["Insert"]) {
  const { data, error } = await supabase
    .from("content")
    .insert(contentData)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateContent(id: string, updates: Partial<Content>) {
  const { data, error } = await supabase
    .from("content")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteContent(id: string) {
  const { error } = await supabase
    .from("content")
    .delete()
    .eq("id", id)

  if (error) throw error
}

// Analytics and Reports
export async function getDashboardStats() {
  const [
    { count: totalUsers },
    { count: totalTherapists },
    { count: totalPartners },
    { count: totalSessions },
    { count: pendingVerifications },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("therapists").select("*", { count: "exact", head: true }),
    supabase.from("partners").select("*", { count: "exact", head: true }),
    supabase.from("sessions").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("is_verified", false),
  ])

  return {
    totalUsers: totalUsers || 0,
    totalTherapists: totalTherapists || 0,
    totalPartners: totalPartners || 0,
    totalSessions: totalSessions || 0,
    pendingVerifications: pendingVerifications || 0,
  }
}

export async function getRevenueStats() {
  const { data, error } = await supabase
    .from("payments")
    .select("amount, status, created_at")
    .eq("status", "completed")

  if (error) throw error

  const totalRevenue = data.reduce((sum, payment) => sum + payment.amount, 0)
  const monthlyRevenue = data
    .filter(payment => {
      const paymentDate = new Date(payment.created_at)
      const now = new Date()
      return paymentDate.getMonth() === now.getMonth() && 
             paymentDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, payment) => sum + payment.amount, 0)

  return {
    totalRevenue,
    monthlyRevenue,
  }
}
