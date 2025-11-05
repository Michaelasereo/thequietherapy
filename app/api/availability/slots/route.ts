import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { AvailabilityService } from '@/lib/availability-service';

/**
 * Helper function to convert date to GMT+1 timezone string
 */
function toGMT1(date: Date): string {
  return date.toLocaleString('en-US', { 
    timeZone: 'Africa/Lagos', // GMT+1 timezone
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

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

    // Use AvailabilityManager to get therapist availability (handles both new and old formats)
    // Create server client for AvailabilityManager
    const supabase = createServerClient();
    let weeklyAvailability: any = null;
    try {
      const { AvailabilityManager } = await import('@/lib/availability-manager');
      const availabilityManager = new AvailabilityManager();
      // Inject server supabase client into AvailabilityManager
      (availabilityManager as any).supabase = supabase;
      weeklyAvailability = await availabilityManager.getTherapistAvailability(therapistId);
      console.log('📊 AvailabilityManager Result:', weeklyAvailability);
    } catch (availabilityError) {
      console.error('❌ Error fetching therapist availability:', availabilityError);
      // Try direct query as fallback
      try {
        const { data, error } = await supabase
          .from('availability_weekly_schedules')
          .select('weekly_availability')
          .eq('therapist_id', therapistId)
          .eq('is_active', true)
          .single();
        
        if (!error && data) {
          weeklyAvailability = data.weekly_availability;
          console.log('✅ Fallback: Direct query succeeded');
        } else {
          console.log('⚠️ No availability found, returning empty slots');
          return NextResponse.json({
            success: true,
            date,
            therapist_id: therapistId,
            slots: [],
            total_slots: 0,
            source: 'availability_service',
            message: 'No availability configured for this therapist'
          }, { 
            status: 200,
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
        }
      } catch (fallbackError) {
        console.error('❌ Fallback query also failed:', fallbackError);
        return NextResponse.json({
          success: true,
          date,
          therapist_id: therapistId,
          slots: [],
          total_slots: 0,
          source: 'availability_service',
          message: 'No availability configured for this therapist',
          error: availabilityError instanceof Error ? availabilityError.message : 'Unknown error'
        }, { 
          status: 200,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      }
    }

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
    // Include all statuses that indicate a slot is taken
    // Reuse the supabase client created earlier
    // IMPORTANT: Get ALL sessions for this therapist, then filter by date/time
    // This ensures we catch all bookings regardless of status
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('sessions')
      .select('id, start_time, end_time, scheduled_date, scheduled_time, session_date, session_time, status, duration_minutes')
      .eq('therapist_id', therapistId)
      .not('status', 'eq', 'cancelled') // Exclude cancelled sessions
      .not('status', 'eq', 'rejected'); // Exclude rejected sessions
    
    if (bookingsError) {
      console.error('❌ Error fetching existing bookings:', bookingsError);
    }

    console.log('📅 Existing Bookings (all):', existingBookings?.length || 0);

    // Remove already booked slots
    if (existingBookings && existingBookings.length > 0) {
      // Filter bookings to only those on the selected date
      // IMPORTANT: Check multiple date fields and timezone conversions to catch ALL bookings
      const bookingsOnThisDate = existingBookings.filter(booking => {
        // Skip cancelled/rejected sessions - they don't block slots
        if (booking.status === 'cancelled' || booking.status === 'rejected') {
          return false;
        }
        
        // Check multiple possible date fields to catch all bookings
        const bookingDate = booking.scheduled_date || booking.session_date;
        
        // If we have explicit date field, use it directly
        if (bookingDate) {
          // Normalize date format (handle both YYYY-MM-DD and other formats)
          const normalizedBookingDate = bookingDate.split('T')[0]; // Remove time if present
          const normalizedTargetDate = date.split('T')[0];
          if (normalizedBookingDate === normalizedTargetDate) {
            return true;
          }
        }
        
        // Also check start_time for date matching (convert to GMT+1)
        if (booking.start_time) {
          try {
            const bookingStartTime = new Date(booking.start_time);
            if (!isNaN(bookingStartTime.getTime())) {
              const gmt1String = toGMT1(bookingStartTime);
              const bookingDateStr = gmt1String.split(', ')[0]; // Extract date part (MM/DD/YYYY)
              // Convert MM/DD/YYYY to YYYY-MM-DD for comparison
              const [month, day, year] = bookingDateStr.split('/');
              const bookingDateFormatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              if (bookingDateFormatted === date) {
                return true;
              }
            }
          } catch (dateError) {
            console.warn('⚠️ Error parsing booking date:', booking.start_time, dateError);
          }
        }
        
        return false;
      });
      
      console.log('📅 Bookings on selected date:', bookingsOnThisDate.length, 'bookings');
      console.log('📅 Booking details:', bookingsOnThisDate.map(b => ({
        id: b.id,
        status: b.status,
        scheduled_date: b.scheduled_date,
        scheduled_time: b.scheduled_time,
        session_date: b.session_date,
        session_time: b.session_time,
        start_time: b.start_time
      })));
      
      availableSlots = availableSlots.filter(slot => {
        const isBooked = bookingsOnThisDate.some(booking => {
          // Skip cancelled/rejected sessions (they don't block slots)
          if (booking.status === 'cancelled' || booking.status === 'rejected') {
            return false;
          }
          
          // Skip completed sessions for future dates (they don't block future slots)
          // Only block completed sessions if they're on the same day and time hasn't passed yet
          if (booking.status === 'completed') {
            const now = new Date();
            const bookingEnd = booking.end_time ? new Date(booking.end_time) : 
                              (booking.start_time ? new Date(new Date(booking.start_time).getTime() + (booking.duration_minutes || 60) * 60000) : null);
            // Only block if the session ended very recently (within last 15 minutes)
            if (bookingEnd && (now.getTime() - bookingEnd.getTime()) > 15 * 60 * 1000) {
              return false;
            }
          }
          
          // Calculate slot time range
          const slotStartTime = slot.start_time; // e.g., "14:00"
          const [slotStartHour, slotStartMin] = slotStartTime.split(':').map(Number);
          const slotEndMin = slotStartMin + (slot.session_duration || 30);
          const slotEndHour = slotStartHour + Math.floor(slotEndMin / 60);
          const slotEndMinAdjusted = slotEndMin % 60;
          const slotEndTime = `${String(slotEndHour).padStart(2, '0')}:${String(slotEndMinAdjusted).padStart(2, '0')}`;
          
          // Try to match against explicit time fields first (most reliable)
          const bookingTime = booking.scheduled_time || booking.session_time;
          if (bookingTime) {
            // Normalize time format (remove seconds if present)
            const normalizedBookingTime = bookingTime.substring(0, 5); // HH:MM
            const normalizedSlotTime = slot.start_time.substring(0, 5); // HH:MM
            const matches = normalizedBookingTime === normalizedSlotTime;
            if (matches) {
              console.log(`🚫 Slot ${slot.start_time} is booked by session ${booking.id} (status: ${booking.status})`);
            }
            return matches;
          }
          
          // Otherwise, extract time from start_time ISO string
          // start_time is in UTC but we need to convert it back to local time
          if (booking.start_time) {
            const bookingStartTime = new Date(booking.start_time);
            // Use toLocaleTimeString to get local time in GMT+1
            const bookingTimeStr = bookingStartTime.toLocaleTimeString('en-US', { 
              timeZone: 'Africa/Lagos', // GMT+1 timezone
              hour12: false,
              hour: '2-digit',
              minute: '2-digit'
            });
            
            // Check for exact time match
            const exactMatch = bookingTimeStr === slot.start_time;
            if (exactMatch) {
              console.log(`🚫 Slot ${slot.start_time} (GMT+1) is booked by session (status: ${booking.status}) - exact match`);
              return true;
            }
            
            // Also check if there's any time overlap
            const [bookingHour, bookingMin] = bookingTimeStr.split(':').map(Number);
            const bookingStartMinutes = bookingHour * 60 + bookingMin;
            // Use actual duration from booking, or calculate from end_time if available
            let bookingDuration = booking.duration_minutes || 30; // Default to 30 if not specified
            
            // If we have end_time, calculate actual duration
            if (booking.end_time && booking.start_time) {
              const startTime = new Date(booking.start_time);
              const endTime = new Date(booking.end_time);
              const actualDuration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
              if (actualDuration > 0) {
                bookingDuration = actualDuration;
              }
            }
            
            const bookingEndMinutes = bookingStartMinutes + bookingDuration;
            
            const slotStartMinutes = slotStartHour * 60 + slotStartMin;
            const slotEndMinutes = slotEndHour * 60 + slotEndMinAdjusted;
            
            // Check for overlap: booking starts before slot ends and ends after slot starts
            const hasOverlap = bookingStartMinutes < slotEndMinutes && bookingEndMinutes > slotStartMinutes;
            
            if (hasOverlap) {
              console.log(`🚫 Slot ${slot.start_time}-${slotEndTime} overlaps with booking ${bookingTimeStr} (status: ${booking.status})`);
            }
            
            return hasOverlap;
          }
          
          return false;
        });
        
        if (isBooked) {
          console.log(`🚫 Filtering out booked slot: ${slot.date} ${slot.start_time}`);
        }
        
        return !isBooked;
      });
    }

    // Remove past slots (slots that have already passed)
    // All comparisons done in GMT+1 timezone for consistency
    const now = new Date();
    const nowGMT1 = toGMT1(now);
    const nowDateGMT1 = nowGMT1.split(', ')[0]; // Extract date (MM/DD/YYYY)
    const nowTimeGMT1 = nowGMT1.split(', ')[1]; // Extract time
    
    // Convert nowDateGMT1 from MM/DD/YYYY to YYYY-MM-DD for comparison with slot.date
    const [month, day, year] = nowDateGMT1.split('/');
    const nowDateFormatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    availableSlots = availableSlots.filter(slot => {
      // Check if slot is on the same date as now
      if (slot.date !== nowDateFormatted) {
        // If it's a future date, it's definitely future
        return true;
      }
      
      // Same date, check time in GMT+1
      const [slotHour, slotMin] = slot.start_time.split(':').map(Number);
      const [nowHour, nowMin] = nowTimeGMT1.split(':').map(Number);
      
      // Add a buffer (15 minutes) to avoid edge cases
      const bufferMinutes = 15;
      const nowMinWithBuffer = nowMin + bufferMinutes;
      const adjustedNowHour = nowMinWithBuffer >= 60 ? nowHour + 1 : nowHour;
      const adjustedNowMin = nowMinWithBuffer % 60;
      
      const isFuture = (slotHour > adjustedNowHour) || 
                       (slotHour === adjustedNowHour && slotMin > adjustedNowMin);
      
      if (!isFuture) {
        console.log(`⏰ Filtered past slot: ${slot.date} ${slot.start_time} (now: ${nowTimeGMT1} GMT+1)`);
      }
      
      return isFuture;
    });
    
    console.log('📅 Filtered past slots');

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
