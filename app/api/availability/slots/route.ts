import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
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
      const dayAvailability = (weeklyAvailability.standardHours as any)[dayName];
      console.log(`✅ Using availability for ${dayName}:`, dayAvailability);
      
      // 🎯 PRIORITY: Check for custom slots first
      if (dayAvailability.customSlots && dayAvailability.customSlots.length > 0) {
        console.log('🎯 Found custom slots, using them instead of general hours:', dayAvailability.customSlots);
        availableSlots = generateSlotsFromCustomSlots(dayAvailability.customSlots, date);
      } else {
        console.log('⚙️ No custom slots, using general hours');
        availableSlots = generateSlotsFromWeeklyAvailability(weeklyAvailability, dayName, date);
      }
    } else {
      console.log(`❌ No availability found for ${dayName}`);
      console.log('🔍 Full weekly availability structure:', JSON.stringify(weeklyAvailability, null, 2));
    }

    console.log('🎯 Generated Available Slots:', availableSlots);

    // No database override system - we only use weekly availability custom slots
    console.log('🎯 Using weekly availability system only - no database overrides');

    // Check existing bookings for this date
    const supabase = createServerClient();
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

    // CRITICAL: Set cache headers to prevent browser/client caching
    // This ensures real-time availability updates are always fetched fresh
    return NextResponse.json({
      success: true,
      date,
      therapist_id: therapistId,
      slots: availableSlots,
      total_slots: availableSlots.length,
      source: 'availability_service',
      message: availableSlots.length > 0 ? 'Available slots found' : 'No available slots for this date',
      debug: {
        total_slots: availableSlots.length,
        custom_slots: availableSlots.filter(s => s.is_override).length,
        general_slots: availableSlots.filter(s => !s.is_override).length,
        source: 'weekly_availability'
      }
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('❌ Availability slots error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to generate slots from custom slots (override slots)
function generateSlotsFromCustomSlots(customSlots: any[], date: string) {
  const slots = [];
  
  console.log('🎯 Processing custom slots:', customSlots);
  
  for (const customSlot of customSlots) {
    if (customSlot.isAvailable !== false) { // Only process available slots
      const startTime = customSlot.start;
      const endTime = customSlot.end;
      const duration = customSlot.duration || 60;
      
      console.log(`🕐 Processing custom slot: ${startTime} - ${endTime} (${duration} mins)`);
      
      // Generate time slots from custom slot
      const generatedSlots = generateTimeSlots(startTime, endTime, duration, date, true); // Mark as override
      slots.push(...generatedSlots);
    }
  }
  
  console.log(`✅ Generated ${slots.length} custom override slots`);
  return slots;
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
      const generatedSlots = generateTimeSlots(startTime, endTime, sessionDuration, date, false);
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
        const generatedSlots = generateTimeSlots(startTime, endTime, sessionDuration, date, false);
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
    
    const generatedSlots = generateTimeSlots(startTime, endTime, sessionDuration, date, false);
    slots.push(...generatedSlots);
  }
  
  return slots;
}

// Helper function to generate time slots
function generateTimeSlots(startTime: string, endTime: string, duration: number, date: string, isOverride: boolean = false) {
  const slots = [];
  
  // Parse time strings directly to avoid timezone issues
  const parseTime = (timeStr: string): { hours: number, minutes: number } => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  };
  
  const formatTime = (hours: number, minutes: number): string => {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };
  
  const addMinutes = (hours: number, minutes: number, minutesToAdd: number): { hours: number, minutes: number } => {
    const totalMinutes = hours * 60 + minutes + minutesToAdd;
    return {
      hours: Math.floor(totalMinutes / 60) % 24,
      minutes: totalMinutes % 60
    };
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
        is_available: true,
        is_override: isOverride
      });
    }
    
    // Move to next slot
    currentMinutes += duration;
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
