import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Enhanced date/time formatting functions
export function formatTime(dateString: string | null | undefined): string {
  if (!dateString) return 'Time not available';
  
  try {
    // Handle time-only strings (e.g., "14:00" or "14:00:00") WITHOUT timezone conversion
    if (!dateString.includes('T') && dateString.includes(':')) {
      const [hoursStr, minutesStr] = dateString.split(':');
      const hours = parseInt(hoursStr);
      const minutes = parseInt(minutesStr);
      
      // Format directly without Date object to avoid timezone issues
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours % 12 || 12;
      const displayMinutes = String(minutes).padStart(2, '0');
      
      return `${displayHour}:${displayMinutes} ${ampm}`;
    }
    
    // Handle combined datetime string
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.warn('Time formatting error:', error, dateString);
    return 'Invalid time';
  }
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Date not available';
  
  try {
    let date: Date;
    if (dateString.includes('T')) {
      date = new Date(dateString);
    } else {
      // Handle date-only strings (e.g., "2025-09-17")
      date = new Date(dateString + 'T00:00:00');
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.warn('Date formatting error:', error, dateString);
    return 'Invalid date';
  }
}

// Helper function to get session start time reliably
// NOTE: Use standardized start_time field (with fallback for legacy data)
export function getSessionStartTime(session: any): Date {
  // Prefer standardized start_time field
  if (session.start_time) {
    return new Date(session.start_time);
  }
  // Fallback to scheduled_date + scheduled_time for legacy data
  if (session.scheduled_date && session.scheduled_time) {
    return new Date(`${session.scheduled_date}T${session.scheduled_time}`);
  }
  // Legacy: session_date + session_time
  if (session.session_date && session.session_time) {
    return new Date(`${session.session_date}T${session.session_time}`);
  }
  // Last resort: use created_at
  if (session.created_at) {
    return new Date(session.created_at);
  }
  return new Date(); // Final fallback
}
