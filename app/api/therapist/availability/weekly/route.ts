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
      return NextResponse.json({ 
        error: 'Availability data is required',
        message: 'Please provide your weekly availability schedule. If you need help, contact support.',
        code: 'MISSING_AVAILABILITY_DATA'
      }, { status: 400 });
    }

    // Verify therapist is approved before allowing availability setup
    const supabase = createServerClient();
    const { data: therapist, error: therapistCheckError } = await supabase
      .from('users')
      .select('id, email, is_verified, is_active, user_type')
      .eq('id', therapistId)
      .eq('user_type', 'therapist')
      .single();

    if (therapistCheckError || !therapist) {
      console.error('❌ Therapist not found or invalid:', therapistCheckError);
      return NextResponse.json({ 
        error: 'Therapist account not found',
        message: 'Your therapist account could not be verified. Please contact support if you believe this is an error.',
        code: 'THERAPIST_NOT_FOUND'
      }, { status: 404 });
    }

    if (!therapist.is_verified || !therapist.is_active) {
      console.warn('⚠️ Therapist not approved:', {
        therapistId,
        is_verified: therapist.is_verified,
        is_active: therapist.is_active
      });
      return NextResponse.json({ 
        error: 'Your therapist account is not yet approved',
        message: 'Your application is pending admin approval. Once approved, you will be able to set your availability. Please check back later or contact support if you have questions.',
        code: 'NOT_APPROVED',
        details: {
          is_verified: therapist.is_verified,
          is_active: therapist.is_active,
          status: therapist.is_verified && therapist.is_active ? 'approved' : 'pending'
        }
      }, { status: 403 });
    }

    // Check if therapist_profiles exists (critical for booking system)
    const { data: profile, error: profileCheckError } = await supabase
      .from('therapist_profiles')
      .select('id, verification_status, is_verified')
      .eq('user_id', therapistId)
      .single();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error('❌ Error checking therapist profile:', profileCheckError);
      return NextResponse.json({ 
        error: 'Unable to verify therapist profile',
        message: 'There was an issue verifying your therapist profile. Please contact support for assistance.',
        code: 'PROFILE_CHECK_ERROR'
      }, { status: 500 });
    }

    if (!profile) {
      console.warn('⚠️ Therapist profile not found:', therapistId);
      return NextResponse.json({ 
        error: 'Therapist profile not found',
        message: 'Your therapist profile is missing. This may be due to incomplete approval. Please contact support to resolve this issue.',
        code: 'PROFILE_MISSING'
      }, { status: 404 });
    }

    // Save to weekly availability table
    console.log('💾 Saving weekly availability for approved therapist:', therapistId);
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
      console.error('❌ Weekly availability save error:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        therapistId
      });
      
      // Provide more specific error messages
      let errorMessage = 'Failed to save availability';
      let userMessage = 'There was an issue saving your availability schedule. Please try again.';
      
      if (error.code === '23505') { // Unique constraint violation
        errorMessage = 'Availability schedule already exists';
        userMessage = 'Your availability schedule has already been saved. If you need to update it, please refresh the page.';
      } else if (error.code === '23503') { // Foreign key violation
        errorMessage = 'Invalid therapist ID';
        userMessage = 'Your therapist account could not be verified. Please contact support.';
      } else if (error.message?.includes('null')) {
        errorMessage = 'Missing required data';
        userMessage = 'Some required information is missing. Please ensure all fields are filled correctly.';
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        message: userMessage,
        code: error.code || 'SAVE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.details : undefined
      }, { status: 500 });
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
      console.error('❌ Weekly availability fetch error:', {
        error,
        code: error.code,
        message: error.message,
        therapistId
      });
      
      // If record doesn't exist, return empty availability instead of error
      if (error.code === 'PGRST116') {
        console.log('ℹ️ No availability schedule found for therapist:', therapistId);
        return NextResponse.json({ 
          success: true,
          availability: null,
          message: 'No availability schedule found. You can set your availability below.',
          data: null
        }, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
      }
      
      return NextResponse.json({ 
        error: 'Failed to fetch availability',
        message: 'There was an issue loading your availability schedule. Please try again or contact support if the problem persists.',
        code: error.code || 'FETCH_ERROR'
      }, { status: 500 });
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
