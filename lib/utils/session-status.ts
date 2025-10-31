/**
 * Session status utility functions
 * 
 * Provides consistent status calculation and formatting across the application
 */

import type { SessionStatus } from '@/types/sessions';

/**
 * Calculate the effective session status based on database status and timing
 * 
 * @param session - Session object with status and timing information
 * @returns The effective status string
 */
export function getSessionStatus(session: {
  status?: string | null;
  start_time?: string | Date | null;
  end_time?: string | Date | null;
}): SessionStatus {
  const status = (session.status?.toLowerCase() || '').trim();
  const now = new Date();
  
  // Handle terminal states (they don't change based on time)
  if (status === 'completed' || status === 'cancelled' || status === 'no_show') {
    return status as SessionStatus;
  }
  
  // Calculate timing
  let startTime: Date | null = null;
  let endTime: Date | null = null;
  
  if (session.start_time) {
    startTime = typeof session.start_time === 'string' 
      ? new Date(session.start_time) 
      : session.start_time;
  }
  
  if (session.end_time) {
    endTime = typeof session.end_time === 'string' 
      ? new Date(session.end_time) 
      : session.end_time;
  }
  
  // If we have timing information, check current state
  if (startTime) {
    // Session hasn't started yet
    if (now < startTime) {
      return 'scheduled';
    }
    
    // Session is currently happening
    if (!endTime || now < endTime) {
      // If status is 'scheduled' but session time has passed, it's in progress
      if (status === 'scheduled' || status === 'confirmed') {
        return 'in_progress';
      }
      return (status as SessionStatus) || 'in_progress';
    }
    
    // Session has ended but status wasn't updated
    if (status === 'scheduled' || status === 'in_progress') {
      return 'completed'; // Auto-complete if past end time
    }
  }
  
  // Default to whatever status is in database
  return (status as SessionStatus) || 'scheduled';
}

/**
 * Check if a session can be joined (within allowed time window)
 * 
 * @param session - Session object with timing information
 * @param minutesBefore - How many minutes before start time can user join (default: 15)
 * @returns Whether the session can be joined
 */
export function canJoinSession(
  session: {
    start_time?: string | Date | null;
    end_time?: string | Date | null;
    status?: string | null;
  },
  minutesBefore: number = 15
): boolean {
  const now = new Date();
  const status = getSessionStatus(session);
  
  // Cannot join terminal states
  if (status === 'completed' || status === 'cancelled' || status === 'no_show') {
    return false;
  }
  
  // Can join if in progress
  if (status === 'in_progress') {
    return true;
  }
  
  // Check timing
  if (session.start_time) {
    const startTime = typeof session.start_time === 'string' 
      ? new Date(session.start_time) 
      : session.start_time;
    
    // Cannot join if session has passed
    if (now > startTime) {
      const endTime = session.end_time 
        ? (typeof session.end_time === 'string' ? new Date(session.end_time) : session.end_time)
        : null;
      
      // If no end time or still within end time, allow join
      if (!endTime || now <= endTime) {
        return true;
      }
      
      return false;
    }
    
    // Can join if within the allowed window before start
    const joinTime = new Date(startTime.getTime() - minutesBefore * 60 * 1000);
    return now >= joinTime;
  }
  
  return false;
}

/**
 * Get time until session starts (in milliseconds)
 * 
 * @param session - Session object with start_time
 * @returns Milliseconds until start, or 0 if already started/ended
 */
export function getTimeUntilStart(session: {
  start_time?: string | Date | null;
}): number {
  if (!session.start_time) return 0;
  
  const startTime = typeof session.start_time === 'string' 
    ? new Date(session.start_time) 
    : session.start_time;
  const now = new Date();
  
  const diff = startTime.getTime() - now.getTime();
  return Math.max(0, diff);
}

/**
 * Get time remaining in session (in milliseconds)
 * 
 * @param session - Session object with end_time
 * @returns Milliseconds remaining, or 0 if session has ended
 */
export function getTimeRemaining(session: {
  end_time?: string | Date | null;
}): number {
  if (!session.end_time) return 0;
  
  const endTime = typeof session.end_time === 'string' 
    ? new Date(session.end_time) 
    : session.end_time;
  const now = new Date();
  
  const diff = endTime.getTime() - now.getTime();
  return Math.max(0, diff);
}

/**
 * Check if session is currently active (in progress)
 * 
 * @param session - Session object with timing and status
 * @returns Whether the session is currently active
 */
export function isSessionActive(session: {
  start_time?: string | Date | null;
  end_time?: string | Date | null;
  status?: string | null;
}): boolean {
  const status = getSessionStatus(session);
  
  if (status !== 'in_progress') {
    return false;
  }
  
  const now = new Date();
  
  if (session.start_time) {
    const startTime = typeof session.start_time === 'string' 
      ? new Date(session.start_time) 
      : session.start_time;
    
    if (now < startTime) return false;
  }
  
  if (session.end_time) {
    const endTime = typeof session.end_time === 'string' 
      ? new Date(session.end_time) 
      : session.end_time;
    
    if (now > endTime) return false;
  }
  
  return true;
}

/**
 * Get a human-readable status label
 * 
 * @param status - Session status
 * @returns Human-readable label
 */
export function getStatusLabel(status: SessionStatus | string): string {
  const statusMap: Record<string, string> = {
    scheduled: 'Scheduled',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
  };
  
  return statusMap[status.toLowerCase()] || status;
}

/**
 * Get status badge variant for UI components
 * 
 * @param status - Session status
 * @returns Badge variant name
 */
export function getStatusBadgeVariant(status: SessionStatus | string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const statusLower = status.toLowerCase();
  
  switch (statusLower) {
    case 'completed':
      return 'outline';
    case 'cancelled':
    case 'no_show':
      return 'destructive';
    case 'in_progress':
      return 'default';
    case 'scheduled':
    case 'confirmed':
      return 'secondary';
    default:
      return 'secondary';
  }
}

