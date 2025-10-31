import { supabase } from '@/lib/supabase';
import { availabilityCache } from '@/lib/availability-cache';

export interface TimeSlot {
  id: string;
  date: string;
  day_of_week: number;
  day_name: string;
  start_time: string;
  end_time: string;
  session_duration: number;
  session_type: 'individual' | 'group';
  session_title: string;
  max_sessions: number;
  is_override: boolean;
  is_available: boolean;
  reason?: string;
}

export interface BookingConfirmation {
  success: boolean;
  booking_id?: string;
  session_url?: string;
  message?: string;
  error?: string;
}

export const AvailabilityService = {
  /**
   * Get available dates for a therapist in a specific month
   * Returns an array of date strings that have available slots
   */
  async getAvailableDays(therapistId: string, month: number, year: number): Promise<string[]> {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of the month
      
      // Format dates in local timezone to avoid timezone issues
      const formatDateLocal = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      
      // Add cache-busting to ensure fresh data
      const cacheBuster = Date.now();
      const response = await fetch(`/api/availability/days?therapist_id=${therapistId}&start_date=${formatDateLocal(startDate)}&end_date=${formatDateLocal(endDate)}&_t=${cacheBuster}`, {
        cache: 'no-store', // Ensure fresh data
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const { availableDays } = await response.json();
      return availableDays || [];
    } catch (error) {
      console.error('Error fetching available days:', error);
      return [];
    }
  },

  /**
   * Get available time slots for a specific date
   * Returns 25-minute slots from the database function
   */
  async getTimeSlots(therapistId: string, date: string): Promise<TimeSlot[]> {
    try {
      // CRITICAL: Skip cache for slot fetches to ensure real-time availability
      // Therapists need to see changes immediately when they update availability
      console.log('🔍 Fetching fresh time slots (cache bypassed for real-time updates):', { therapistId, date })

      // Add cache-busting to ensure fresh data
      const cacheBuster = Date.now();
      const response = await fetch(`/api/availability/slots?therapist_id=${therapistId}&date=${date}&_t=${cacheBuster}`, {
        cache: 'no-store', // Ensure fresh data
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const { slots } = await response.json();
      const timeSlots = slots || [];
      
      console.log('✅ Fetched fresh time slots:', timeSlots.length)
      
      return timeSlots;
    } catch (error) {
      console.error('Error fetching time slots:', error);
      return [];
    }
  },

  /**
   * Book a selected time slot
   */
  async bookSlot(therapistId: string, slot: TimeSlot, userId: string, additionalData?: any): Promise<BookingConfirmation> {
    try {
      const response = await fetch('/api/sessions/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          therapist_id: therapistId,
          session_date: slot.date, // YYYY-MM-DD format
          start_time: slot.start_time, // HH:MM format
          duration: slot.session_duration,
          session_type: slot.session_type === 'individual' ? 'video' : 'video', // Map to API expected values
          notes: additionalData?.notes || '',
          ...additionalData
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Booking failed');
      }
      
      return result;
    } catch (error) {
      console.error('Error booking slot:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Booking failed'
      };
    }
  },

  /**
   * Check if a specific date has availability
   */
  async hasAvailability(therapistId: string, date: string): Promise<boolean> {
    try {
      const slots = await this.getTimeSlots(therapistId, date);
      return slots.length > 0;
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  },

  /**
   * Get next available slot for a therapist
   * Useful for "Quick Book" functionality
   */
  async getNextAvailableSlot(therapistId: string, startFromDate?: string): Promise<TimeSlot | null> {
    try {
      // Format dates in local timezone to avoid timezone issues
      const formatDateLocal = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      
      const startDate = startFromDate || formatDateLocal(new Date());
      const endDate = formatDateLocal(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)); // Next 14 days
      
      const response = await fetch(`/api/availability/next-slot?therapist_id=${therapistId}&start_date=${startDate}&end_date=${endDate}`);
      
      if (!response.ok) {
        return null;
      }
      
      const { slot } = await response.json();
      return slot || null;
    } catch (error) {
      console.error('Error fetching next available slot:', error);
      return null;
    }
  }
};
