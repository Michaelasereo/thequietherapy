import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Enhanced date/time formatting functions
export function formatTime(dateString: string | null | undefined): string {
  if (!dateString) return 'Time not available';
  
  try {
    // Handle combined datetime string
    let date: Date;
    if (dateString.includes('T')) {
      date = new Date(dateString);
    } else {
      // Handle time-only strings (e.g., "14:00:00")
      const [hours, minutes] = dateString.split(':');
      date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
    }
    
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
export function getSessionStartTime(session: any): Date {
  if (session.start_time) {
    return new Date(session.start_time);
  }
  if (session.scheduled_date && session.scheduled_time) {
    return new Date(session.scheduled_date + 'T' + session.scheduled_time);
  }
  return new Date(); // Fallback
}
