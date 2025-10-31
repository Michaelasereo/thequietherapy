import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Get available dates for a therapist within a date range
 * Returns dates that have at least one available time slot
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const therapistId = searchParams.get('therapist_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!therapistId || !startDate || !endDate) {
      return NextResponse.json({ 
        error: 'Missing required parameters: therapist_id, start_date, end_date' 
      }, { status: 400 });
    }

    // Validate date format
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return NextResponse.json({ 
        error: 'Invalid date format. Use YYYY-MM-DD format.' 
      }, { status: 400 });
    }

    // Use the new availability system instead of database function
    const { AvailabilityService } = await import('@/lib/availability-service');
    
    // Get therapist availability
    const weeklyAvailability = await AvailabilityService.getTherapistAvailability(therapistId);
    
    if (!weeklyAvailability || !weeklyAvailability.standardHours) {
      console.log('❌ No availability configuration found');
      return NextResponse.json({ 
        success: true,
        availableDays: [],
        totalDays: 0,
        therapist_id: therapistId,
        date_range: { start_date: startDate, end_date: endDate },
        note: 'No availability configuration found - therapist may need to set up availability'
      }, { status: 200 });
    }
    
    // Generate available dates by checking each date in the range
    const availableDates = [];
    
    for (let date = new Date(startDateObj); date <= endDateObj; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      
      // Check if this day is enabled in availability
      const dayAvailability = weeklyAvailability.standardHours[dayName as keyof typeof weeklyAvailability.standardHours];
      if (dayAvailability && dayAvailability.enabled) {
        // Check if there are time slots or general hours
        const hasTimeSlots = dayAvailability.timeSlots && dayAvailability.timeSlots.length > 0;
        const hasGeneralHours = dayAvailability.generalHours && 
          dayAvailability.generalHours.start && 
          dayAvailability.generalHours.end;
        
        if (hasTimeSlots || hasGeneralHours) {
          availableDates.push(dateStr);
        }
      }
    }
    
    console.log('✅ Generated available dates using new system:', availableDates.length, 'days');

    return NextResponse.json({ 
      success: true,
      availableDays: availableDates,
      totalDays: availableDates.length,
      therapist_id: therapistId,
      date_range: { start_date: startDate, end_date: endDate }
    }, { status: 200 });

  } catch (error) {
    console.error('Error in availability days API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
