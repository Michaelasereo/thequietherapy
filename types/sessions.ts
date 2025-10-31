/**
 * Shared TypeScript type definitions for sessions
 * 
 * This file provides consistent type definitions across the application
 * for session-related data structures.
 */

export type SessionStatus = 
  | 'scheduled' 
  | 'confirmed' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'no_show';

export type SessionType = 'video' | 'audio' | 'chat' | 'in_person';

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

/**
 * Base session interface - core fields that all sessions have
 */
export interface Session {
  id: string;
  status: SessionStatus;
  start_time: string; // ISO 8601 timestamp
  end_time: string; // ISO 8601 timestamp
  duration_minutes: number;
  title?: string;
  description?: string;
  notes?: string;
  session_type?: SessionType;
  
  // User references
  user_id: string;
  therapist_id: string;
  
  // Optional fields
  session_url?: string;
  daily_room_url?: string;
  daily_room_name?: string;
  price?: number;
  currency?: string;
  payment_status?: PaymentStatus;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  completed_at?: string;
  cancelled_at?: string;
  
  // Legacy fields (for backward compatibility during migration)
  scheduled_date?: string; // DEPRECATED: Use start_time instead
  scheduled_time?: string; // DEPRECATED: Use start_time instead
  duration?: number; // DEPRECATED: Use duration_minutes instead
}

/**
 * Therapist-specific session interface
 * Includes complaints field (only visible to therapists)
 */
export interface TherapistSession extends Session {
  complaints?: string; // User complaints - only therapists can see this
  users: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

/**
 * User-specific session interface
 * Includes therapist information
 */
export interface UserSession extends Session {
  therapist: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

/**
 * Session with joined data (used in API responses)
 */
export interface SessionWithRelations extends Session {
  therapist?: {
    id: string;
    full_name: string;
    email: string;
  };
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
  users?: {
    id: string;
    full_name: string;
    email: string;
  };
  session_notes?: {
    id: string;
    notes?: string;
    soap_subjective?: string;
    soap_objective?: string;
    soap_assessment?: string;
    soap_plan?: string;
    ai_generated?: boolean;
    created_at: string;
    updated_at: string;
  };
}

/**
 * Session creation input
 */
export interface CreateSessionInput {
  user_id: string;
  therapist_id: string;
  start_time: string; // ISO 8601 timestamp
  duration_minutes: number;
  title?: string;
  description?: string;
  session_type?: SessionType;
  complaints?: string;
}

/**
 * Session update input
 */
export interface UpdateSessionInput {
  status?: SessionStatus;
  notes?: string;
  complaints?: string;
  title?: string;
  description?: string;
}

/**
 * Session query parameters
 */
export interface SessionQueryParams {
  user_id?: string;
  therapist_id?: string;
  status?: SessionStatus | SessionStatus[];
  upcoming?: boolean;
  past?: boolean;
  limit?: number;
  offset?: number;
  order_by?: 'start_time' | 'created_at' | 'status';
  order_direction?: 'asc' | 'desc';
}

