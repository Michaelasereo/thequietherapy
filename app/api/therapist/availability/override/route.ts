import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireApiAuth } from '@/lib/server-auth';
import { handleApiError, ValidationError, successResponse } from '@/lib/api-response';
import { invalidateTherapistAvailability } from '@/lib/availability-cache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Get availability overrides for a therapist within a date range
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const therapistId = searchParams.get('therapist_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!therapistId) {
      return NextResponse.json({ 
        error: 'Therapist ID is required' 
      }, { status: 400 });
    }

    let query = supabase
      .from('availability_overrides')
      .select('*')
      .eq('therapist_id', therapistId)
      .order('override_date', { ascending: true });

    // Add date range filter if provided
    if (startDate) {
      query = query.gte('override_date', startDate);
    }
    if (endDate) {
      query = query.lte('override_date', endDate);
    }

    const { data: overrides, error } = await query;

    if (error) {
      console.error('Error fetching availability overrides:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch availability overrides' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      overrides: overrides || []
    }, { status: 200 });

  } catch (error) {
    console.error('Error in override GET API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

/**
 * Create or update an availability override
 */
export async function POST(request: NextRequest) {
  try {
    // SECURE Authentication Check - only therapists can modify overrides
    const authResult = await requireApiAuth(['therapist']);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { session } = authResult;
    const body = await request.json();
    const { 
      therapist_id, 
      override_date, 
      is_available, 
      start_time, 
      end_time, 
      session_duration, 
      session_type, 
      max_sessions, 
      reason 
    } = body;

    if (!therapist_id || !override_date) {
      return NextResponse.json({ 
        error: 'therapist_id and override_date are required' 
      }, { status: 400 });
    }

    // Verify the therapist is updating their own overrides
    if (session.user.id !== therapist_id) {
      return NextResponse.json({ 
        error: 'Unauthorized: You can only update your own overrides' 
      }, { status: 403 });
    }

    // Validate date format
    const dateObj = new Date(override_date);
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ 
        error: 'Invalid date format. Use YYYY-MM-DD format.' 
      }, { status: 400 });
    }

    // Validate time fields if is_available is true
    if (is_available === true) {
      if (!start_time || !end_time) {
        return NextResponse.json({ 
          error: 'start_time and end_time are required when is_available is true' 
        }, { status: 400 });
      }

      // Validate time format and logic
      const startTime = new Date(`2000-01-01T${start_time}`);
      const endTime = new Date(`2000-01-01T${end_time}`);
      
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return NextResponse.json({ 
          error: 'Invalid time format. Use HH:MM format.' 
        }, { status: 400 });
      }

      if (startTime >= endTime) {
        return NextResponse.json({ 
          error: 'Start time must be before end time.' 
        }, { status: 400 });
      }
    }

    // Check if override already exists for this date
    const { data: existingOverride, error: fetchError } = await supabase
      .from('availability_overrides')
      .select('id')
      .eq('therapist_id', therapist_id)
      .eq('override_date', override_date)
      .single();

    let result;
    if (existingOverride) {
      // Update existing override
      const updateData: any = {
        is_available,
        reason
      };

      if (is_available === true) {
        updateData.start_time = start_time;
        updateData.end_time = end_time;
        updateData.session_duration = session_duration || 45;
        updateData.session_type = session_type || 'individual';
        updateData.max_sessions = max_sessions || 1;
      } else {
        // Clear time fields for unavailable days
        updateData.start_time = null;
        updateData.end_time = null;
        updateData.session_duration = 45;
        updateData.session_type = 'individual';
        updateData.max_sessions = 1;
      }

      const { data: updatedOverride, error: updateError } = await supabase
        .from('availability_overrides')
        .update(updateData)
        .eq('id', existingOverride.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating override:', updateError);
        return NextResponse.json({ 
          error: 'Failed to update override' 
        }, { status: 500 });
      }

      result = updatedOverride;
    } else {
      // Create new override
      const overrideData: any = {
        therapist_id,
        override_date,
        is_available,
        reason
      };

      if (is_available === true) {
        overrideData.start_time = start_time;
        overrideData.end_time = end_time;
        overrideData.session_duration = session_duration || 45;
        overrideData.session_type = session_type || 'individual';
        overrideData.max_sessions = max_sessions || 1;
      }

      const { data: newOverride, error: insertError } = await supabase
        .from('availability_overrides')
        .insert(overrideData)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating override:', insertError);
        return NextResponse.json({ 
          error: 'Failed to create override' 
        }, { status: 500 });
      }

      result = newOverride;
    }

    // CRITICAL: Invalidate cache to ensure booking system gets fresh data
    invalidateTherapistAvailability(therapist_id);
    console.log('🔄 Cache invalidated for therapist:', therapist_id);

    return NextResponse.json({ 
      success: true,
      message: existingOverride ? 'Override updated successfully' : 'Override created successfully',
      override: result
    }, { status: 200 });

  } catch (error) {
    console.error('Error in override POST API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

/**
 * Delete an availability override
 */
export async function DELETE(request: NextRequest) {
  try {
    // SECURE Authentication Check
    const authResult = await requireApiAuth(['therapist']);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { session } = authResult;
    const { searchParams } = new URL(request.url);
    const overrideId = searchParams.get('override_id');

    if (!overrideId) {
      return NextResponse.json({ 
        error: 'override_id is required' 
      }, { status: 400 });
    }

    // Verify the therapist owns this override
    const { data: existingOverride, error: fetchError } = await supabase
      .from('availability_overrides')
      .select('therapist_id')
      .eq('id', overrideId)
      .single();

    if (fetchError || !existingOverride) {
      return NextResponse.json({ 
        error: 'Override not found' 
      }, { status: 404 });
    }

    if (existingOverride.therapist_id !== session.user.id) {
      return NextResponse.json({ 
        error: 'Unauthorized: You can only delete your own overrides' 
      }, { status: 403 });
    }

    // Delete the override
    const { error: deleteError } = await supabase
      .from('availability_overrides')
      .delete()
      .eq('id', overrideId);

    if (deleteError) {
      console.error('Error deleting override:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete override' 
      }, { status: 500 });
    }

    // CRITICAL: Invalidate cache to ensure booking system gets fresh data
    invalidateTherapistAvailability(existingOverride.therapist_id);
    console.log('🔄 Cache invalidated for therapist:', existingOverride.therapist_id);

    return NextResponse.json({ 
      success: true,
      message: 'Override deleted successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error in override DELETE API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

/**
 * Bulk create overrides (useful for vacation periods)
 */
export async function PUT(request: NextRequest) {
  try {
    // SECURE Authentication Check
    const authResult = await requireApiAuth(['therapist']);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { session } = authResult;
    const body = await request.json();
    const { therapist_id, overrides } = body;

    if (!therapist_id || !overrides || !Array.isArray(overrides)) {
      return NextResponse.json({ 
        error: 'therapist_id and overrides array are required' 
      }, { status: 400 });
    }

    // Verify the therapist is updating their own overrides
    if (session.user.id !== therapist_id) {
      return NextResponse.json({ 
        error: 'Unauthorized: You can only update your own overrides' 
      }, { status: 403 });
    }

    // Validate each override
    for (const override of overrides) {
      if (!override.override_date) {
        return NextResponse.json({ 
          error: 'override_date is required for each override' 
        }, { status: 400 });
      }

      const dateObj = new Date(override.override_date);
      if (isNaN(dateObj.getTime())) {
        return NextResponse.json({ 
          error: 'Invalid date format. Use YYYY-MM-DD format.' 
        }, { status: 400 });
      }
    }

    // Delete existing overrides for the same dates
    const dates = overrides.map(o => o.override_date);
    const { error: deleteError } = await supabase
      .from('availability_overrides')
      .delete()
      .eq('therapist_id', therapist_id)
      .in('override_date', dates);

    if (deleteError) {
      console.error('Error deleting existing overrides:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to update overrides' 
      }, { status: 500 });
    }

    // Prepare new overrides data
    const overridesData = overrides.map(override => ({
      therapist_id,
      override_date: override.override_date,
      is_available: override.is_available || false,
      start_time: override.is_available ? override.start_time : null,
      end_time: override.is_available ? override.end_time : null,
      session_duration: override.session_duration || 45,
      session_type: override.session_type || 'individual',
      max_sessions: override.max_sessions || 1,
      reason: override.reason
    }));

    // Insert new overrides
    const { data: insertedOverrides, error: insertError } = await supabase
      .from('availability_overrides')
      .insert(overridesData)
      .select();

    if (insertError) {
      console.error('Error inserting overrides:', insertError);
      return NextResponse.json({ 
        error: 'Failed to save overrides' 
      }, { status: 500 });
    }

    // CRITICAL: Invalidate cache to ensure booking system gets fresh data
    invalidateTherapistAvailability(therapist_id);
    console.log('🔄 Cache invalidated for therapist:', therapist_id);

    return NextResponse.json({ 
      success: true,
      message: 'Availability overrides updated successfully',
      overrides: insertedOverrides,
      count: insertedOverrides.length
    }, { status: 200 });

  } catch (error) {
    console.error('Error in override PUT API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
