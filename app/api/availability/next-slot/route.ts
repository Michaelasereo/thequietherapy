import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Get the next available slot for a therapist
 * Useful for "Quick Book" functionality
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

    console.log('🔍 Finding next available slot for therapist:', therapistId);

    // Use the generate_availability_slots function to get all available slots
    const { data: slots, error } = await supabase
      .rpc('generate_availability_slots', {
        p_therapist_id: therapistId,
        p_start_date: startDate,
        p_end_date: endDate
      });

    if (error) {
      console.error('Error generating availability slots:', error);
      return NextResponse.json({ 
        error: 'Failed to generate availability slots',
        details: error.message 
      }, { status: 500 });
    }

    // Find the earliest available slot
    const availableSlots = (slots || [])
      .filter((slot: any) => slot.is_available === true)
      .sort((a: any, b: any) => {
        // Sort by date first, then by time
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.start_time.localeCompare(b.start_time);
      });

    const nextSlot = availableSlots[0] || null;

    console.log('✅ Next available slot:', nextSlot ? `${nextSlot.date} ${nextSlot.start_time}` : 'None found');

    return NextResponse.json({ 
      success: true,
      slot: nextSlot,
      has_availability: availableSlots.length > 0,
      total_available_slots: availableSlots.length
    }, { status: 200 });

  } catch (error) {
    console.error('Error in next slot API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
