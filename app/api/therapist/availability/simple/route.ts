import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ServerSessionManager } from '@/lib/server-session-manager';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Simple availability API that doesn't rely on complex database functions
 * This is a fallback for when the generate_availability_slots function has issues
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

    console.log('🔍 Simple availability API: Generating slots for therapist:', therapistId);

    // Get therapist's availability templates
    const { data: templates, error: templateError } = await supabase
      .from('availability_templates')
      .select('*')
      .eq('therapist_id', therapistId)
      .eq('is_active', true);

    if (templateError) {
      console.error('Error fetching templates:', templateError);
      return NextResponse.json({ 
        error: 'Failed to fetch availability templates' 
      }, { status: 500 });
    }

    // Get therapist's availability overrides for the date range
    const { data: overrides, error: overrideError } = await supabase
      .from('availability_overrides')
      .select('*')
      .eq('therapist_id', therapistId)
      .gte('override_date', startDate)
      .lte('override_date', endDate);

    if (overrideError) {
      console.error('Error fetching overrides:', overrideError);
      return NextResponse.json({ 
        error: 'Failed to fetch availability overrides' 
      }, { status: 500 });
    }

    // Generate availability slots for each date in the range
    const availabilitySlots = [];
    const currentDate = new Date(startDateObj);
    
    while (currentDate <= endDateObj) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Check if there's an override for this date
      const override = overrides?.find(o => o.override_date === dateStr);
      
      if (override) {
        // Use override data
        if (override.is_available && override.start_time && override.end_time) {
          availabilitySlots.push({
            date: dateStr,
            day_of_week: dayOfWeek,
            start_time: override.start_time,
            end_time: override.end_time,
            session_duration: override.session_duration || 45,
            session_type: override.session_type || 'individual',
            max_sessions: override.max_sessions || 1,
            is_override: true,
            reason: override.reason
          });
        }
        // If override.is_available is false, skip this date (therapist is unavailable)
      } else {
        // Use template data for this day of week
        const template = templates?.find(t => t.day_of_week === dayOfWeek);
        if (template) {
          availabilitySlots.push({
            date: dateStr,
            day_of_week: dayOfWeek,
            start_time: template.start_time,
            end_time: template.end_time,
            session_duration: template.session_duration || 45,
            session_type: template.session_type || 'individual',
            max_sessions: template.max_sessions || 1,
            is_override: false,
            reason: null
          });
        }
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log('✅ Generated', availabilitySlots.length, 'availability slots');

    return NextResponse.json({ 
      success: true,
      availability: availabilitySlots,
      meta: {
        therapist_id: therapistId,
        start_date: startDate,
        end_date: endDate,
        total_slots: availabilitySlots.length,
        generated_at: new Date().toISOString()
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error in simple availability API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
