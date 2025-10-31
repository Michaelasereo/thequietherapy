import { supabase } from '@/lib/supabase';
import { isTestTherapist, canBookImmediately, getTestTime } from '@/lib/dev-time-utils';

// =============================================
// UNIFIED AVAILABILITY MANAGEMENT SYSTEM
// Single source of truth for therapist availability
// =============================================

export interface TimeSlot {
  date: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  session_duration: number;
  session_type: string;
  max_sessions: number;
  is_available: boolean;
  is_override?: boolean;
  reason?: string;
}

export interface WeeklyAvailability {
  standardHours: {
    [key: string]: {
      enabled: boolean;
      generalHours?: {
        start: string;
        end: string;
        sessionDuration: number;
      };
      timeSlots?: Array<{
        type: 'available' | 'break' | 'unavailable';
        start: string;
        end: string;
      }>;
    };
  };
  sessionSettings: {
    sessionDuration: number;
    bufferTime: number;
  };
  overrides?: Array<{
    date: string;
    type: 'unavailable' | 'custom_hours';
    start?: string;
    end?: string;
    reason?: string;
  }>;
}

export interface AvailabilityConflict {
  type: 'double_booking' | 'unavailable_time' | 'invalid_duration';
  message: string;
  conflictingSlot?: TimeSlot;
}

export class AvailabilityManager {
  private supabase = supabase;

  // =============================================
  // AVAILABILITY RETRIEVAL
  // =============================================

  /**
   * Get therapist weekly availability (single source of truth)
   */
  async getTherapistAvailability(therapistId: string): Promise<WeeklyAvailability | null> {
    try {
      console.log(`🔍 Fetching availability for therapist: ${therapistId}`);

      const { data, error } = await this.supabase
        .from('availability_weekly_schedules')
        .select('weekly_availability')
        .eq('therapist_id', therapistId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`⚠️ No weekly availability found for therapist ${therapistId}`);
          return null;
        }
        console.error('❌ Error fetching weekly availability:', error);
        throw new Error(`Failed to fetch availability: ${error.message}`);
      }

      return data?.weekly_availability || null;
    } catch (error) {
      console.error('❌ Error getting therapist availability:', error);
      throw error;
    }
  }

  /**
   * Get available time slots for a specific date
   */
  async getAvailableSlots(
    therapistId: string, 
    date: string
  ): Promise<TimeSlot[]> {
    try {
      console.log(`📅 Getting available slots for therapist ${therapistId} on ${date}`);

      // 1. Get weekly availability
      const weeklyAvailability = await this.getTherapistAvailability(therapistId);
      if (!weeklyAvailability) {
        console.log(`❌ No availability configured for therapist ${therapistId}`);
        return [];
      }

      // 2. Get day of week
      const dayOfWeek = new Date(date).getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];

      // 3. Check for date-specific overrides
      const overrides = await this.getAvailabilityOverrides(therapistId, date);
      
      // 4. Generate slots based on weekly schedule and overrides
      let availableSlots = this.generateSlotsFromWeeklySchedule(
        weeklyAvailability, 
        dayName, 
        date
      );

      // 5. Apply overrides
      if (overrides.length > 0) {
        availableSlots = this.applyOverrides(availableSlots, overrides);
      }

      // 6. Remove already booked slots
      const bookedSlots = await this.getBookedSlots(therapistId, date);
      availableSlots = this.removeBookedSlots(availableSlots, bookedSlots);

      // 7. Filter out past slots
      availableSlots = this.filterPastSlots(availableSlots);

      console.log(`✅ Found ${availableSlots.length} available slots for ${date}`);
      return availableSlots;

    } catch (error) {
      console.error('❌ Error getting available slots:', error);
      throw error;
    }
  }

  /**
   * Get available dates for a therapist in a month
   */
  async getAvailableDays(
    therapistId: string, 
    month: number, 
    year: number
  ): Promise<string[]> {
    try {
      const availableDays: string[] = [];
      const daysInMonth = new Date(year, month, 0).getDate();

      // Check each day of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const slots = await this.getAvailableSlots(therapistId, date);
        
        if (slots.length > 0) {
          availableDays.push(date);
        }
      }

      return availableDays;
    } catch (error) {
      console.error('❌ Error getting available days:', error);
      throw error;
    }
  }

  // =============================================
  // AVAILABILITY MANAGEMENT
  // =============================================

  /**
   * Update therapist weekly availability
   */
  async updateWeeklyAvailability(
    therapistId: string, 
    availability: WeeklyAvailability
  ): Promise<void> {
    try {
      console.log(`💾 Updating weekly availability for therapist: ${therapistId}`);

      // Validate availability data
      this.validateWeeklyAvailability(availability);

      const { error } = await this.supabase
        .from('availability_weekly_schedules')
        .upsert({
          therapist_id: therapistId,
          template_name: 'primary',
          weekly_availability: availability,
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'therapist_id,template_name'
        });

      if (error) {
        console.error('❌ Error updating weekly availability:', error);
        throw new Error(`Failed to update availability: ${error.message}`);
      }

      console.log(`✅ Weekly availability updated for therapist ${therapistId}`);
    } catch (error) {
      console.error('❌ Error updating weekly availability:', error);
      throw error;
    }
  }

  /**
   * Add availability override for specific date
   */
  async addAvailabilityOverride(
    therapistId: string,
    date: string,
    overrideType: 'unavailable' | 'custom_hours',
    startTime?: string,
    endTime?: string,
    reason?: string
  ): Promise<void> {
    try {
      console.log(`🚫 Adding availability override for therapist ${therapistId} on ${date}`);

      const { error } = await this.supabase
        .from('availability_overrides')
        .insert({
          therapist_id: therapistId,
          override_date: date,
          override_type: overrideType,
          start_time: startTime,
          end_time: endTime,
          reason: reason,
          is_active: true
        });

      if (error) {
        console.error('❌ Error adding availability override:', error);
        throw new Error(`Failed to add override: ${error.message}`);
      }

      console.log(`✅ Availability override added for ${date}`);
    } catch (error) {
      console.error('❌ Error adding availability override:', error);
      throw error;
    }
  }

  /**
   * Remove availability override
   */
  async removeAvailabilityOverride(overrideId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('availability_overrides')
        .update({ is_active: false })
        .eq('id', overrideId);

      if (error) {
        console.error('❌ Error removing availability override:', error);
        throw new Error(`Failed to remove override: ${error.message}`);
      }

      console.log(`✅ Availability override removed: ${overrideId}`);
    } catch (error) {
      console.error('❌ Error removing availability override:', error);
      throw error;
    }
  }

  // =============================================
  // CONFLICT DETECTION
  // =============================================

  /**
   * Check if a time slot is available for booking
   */
  async isSlotAvailable(
    therapistId: string,
    date: string,
    startTime: string,
    duration: number
  ): Promise<{ available: boolean; conflicts: AvailabilityConflict[] }> {
    try {
      const conflicts: AvailabilityConflict[] = [];

      // 🚀 DEVELOPMENT BYPASS: Test therapists and immediate booking
      if (process.env.NODE_ENV === 'development') {
        if (isTestTherapist(therapistId) || canBookImmediately()) {
          console.log('🚀 Development mode: Bypassing availability checks for test therapist');
          return { available: true, conflicts: [] };
        }
      }

      // 1. Check if therapist is active and verified
      const therapistStatus = await this.getTherapistStatus(therapistId);
      if (therapistStatus !== 'active') {
        conflicts.push({
          type: 'unavailable_time',
          message: 'Therapist is not available for bookings'
        });
        return { available: false, conflicts };
      }

      // 2. Check weekly availability
      const weeklyAvailability = await this.getTherapistAvailability(therapistId);
      if (!weeklyAvailability) {
        conflicts.push({
          type: 'unavailable_time',
          message: 'No availability configured for this therapist'
        });
        return { available: false, conflicts };
      }

      // 3. Check if time falls within available hours
      const dayOfWeek = new Date(date).getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      const dayAvailability = weeklyAvailability.standardHours[dayName];

      if (!dayAvailability || !dayAvailability.enabled) {
        conflicts.push({
          type: 'unavailable_time',
          message: 'Therapist is not available on this day'
        });
        return { available: false, conflicts };
      }

      // 4. Check time slot availability
      const isTimeAvailable = this.isTimeWithinAvailability(
        startTime, 
        duration, 
        dayAvailability
      );

      if (!isTimeAvailable) {
        conflicts.push({
          type: 'unavailable_time',
          message: 'Time slot is not within therapist availability'
        });
        return { available: false, conflicts };
      }

      // 5. Check for overrides
      const overrides = await this.getAvailabilityOverrides(therapistId, date);
      const overrideConflict = this.checkOverrideConflicts(startTime, duration, overrides);
      if (overrideConflict) {
        conflicts.push(overrideConflict);
        return { available: false, conflicts };
      }

      // 6. Check for existing bookings
      const existingBookings = await this.getBookedSlots(therapistId, date);
      const bookingConflict = this.checkBookingConflicts(startTime, duration, existingBookings);
      if (bookingConflict) {
        conflicts.push(bookingConflict);
        return { available: false, conflicts };
      }

      return { available: true, conflicts };

    } catch (error) {
      console.error('❌ Error checking slot availability:', error);
      throw error;
    }
  }

  // =============================================
  // HELPER METHODS
  // =============================================

  /**
   * Get therapist status
   */
  private async getTherapistStatus(therapistId: string): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('therapist_states')
        .select('current_status')
        .eq('therapist_id', therapistId)
        .order('status_changed_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return 'inactive';
      }

      return data.current_status;
    } catch (error) {
      console.error('❌ Error getting therapist status:', error);
      return 'inactive';
    }
  }

  /**
   * Get availability overrides for a specific date
   */
  private async getAvailabilityOverrides(therapistId: string, date: string): Promise<any[]> {
    const { data } = await this.supabase
      .from('availability_overrides')
      .select('*')
      .eq('therapist_id', therapistId)
      .eq('override_date', date)
      .eq('is_active', true);

    return data || [];
  }

  /**
   * Get booked slots for a specific date
   */
  private async getBookedSlots(therapistId: string, date: string): Promise<any[]> {
    const { data } = await this.supabase
      .from('sessions')
      .select('scheduled_time, duration_minutes')
      .eq('therapist_id', therapistId)
      .eq('scheduled_date', date)
      .in('status', ['scheduled', 'confirmed', 'in_progress']);

    return data || [];
  }

  /**
   * Generate slots from weekly schedule
   */
  private generateSlotsFromWeeklySchedule(
    weeklyAvailability: WeeklyAvailability,
    dayName: string,
    date: string
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const dayAvailability = weeklyAvailability.standardHours[dayName];

    if (!dayAvailability || !dayAvailability.enabled) {
      return slots;
    }

    const sessionDuration = weeklyAvailability.sessionSettings?.sessionDuration || 60;

    // Use generalHours if available (new format)
    if (dayAvailability.generalHours) {
      const { start, end } = dayAvailability.generalHours;
      const generatedSlots = this.generateTimeSlots(start, end, sessionDuration, date);
      slots.push(...generatedSlots);
    } else if (dayAvailability.timeSlots) {
      // Fallback to timeSlots (old format)
      for (const timeSlot of dayAvailability.timeSlots) {
        if (timeSlot.type === 'available') {
          const generatedSlots = this.generateTimeSlots(
            timeSlot.start, 
            timeSlot.end, 
            sessionDuration, 
            date
          );
          slots.push(...generatedSlots);
        }
      }
    }

    return slots;
  }

  /**
   * Generate time slots within a time range
   */
  private generateTimeSlots(
    startTime: string, 
    endTime: string, 
    duration: number, 
    date: string
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    
    // Parse time strings directly to avoid timezone issues
    const parseTime = (timeStr: string): { hours: number, minutes: number } => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return { hours, minutes };
    };
    
    const formatTime = (hours: number, minutes: number): string => {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };
    
    const timeToMinutes = (hours: number, minutes: number): number => {
      return hours * 60 + minutes;
    };
    
    const startParsed = parseTime(startTime);
    const endParsed = parseTime(endTime);
    const startMinutes = timeToMinutes(startParsed.hours, startParsed.minutes);
    const endMinutes = timeToMinutes(endParsed.hours, endParsed.minutes);
    
    let currentMinutes = startMinutes;
    
    while (currentMinutes < endMinutes) {
      const slotEndMinutes = currentMinutes + duration;
      
      if (slotEndMinutes <= endMinutes) {
        const currentHours = Math.floor(currentMinutes / 60);
        const currentMins = currentMinutes % 60;
        const slotEndHours = Math.floor(slotEndMinutes / 60);
        const slotEndMins = slotEndMinutes % 60;
        
        const timeString = formatTime(currentHours, currentMins);
        const endTimeString = formatTime(slotEndHours, slotEndMins);
        
        slots.push({
          date: date,
          day_of_week: new Date(date).getDay(),
          start_time: timeString,
          end_time: endTimeString,
          session_duration: duration,
          session_type: 'individual',
          max_sessions: 1,
          is_available: true
        });
      }
      
      // Move to next slot
      currentMinutes += duration;
    }
    
    return slots;
  }

  /**
   * Apply availability overrides to slots
   */
  private applyOverrides(slots: TimeSlot[], overrides: any[]): TimeSlot[] {
    for (const override of overrides) {
      if (override.override_type === 'unavailable') {
        // Remove all slots for this date
        return [];
      } else if (override.override_type === 'custom_hours') {
        // Filter slots to only include those within custom hours
        slots = slots.filter(slot => 
          slot.start_time >= override.start_time && 
          slot.end_time <= override.end_time
        );
      }
    }
    return slots;
  }

  /**
   * Remove booked slots from available slots
   */
  private removeBookedSlots(slots: TimeSlot[], bookedSlots: any[]): TimeSlot[] {
    return slots.filter(slot => {
      return !bookedSlots.some(booked => booked.scheduled_time === slot.start_time);
    });
  }

  /**
   * Filter out past time slots
   */
  private filterPastSlots(slots: TimeSlot[]): TimeSlot[] {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const today = now.toISOString().slice(0, 10);

    return slots.filter(slot => {
      if (slot.date < today) return false;
      if (slot.date === today && slot.start_time <= currentTime) return false;
      return true;
    });
  }

  /**
   * Check if time is within availability
   */
  private isTimeWithinAvailability(
    startTime: string, 
    duration: number, 
    dayAvailability: any
  ): boolean {
    const endTime = this.addMinutesToTime(startTime, duration);

    // Check generalHours first
    if (dayAvailability.generalHours) {
      const { start, end } = dayAvailability.generalHours;
      return startTime >= start && endTime <= end;
    }

    // Check timeSlots
    if (dayAvailability.timeSlots) {
      return dayAvailability.timeSlots.some((slot: any) => 
        slot.type === 'available' && 
        startTime >= slot.start && 
        endTime <= slot.end
      );
    }

    return false;
  }

  /**
   * Check override conflicts
   */
  private checkOverrideConflicts(startTime: string, duration: number, overrides: any[]): AvailabilityConflict | null {
    const endTime = this.addMinutesToTime(startTime, duration);

    for (const override of overrides) {
      if (override.override_type === 'unavailable') {
        return {
          type: 'unavailable_time',
          message: `Therapist is unavailable on this date: ${override.reason || 'No reason provided'}`
        };
      } else if (override.override_type === 'custom_hours') {
        if (startTime < override.start_time || endTime > override.end_time) {
          return {
            type: 'unavailable_time',
            message: `Time slot is outside custom availability hours (${override.start_time} - ${override.end_time})`
          };
        }
      }
    }

    return null;
  }

  /**
   * Check booking conflicts
   */
  private checkBookingConflicts(startTime: string, duration: number, bookedSlots: any[]): AvailabilityConflict | null {
    const endTime = this.addMinutesToTime(startTime, duration);

    for (const booked of bookedSlots) {
      const bookedEnd = this.addMinutesToTime(booked.scheduled_time, booked.duration_minutes || 60);
      
      if (startTime < bookedEnd && endTime > booked.scheduled_time) {
        return {
          type: 'double_booking',
          message: `Time slot conflicts with existing booking (${booked.scheduled_time})`
        };
      }
    }

    return null;
  }

  /**
   * Add minutes to time string
   */
  private addMinutesToTime(timeString: string, minutes: number): string {
    const [hours, mins] = timeString.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }

  /**
   * Validate weekly availability data
   */
  private validateWeeklyAvailability(availability: WeeklyAvailability): void {
    if (!availability.standardHours) {
      throw new Error('standardHours is required');
    }

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    for (const dayName of dayNames) {
      const dayAvailability = availability.standardHours[dayName];
      if (dayAvailability && dayAvailability.enabled) {
        if (dayAvailability.generalHours) {
          const { start, end } = dayAvailability.generalHours;
          if (start >= end) {
            throw new Error(`Invalid time range for ${dayName}: start time must be before end time`);
          }
        }
      }
    }
  }
}

// Export singleton instance
export const availabilityManager = new AvailabilityManager();
export default availabilityManager;
