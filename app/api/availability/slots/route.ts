import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { AvailabilityService } from '@/lib/availability-service';

/**
 * Get available time slots for a specific date
 * Supports both NEW weekly availability system and OLD template system
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const therapistId = searchParams.get('therapist_id');
    const date = searchParams.get('date');

    console.log('🔍 Availability Slots API Called:', { therapistId, date });

    if (!therapistId || !date) {
      return NextResponse.json(
        { error: 'Therapist ID and date are required' },
        { status: 400 }
      );
    }

    // Validate date format
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ 
        error: 'Invalid date format. Use YYYY-MM-DD format.' 
      }, { status: 400 });
    }

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = new Date(date).getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

    console.log('📅 Day Calculation:', { date, dayOfWeek, dayName });

    // Use AvailabilityService to get therapist availability (handles both new and old formats)
    const weeklyAvailability = await AvailabilityService.getTherapistAvailability(therapistId);
    console.log('📊 AvailabilityService Result:', weeklyAvailability);

    let availableSlots: any[] = [];

    if (weeklyAvailability && weeklyAvailability.standardHours && (weeklyAvailability.standardHours as any)[dayName]) {
      console.log(`✅ Using availability for ${dayName}:`, (weeklyAvailability.standardHours as any)[dayName]);
      availableSlots = generateSlotsFromWeeklyAvailability(
        weeklyAvailability,
        dayName,
        date
      );
    } else {
      console.log(`❌ No availability found for ${dayName}`);
      console.log('🔍 Full weekly availability structure:', JSON.stringify(weeklyAvailability, null, 2));
    }

    console.log('🎯 Generated Available Slots:', availableSlots);

    // Check for overrides (unavailable dates)
    const { data: overrides } = await supabase
      .from('availability_overrides')
      .select('*')
      .eq('therapist_id', therapistId)
      .eq('override_date', date)
      .eq('is_active', true);

    console.log('🚫 Availability Overrides:', overrides);

    // Filter out slots that are overridden
    if (overrides && overrides.length > 0) {
      const override = overrides[0];
      if (override.is_available === false) {
        availableSlots = []; // Completely unavailable
        console.log('🚫 Date is overridden as unavailable:', override.reason || 'No reason provided');
      } else if (override.is_available === true && override.start_time && override.end_time) {
        // Apply custom hours override - replace slots with custom hours
        console.log('🕐 Applying custom hours override:', { start: override.start_time, end: override.end_time });
        const customSlots = generateTimeSlots(
          override.start_time, 
          override.end_time, 
          override.session_duration || 60, 
          date
        );
        availableSlots = customSlots;
      }
    }

    // Check existing bookings for this date
    const { data: existingBookings } = await supabase
      .from('sessions')
      .select('session_date, session_time')
      .eq('therapist_id', therapistId)
      .eq('session_date', date)
      .in('status', ['scheduled', 'confirmed']);

    console.log('📅 Existing Bookings:', existingBookings);

    // Remove already booked slots
    if (existingBookings && existingBookings.length > 0) {
      availableSlots = availableSlots.filter(slot => {
        const isBooked = existingBookings.some(booking => 
          booking.session_time === slot.start_time
        );
        return !isBooked;
      });
    }

    console.log('✅ Final Available Slots:', availableSlots.length);

    return NextResponse.json({
      success: true,
      date,
      therapist_id: therapistId,
      slots: availableSlots,
      total_slots: availableSlots.length,
      source: 'availability_service',
      message: availableSlots.length > 0 ? 'Available slots found' : 'No available slots for this date'
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Availability slots error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to generate slots from new weekly availability format
function generateSlotsFromWeeklyAvailability(weeklyAvailability: any, dayName: string, date: string) {
  const slots = [];
  
  try {
    const dayAvailability = weeklyAvailability.standardHours[dayName];
    
    if (!dayAvailability || !dayAvailability.enabled) {
      console.log(`❌ Day ${dayName} not enabled in weekly availability`);
      return [];
    }

    console.log(`✅ Processing ${dayName} availability:`, dayAvailability);

    // Check if generalHours is available (new format) - use it first
    if (dayAvailability.generalHours && dayAvailability.generalHours.start && dayAvailability.generalHours.end) {
      console.log(`🕐 Using generalHours for ${dayName}:`, dayAvailability.generalHours);
      const startTime = dayAvailability.generalHours.start;
      const endTime = dayAvailability.generalHours.end;
      const sessionDuration = dayAvailability.generalHours.sessionDuration || weeklyAvailability.sessionSettings?.sessionDuration || 60;
      
      // Generate time slots from generalHours
      const generatedSlots = generateTimeSlots(startTime, endTime, sessionDuration, date);
      slots.push(...generatedSlots);
    } else {
      // Fallback to timeSlots (old format)
      console.log(`🕐 Using timeSlots for ${dayName} (fallback)`);
      for (const timeSlot of dayAvailability.timeSlots) {
        if (timeSlot.type !== 'available' && timeSlot.type !== 'individual') continue;

        const startTime = timeSlot.start;
        const endTime = timeSlot.end;
        
        // Get session duration from settings (default to 60 minutes)
        const sessionDuration = weeklyAvailability.sessionSettings?.sessionDuration || 60;
        
        // Generate time slots
        const generatedSlots = generateTimeSlots(startTime, endTime, sessionDuration, date);
        slots.push(...generatedSlots);
      }
    }
  } catch (error) {
    console.error('❌ Error generating slots from weekly availability:', error);
  }

  return slots;
}

// Helper function to generate slots from old template format
function generateSlotsFromTemplates(templateAvailability: any[], date: string) {
  const slots = [];
  
  for (const template of templateAvailability) {
    const startTime = template.start_time;
    const endTime = template.end_time;
    const sessionDuration = template.session_duration || 50;
    
    const generatedSlots = generateTimeSlots(startTime, endTime, sessionDuration, date);
    slots.push(...generatedSlots);
  }
  
  return slots;
}

// Helper function to generate time slots
function generateTimeSlots(startTime: string, endTime: string, duration: number, date: string) {
  const slots = [];
  const start = new Date(`${date}T${startTime}`);
  const end = new Date(`${date}T${endTime}`);
  
  let current = new Date(start);
  
  while (current < end) {
    const slotEnd = new Date(current.getTime() + duration * 60000);
    
    if (slotEnd <= end) {
      const timeString = current.toTimeString().slice(0, 5); // "HH:MM" format
      const endTimeString = slotEnd.toTimeString().slice(0, 5);
      
      slots.push({
        date: date,
        day_of_week: new Date(date).getDay(),
        start_time: timeString,
        end_time: endTimeString,
        session_duration: duration,
        session_type: 'individual',
        max_sessions: 1,
        is_available: true,
        is_override: false
      });
    }
    
    // Move to next slot
    current = new Date(slotEnd.getTime());
  }
  
  return slots;
}

// Helper function to filter slots by custom hours
function filterSlotsByCustomHours(slots: any[], customHours: any) {
  return slots.filter(slot => {
    // Implement custom hours filtering logic
    // This would depend on your custom_hours JSON structure
    return true; // Placeholder - implement based on your override structure
  });
}
