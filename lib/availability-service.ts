/**
 * Availability Service
 * 
 * This service handles data transformation, validation, and management
 * for the 3-level availability system. It provides backward compatibility
 * with existing database schemas while supporting the new enhanced interface.
 */

import { 
  WeeklyAvailability, 
  AvailabilityOverride, 
  AvailabilityTemplate,
  TimeSlot,
  DayAvailability,
  SessionSettings,
  DEFAULT_WEEKLY_AVAILABILITY,
  DEFAULT_DAY_AVAILABILITY,
  DEFAULT_TIME_SLOT
} from '@/types/availability';
import { createServerClient } from '@/lib/supabase';

export class AvailabilityService {
  /**
   * Save therapist availability using the new WeeklyAvailability interface
   */
  static async saveTherapistAvailability(
    therapistId: string, 
    availability: WeeklyAvailability
  ): Promise<{ success: boolean; message: string; templateId?: string }> {
    try {
      // Validate availability data
      const validation = this.validateWeeklyAvailability(availability);
      if (!validation.isValid) {
        return {
          success: false,
          message: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Transform to legacy format for database storage
      const legacyTemplates = this.transformToLegacyFormat(availability, therapistId);
      const supabase = createServerClient();

      // Delete existing templates for this therapist
      await supabase
        .from('availability_templates')
        .delete()
        .eq('therapist_id', therapistId);

      // Insert new templates
      const { data: insertedTemplates, error: insertError } = await supabase
        .from('availability_templates')
        .insert(legacyTemplates)
        .select();

      if (insertError) {
        console.error('Error inserting templates:', insertError);
        return {
          success: false,
          message: 'Failed to save availability templates'
        };
      }

      // Store the new format in a separate table for future use
      const { error: newFormatError } = await supabase
        .from('availability_weekly_schedules')
        .upsert({
          therapist_id: therapistId,
          weekly_availability: availability,
          template_name: 'primary',
          is_active: true,
          updated_at: new Date().toISOString()
        });

      if (newFormatError) {
        console.warn('Failed to store new format, but legacy format saved:', newFormatError);
      }

      return {
        success: true,
        message: 'Availability saved successfully',
        templateId: insertedTemplates?.[0]?.id
      };

    } catch (error) {
      console.error('Error saving therapist availability:', error);
      return {
        success: false,
        message: 'Internal server error'
      };
    }
  }

  /**
   * Get therapist availability in the new format
   */
  static async getTherapistAvailability(therapistId: string): Promise<WeeklyAvailability> {
    try {
      const supabase = createServerClient();
      
      // Try to get from new format first
      const { data: newFormatData, error: newFormatError } = await supabase
        .from('availability_weekly_schedules')
        .select('weekly_availability')
        .eq('therapist_id', therapistId)
        .eq('is_active', true)
        .single();

      if (!newFormatError && newFormatData?.weekly_availability) {
        return newFormatData.weekly_availability as WeeklyAvailability;
      }

      // Fallback to legacy format
      const { data: legacyTemplates, error: legacyError } = await supabase
        .from('availability_templates')
        .select('*')
        .eq('therapist_id', therapistId)
        .eq('is_active', true)
        .order('day_of_week', { ascending: true });

      if (legacyError || !legacyTemplates) {
        console.warn('No existing availability found, returning default');
        return this.getDefaultAvailability();
      }

      // Transform legacy format to new format
      return this.transformLegacyToNewFormat(legacyTemplates);

    } catch (error) {
      console.error('Error fetching therapist availability:', error);
      return this.getDefaultAvailability();
    }
  }

  /**
   * Get availability overrides for a therapist
   */
  static async getAvailabilityOverrides(
    therapistId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<AvailabilityOverride[]> {
    try {
      const supabase = createServerClient();
      
      let query = supabase
        .from('availability_overrides')
        .select('*')
        .eq('therapist_id', therapistId);

      if (startDate) {
        query = query.gte('override_date', startDate);
      }
      if (endDate) {
        query = query.lte('override_date', endDate);
      }

      const { data: overrides, error } = await query.order('override_date', { ascending: true });

      if (error) {
        console.error('Error fetching overrides:', error);
        return [];
      }

      return (overrides || []).map(override => this.transformLegacyOverride(override));

    } catch (error) {
      console.error('Error fetching availability overrides:', error);
      return [];
    }
  }

  /**
   * Save availability override
   */
  static async saveAvailabilityOverride(
    therapistId: string,
    override: Omit<AvailabilityOverride, 'id' | 'therapistId' | 'createdAt' | 'updatedAt'>
  ): Promise<{ success: boolean; message: string; override?: AvailabilityOverride }> {
    try {
      const legacyOverride = this.transformNewOverrideToLegacy(override, therapistId);
      const supabase = createServerClient();

      const { data: insertedOverride, error } = await supabase
        .from('availability_overrides')
        .upsert(legacyOverride)
        .select()
        .single();

      if (error) {
        console.error('Error saving override:', error);
        return {
          success: false,
          message: 'Failed to save availability override'
        };
      }

      return {
        success: true,
        message: 'Override saved successfully',
        override: this.transformLegacyOverride(insertedOverride)
      };

    } catch (error) {
      console.error('Error saving availability override:', error);
      return {
        success: false,
        message: 'Internal server error'
      };
    }
  }

  /**
   * Transform new WeeklyAvailability format to legacy database format
   */
  private static transformToLegacyFormat(
    availability: WeeklyAvailability, 
    therapistId: string
  ): any[] {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const templates: any[] = [];

    days.forEach((day, index) => {
      const dayAvailability = availability.standardHours[day as keyof typeof availability.standardHours];
      
      if (dayAvailability.enabled && dayAvailability.timeSlots.length > 0) {
        dayAvailability.timeSlots.forEach(slot => {
          templates.push({
            therapist_id: therapistId,
            day_of_week: index,
            start_time: slot.start,
            end_time: slot.end,
            session_duration: slot.duration,
            session_type: slot.type,
            max_sessions: slot.maxSessions,
            is_active: true
          });
        });
      }
    });

    return templates;
  }

  /**
   * Transform legacy database format to new WeeklyAvailability format
   */
  private static transformLegacyToNewFormat(legacyTemplates: any[]): WeeklyAvailability {
    const availability = { ...DEFAULT_WEEKLY_AVAILABILITY };
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    // Group templates by day
    const templatesByDay = legacyTemplates.reduce((acc, template) => {
      const dayName = days[template.day_of_week];
      if (!acc[dayName]) {
        acc[dayName] = [];
      }
      acc[dayName].push(template);
      return acc;
    }, {} as Record<string, any[]>);

    // Transform each day
    days.forEach(dayName => {
      const dayTemplates = templatesByDay[dayName] || [];
      const dayAvailability: DayAvailability = {
        enabled: dayTemplates.length > 0,
        timeSlots: dayTemplates.map((template: any) => ({
          id: template.id || `slot-${Date.now()}-${Math.random()}`,
          start: template.start_time,
          end: template.end_time,
          duration: template.session_duration || 60,
          type: template.session_type || 'individual',
          maxSessions: template.max_sessions || 1,
          title: `${template.session_type || 'Individual'} Session`,
          isAvailable: template.is_active !== false
        })),
        customSlots: [],
        breaks: [],
        notes: ''
      };

      availability.standardHours[dayName as keyof typeof availability.standardHours] = dayAvailability;
    });

    return availability;
  }

  /**
   * Transform legacy override to new format
   */
  private static transformLegacyOverride(legacyOverride: any): AvailabilityOverride {
    return {
      id: legacyOverride.id,
      therapistId: legacyOverride.therapist_id,
      date: legacyOverride.override_date,
      type: legacyOverride.is_available ? 'custom_hours' : 'unavailable',
      isAvailable: legacyOverride.is_available,
      customHours: legacyOverride.is_available ? {
        start: legacyOverride.start_time,
        end: legacyOverride.end_time,
        timeSlots: [{
          id: `override-${legacyOverride.id}`,
          start: legacyOverride.start_time,
          end: legacyOverride.end_time,
          duration: legacyOverride.session_duration || 60,
          type: legacyOverride.session_type || 'individual',
          maxSessions: legacyOverride.max_sessions || 1,
          title: 'Override Session',
          isAvailable: true
        }]
      } : undefined,
      reason: legacyOverride.reason || '',
      notes: legacyOverride.notes,
      createdAt: legacyOverride.created_at,
      updatedAt: legacyOverride.updated_at
    };
  }

  /**
   * Transform new override to legacy format
   */
  private static transformNewOverrideToLegacy(
    override: Omit<AvailabilityOverride, 'id' | 'therapistId' | 'createdAt' | 'updatedAt'>,
    therapistId: string
  ): any {
    return {
      therapist_id: therapistId,
      override_date: override.date,
      is_available: override.isAvailable,
      start_time: override.customHours?.start,
      end_time: override.customHours?.end,
      session_duration: override.customHours?.timeSlots?.[0]?.duration || 60,
      session_type: override.customHours?.timeSlots?.[0]?.type || 'individual',
      max_sessions: override.customHours?.timeSlots?.[0]?.maxSessions || 1,
      reason: override.reason,
      notes: override.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Validate WeeklyAvailability data
   */
  private static validateWeeklyAvailability(availability: WeeklyAvailability): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!availability.standardHours) {
      errors.push('Standard hours are required');
    }

    if (!availability.sessionSettings) {
      errors.push('Session settings are required');
    }

    // Validate each day
    const days = Object.keys(availability.standardHours);
    days.forEach(day => {
      const dayAvailability = availability.standardHours[day as keyof typeof availability.standardHours];
      
      if (dayAvailability.enabled && dayAvailability.timeSlots.length === 0) {
        warnings.push(`${day} is enabled but has no time slots`);
      }

      // Validate time slots
      dayAvailability.timeSlots.forEach((slot: TimeSlot, index: number) => {
        if (!slot.start || !slot.end) {
          errors.push(`${day} slot ${index + 1} is missing start or end time`);
        }

        if (slot.duration <= 0) {
          errors.push(`${day} slot ${index + 1} has invalid duration`);
        }

        if (slot.maxSessions <= 0) {
          errors.push(`${day} slot ${index + 1} has invalid max sessions`);
        }
      });
    });

    // Validate session settings
    if (availability.sessionSettings.sessionDuration <= 0) {
      errors.push('Session duration must be greater than 0');
    }

    if (availability.sessionSettings.bufferTime < 0) {
      errors.push('Buffer time cannot be negative');
    }

    if (availability.sessionSettings.maxSessionsPerDay <= 0) {
      errors.push('Max sessions per day must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get default availability configuration
   */
  static getDefaultAvailability(): WeeklyAvailability {
    return { ...DEFAULT_WEEKLY_AVAILABILITY };
  }


  /**
   * Calculate end time from start time and duration
   */
  static calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    
    return endDate.toTimeString().slice(0, 5);
  }

  /**
   * Generate time slots for a day based on start/end times and session duration
   */
  static generateTimeSlots(
    startTime: string,
    endTime: string,
    sessionDuration: number,
    bufferTime: number = 0
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const totalDuration = sessionDuration + bufferTime;
    
    let currentMinutes = startMinutes;
    let slotIndex = 1;
    
    while (currentMinutes + sessionDuration <= endMinutes) {
      const slotStart = this.formatMinutesToTime(currentMinutes);
      const slotEnd = this.formatMinutesToTime(currentMinutes + sessionDuration);
      
      slots.push({
        ...DEFAULT_TIME_SLOT,
        id: `slot-${Date.now()}-${slotIndex}`,
        start: slotStart,
        end: slotEnd,
        duration: sessionDuration,
        title: `Session ${slotIndex}`
      });
      
      currentMinutes += totalDuration;
      slotIndex++;
    }
    
    return slots;
  }

  /**
   * Format minutes to HH:MM time string
   */
  private static formatMinutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Check if two time slots overlap
   */
  static doTimeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
    const start1 = this.timeToMinutes(slot1.start);
    const end1 = this.timeToMinutes(slot1.end);
    const start2 = this.timeToMinutes(slot2.start);
    const end2 = this.timeToMinutes(slot2.end);
    
    return start1 < end2 && start2 < end1;
  }

  /**
   * Convert time string to minutes
   */
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
