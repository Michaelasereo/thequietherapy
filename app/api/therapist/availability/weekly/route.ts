import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { requireApiAuth } from '@/lib/server-auth';
import { invalidateTherapistAvailability } from '@/lib/availability-cache';

/**
 * Save therapist weekly availability to the new availability_weekly_schedules table
 */
export async function POST(request: NextRequest) {
  try {
    // SECURE Authentication Check - only therapists can modify availability
    const authResult = await requireApiAuth(['therapist']);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { session } = authResult;
    const therapistId = session.user.id;
    const { availability } = await request.json();

    console.log('🔍 Saving weekly availability for therapist:', therapistId);
    console.log('🔍 Availability data received:', JSON.stringify(availability, null, 2));

    if (!availability) {
      console.log('❌ No availability data provided');
      return NextResponse.json({ error: 'Availability data is required' }, { status: 400 });
    }

    // Save to weekly availability table
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('availability_weekly_schedules')
      .upsert({
        therapist_id: therapistId,
        template_name: 'primary',
        weekly_availability: availability,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'therapist_id,template_name'
      });

    if (error) {
      console.error('❌ Weekly availability save error:', error);
      return NextResponse.json({ error: 'Failed to save availability' }, { status: 500 });
    }

    console.log('✅ Weekly availability saved successfully for therapist:', therapistId);

    // CRITICAL: Invalidate cache to ensure booking system gets fresh data
    invalidateTherapistAvailability(therapistId);
    console.log('🔄 Cache invalidated for therapist:', therapistId);

    return NextResponse.json({ 
      success: true,
      message: 'Weekly availability saved successfully',
      data: data
    });

  } catch (error) {
    console.error('❌ Weekly availability API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Get therapist weekly availability
 */
export async function GET(request: NextRequest) {
  try {
    // SECURE Authentication Check - only therapists can view availability
    const authResult = await requireApiAuth(['therapist']);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { session } = authResult;
    const therapistId = session.user.id;

    console.log('🔍 Fetching weekly availability for therapist:', therapistId);

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('availability_weekly_schedules')
      .select('*')
      .eq('therapist_id', therapistId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('❌ Weekly availability fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
    }

    console.log('✅ Weekly availability fetched successfully');

    return NextResponse.json({ 
      success: true,
      availability: data?.weekly_availability || null,
      data: data
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

  } catch (error) {
    console.error('❌ Weekly availability GET API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
