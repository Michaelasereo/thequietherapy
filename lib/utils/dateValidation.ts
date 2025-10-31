/**
 * Date validation utilities for booking system
 */

export const isPastDate = (dateString: string, timeString: string): boolean => {
  try {
    // Combine date and time into a single datetime object in local timezone
    const bookingDateTime = new Date(`${dateString}T${timeString}`);
    const now = new Date();
    
    // Add a small buffer (10 minutes) to avoid edge cases where someone
    // is booking right at the current time
    const bufferMinutes = 10;
    const nowWithBuffer = new Date(now.getTime() + bufferMinutes * 60000);
    
    console.log('🔍 Date validation:', {
      dateString,
      timeString,
      bookingDateTime: bookingDateTime.toISOString(),
      now: now.toISOString(),
      nowWithBuffer: nowWithBuffer.toISOString(),
      isPast: bookingDateTime < nowWithBuffer
    });
    
    return bookingDateTime < nowWithBuffer;
  } catch (error) {
    console.error('Error validating date:', error);
    return true; // If we can't parse the date, assume it's invalid (past)
  }
};

// Additional validation helpers
export const isValidBookingDate = (dateString: string, timeString: string): {
  isValid: boolean;
  error?: string;
} => {
  if (!dateString || !timeString) {
    return { isValid: false, error: 'Date and time are required' };
  }

  if (isPastDate(dateString, timeString)) {
    return { isValid: false, error: 'Cannot book sessions for past dates. Please select a future time slot.' };
  }

  // Add more validations as needed
  // e.g., business hours, therapist availability, etc.

  return { isValid: true };
};

// Filter out past time slots
export const filterOutPastSlots = (slots: any[]): any[] => {
  const now = new Date();
  return slots.filter(slot => {
    if (!slot.date || !slot.start_time) return false;
    
    // Create datetime in local timezone to avoid timezone issues
    const slotDateTime = new Date(`${slot.date}T${slot.start_time}`);
    
    // For override slots, be more lenient with the buffer time
    const isOverrideSlot = slot.is_override === true;
    const bufferMinutes = isOverrideSlot ? 5 : 10; // 5 minutes buffer for override slots (very lenient)
    const bufferTime = new Date(now.getTime() + bufferMinutes * 60000);
    
    console.log('🔍 Slot filtering:', {
      slotDate: slot.date,
      slotTime: slot.start_time,
      slotDateTime: slotDateTime.toISOString(),
      now: now.toISOString(),
      bufferTime: bufferTime.toISOString(),
      isFuture: slotDateTime > bufferTime,
      isOverrideSlot,
      bufferMinutes
    });
    
    return slotDateTime > bufferTime;
  });
};

// Format date for display
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

// Format time for display
export const formatTime = (timeString: string): string => {
  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString;
  }
};
