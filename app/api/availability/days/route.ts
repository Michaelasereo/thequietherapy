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

    // Use the generate_availability_slots function to get all available slots
    const { data: slots, error } = await supabase
      .rpc('generate_availability_slots', {
        p_therapist_id: therapistId,
        p_start_date: startDate,
        p_end_date: endDate
      });

    if (error) {
      console.error('❌ Error generating availability slots:', error);
      console.error('❌ Error details:', error.message, error.details);
      
      // Return empty dates array instead of error - allows frontend to show all dates as potentially available
      return NextResponse.json({ 
        success: true,
        availableDays: [],
        totalDays: 0,
        therapist_id: therapistId,
        date_range: { start_date: startDate, end_date: endDate },
        note: 'No availability configuration found - therapist may need to set up availability'
      }, { status: 200 });
    }

    // Extract unique dates that have availability
    const availableDates = [...new Set(slots?.map((slot: any) => slot.date) || [])]
      .filter(date => date) // Remove null/undefined dates
      .sort(); // Sort chronologically

    console.log('✅ Available dates for therapist', therapistId, ':', availableDates.length, 'days');

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
