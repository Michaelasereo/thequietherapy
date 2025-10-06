import { createClient } from "@supabase/supabase-js"
import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Client-side Supabase client with real-time disabled to prevent WebSocket errors
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    enabled: false
  }
})

// Server-side Supabase client with service role key
export const createServerClient = () => {
  const serverSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://frzciymslvpohhyefmtr.supabase.co'
  
  // Use anon key as fallback if service role key is invalid
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  
  // Use service role key if available, otherwise fallback to anon key
  const serverSupabaseKey = serviceRoleKey || anonKey
  
  return createClient(serverSupabaseUrl, serverSupabaseKey, {
    auth: {
      persistSession: false,
    },
  })
}

// Database types (will be generated from Supabase)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          user_type: "individual" | "partner" | "therapist" | "admin"
          partner_id: string | null
          created_at: string
          updated_at: string
          is_verified: boolean
          is_active: boolean
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          user_type: "individual" | "partner" | "therapist" | "admin"
          partner_id?: string | null
          created_at?: string
          updated_at?: string
          is_verified?: boolean
          is_active?: boolean
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          user_type?: "individual" | "partner" | "therapist" | "admin"
          partner_id?: string | null
          created_at?: string
          updated_at?: string
          is_verified?: boolean
          is_active?: boolean
        }
      }
      therapists: {
        Row: {
          id: string
          user_id: string
          specialization: string
          mdcn_code: string
          experience_years: number
          bio: string | null
          hourly_rate: number
          is_verified: boolean
          verification_status: "pending" | "approved" | "rejected"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          specialization: string
          mdcn_code: string
          experience_years: number
          bio?: string | null
          hourly_rate: number
          is_verified?: boolean
          verification_status?: "pending" | "approved" | "rejected"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          specialization?: string
          mdcn_code?: string
          experience_years?: number
          bio?: string | null
          hourly_rate?: number
          is_verified?: boolean
          verification_status?: "pending" | "approved" | "rejected"
          created_at?: string
          updated_at?: string
        }
      }
      partners: {
        Row: {
          id: string
          user_id: string
          organization_name: string
          organization_type: "hospital" | "clinic" | "ngo" | "school" | "corporate" | "government"
          contact_person: string
          phone: string
          address: string
          website: string | null
          is_verified: boolean
          verification_status: "pending" | "approved" | "rejected"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_name: string
          organization_type: "hospital" | "clinic" | "ngo" | "school" | "corporate" | "government"
          contact_person: string
          phone: string
          address: string
          website?: string | null
          is_verified?: boolean
          verification_status?: "pending" | "approved" | "rejected"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_name?: string
          organization_type?: "hospital" | "clinic" | "ngo" | "school" | "corporate" | "government"
          contact_person?: string
          phone?: string
          address?: string
          website?: string | null
          is_verified?: boolean
          verification_status?: "pending" | "approved" | "rejected"
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          client_id: string
          therapist_id: string
          partner_id: string | null
          session_date: string
          start_time: string
          end_time: string
          duration_minutes: number
          session_type: string
          status: "scheduled" | "completed" | "cancelled" | "no_show"
          amount: number
          payment_status: "pending" | "paid" | "refunded"
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          therapist_id: string
          partner_id?: string | null
          session_date: string
          start_time: string
          end_time: string
          duration_minutes: number
          session_type: string
          status?: "scheduled" | "completed" | "cancelled" | "no_show"
          amount: number
          payment_status?: "pending" | "paid" | "refunded"
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          therapist_id?: string
          partner_id?: string | null
          session_date?: string
          start_time?: string
          end_time?: string
          duration_minutes?: number
          session_type?: string
          status?: "scheduled" | "completed" | "cancelled" | "no_show"
          amount?: number
          payment_status?: "pending" | "paid" | "refunded"
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          session_id: string | null
          amount: number
          payment_method: "paystack" | "credits" | "bank_transfer"
          status: "pending" | "completed" | "failed" | "refunded"
          reference: string
          credits_purchased: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id?: string | null
          amount: number
          payment_method: "paystack" | "credits" | "bank_transfer"
          status?: "pending" | "completed" | "failed" | "refunded"
          reference: string
          credits_purchased: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string | null
          amount?: number
          payment_method?: "paystack" | "credits" | "bank_transfer"
          status?: "pending" | "completed" | "failed" | "refunded"
          reference?: string
          credits_purchased?: number
          created_at?: string
          updated_at?: string
        }
      }
      credits: {
        Row: {
          id: string
          user_id: string
          credits_balance: number
          credits_used: number
          credits_purchased: number
          last_updated: string
        }
        Insert: {
          id?: string
          user_id: string
          credits_balance?: number
          credits_used?: number
          credits_purchased?: number
          last_updated?: string
        }
        Update: {
          id?: string
          user_id?: string
          credits_balance?: number
          credits_used?: number
          credits_purchased?: number
          last_updated?: string
        }
      }
      therapist_availability: {
        Row: {
          id: string
          therapist_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available: boolean
          created_at: string
        }
        Insert: {
          id?: string
          therapist_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          therapist_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          is_available?: boolean
          created_at?: string
        }
      }
      content: {
        Row: {
          id: string
          title: string
          content_type: "article" | "video" | "image"
          category: string
          author_id: string
          content: string
          status: "draft" | "published" | "archived"
          views: number
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content_type: "article" | "video" | "image"
          category: string
          author_id: string
          content: string
          status?: "draft" | "published" | "archived"
          views?: number
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content_type?: "article" | "video" | "image"
          category?: string
          author_id?: string
          content?: string
          status?: "draft" | "published" | "archived"
          views?: number
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      admin_logs: {
        Row: {
          id: string
          admin_id: string
          action: string
          table_name: string
          record_id: string | null
          old_values: any | null
          new_values: any | null
          ip_address: string
          user_agent: string
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action: string
          table_name: string
          record_id?: string | null
          old_values?: any | null
          new_values?: any | null
          ip_address: string
          user_agent: string
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          action?: string
          table_name?: string
          record_id?: string | null
          old_values?: any | null
          new_values?: any | null
          ip_address?: string
          user_agent?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
