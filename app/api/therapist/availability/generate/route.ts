import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireApiAuth } from '@/lib/server-auth';
import { handleApiError, ValidationError, successResponse } from '@/lib/api-response';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Generate availability slots for a therapist within a date range
 * This is the core "brain" of the new availability system
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const therapistId = searchParams.get('therapist_id');
    const startDate = searchParams.get('start_date'); // ISO string: 2024-01-15
    const endDate = searchParams.get('end_date');     // ISO string: 2024-01-21
    const timezone = searchParams.get('timezone') || 'UTC';

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

    if (startDateObj > endDateObj) {
      return NextResponse.json({ 
        error: 'Start date must be before or equal to end date' 
      }, { status: 400 });
    }

    // Use the database function to generate availability slots
    const { data: generatedSlots, error } = await supabase
      .rpc('generate_availability_slots', {
        p_therapist_id: therapistId,
        p_start_date: startDate,
        p_end_date: endDate
      });

    if (error) {
      console.error('Error generating availability slots:', error);
      return NextResponse.json({ 
        error: 'Failed to generate availability slots' 
      }, { status: 500 });
    }

    // Filter out existing bookings
    const filteredSlots = await filterBookedSlots(generatedSlots, therapistId, startDate, endDate);

    return NextResponse.json({ 
      success: true,
      availability: filteredSlots,
      meta: {
        therapist_id: therapistId,
        start_date: startDate,
        end_date: endDate,
        timezone,
        total_slots: filteredSlots.length,
        generated_at: new Date().toISOString()
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error in availability generation API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

/**
 * Filter out slots that are already booked
 */
async function filterBookedSlots(slots: any[], therapistId: string, startDate: string, endDate: string) {
  try {
    // Get existing sessions for this therapist in the date range
    const { data: existingSessions, error } = await supabase
      .from('sessions')
      .select('start_time, end_time, status')
      .eq('therapist_id', therapistId)
      .gte('start_time', `${startDate}T00:00:00`)
      .lte('start_time', `${endDate}T23:59:59`)
      .in('status', ['scheduled', 'confirmed', 'in_progress']);

    if (error) {
      console.warn('Error fetching existing sessions:', error);
      return slots; // Return all slots if we can't check bookings
    }

    // Filter out slots that conflict with existing sessions
    return slots.filter(slot => {
      const slotStart = new Date(`${slot.date}T${slot.start_time}`);
      const slotEnd = new Date(`${slot.date}T${slot.end_time}`);

      return !existingSessions?.some(session => {
        const sessionStart = new Date(session.start_time);
        const sessionEnd = new Date(session.end_time);

        // Check for time overlap
        return (slotStart < sessionEnd && slotEnd > sessionStart);
      });
    });

  } catch (error) {
    console.warn('Error filtering booked slots:', error);
    return slots; // Return all slots if filtering fails
  }
}

/**
 * Get availability for a specific date (convenience endpoint)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { therapist_id, date, timezone = 'UTC' } = body;

    if (!therapist_id || !date) {
      return NextResponse.json({ 
        error: 'Missing required parameters: therapist_id, date' 
      }, { status: 400 });
    }

    // Generate availability for just that date
    const { data: generatedSlots, error } = await supabase
      .rpc('generate_availability_slots', {
        p_therapist_id: therapist_id,
        p_start_date: date,
        p_end_date: date
      });

    if (error) {
      console.error('Error generating availability for date:', error);
      return NextResponse.json({ 
        error: 'Failed to generate availability' 
      }, { status: 500 });
    }

    // Filter out existing bookings
    const filteredSlots = await filterBookedSlots(generatedSlots, therapist_id, date, date);

    return NextResponse.json({ 
      success: true,
      availability: filteredSlots,
      date,
      timezone
    }, { status: 200 });

  } catch (error) {
    console.error('Error in availability generation POST:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
