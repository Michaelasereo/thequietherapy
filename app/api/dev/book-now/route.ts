import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireApiAuth } from '@/lib/server-auth';
import { createTestSessionTime, createTestSessionEndTime, isTestTherapist } from '@/lib/dev-time-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Development-only endpoint for creating test sessions instantly
 * Bypasses all availability and time restrictions
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    // Authentication check
    const authResult = await requireApiAuth(['individual']);
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: 401 });
    }

    const { session } = authResult;
    const userId = session.user.id;
    const userEmail = session.user.email;
    const userName = session.user.full_name;

    // Parse request
    const { userId: requestUserId, therapistId, startTime, endTime } = await request.json();

    // Use provided times or create test times
    const sessionStart = startTime ? new Date(startTime) : createTestSessionTime();
    const sessionEnd = endTime ? new Date(endTime) : createTestSessionEndTime(sessionStart);

    // Use test therapist if not provided
    const testTherapistId = therapistId || 'test-therapist-1';

    console.log('🚀 Creating dev test session:', {
      userId: requestUserId || userId,
      therapistId: testTherapistId,
      sessionStart: sessionStart.toISOString(),
      sessionEnd: sessionEnd.toISOString()
    });

    // Create or get test therapist
    const { data: testTherapist, error: therapistError } = await supabase
      .from('users')
      .select('*')
      .eq('id', testTherapistId)
      .eq('user_type', 'therapist')
      .single();

    if (therapistError && therapistError.code === 'PGRST116') {
      // Create test therapist if doesn't exist
      console.log('Creating test therapist...');
      const { data: newTherapist, error: createError } = await supabase
        .from('users')
        .insert({
          id: testTherapistId,
          email: 'test-therapist@example.com',
          full_name: 'Test Therapist',
          user_type: 'therapist',
          is_active: true,
          is_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating test therapist:', createError);
        return NextResponse.json(
          { error: 'Failed to create test therapist' },
          { status: 500 }
        );
      }

      // Create therapist profile
      await supabase
        .from('therapist_profiles')
        .insert({
          therapist_id: testTherapistId,
          verification_status: 'approved',
          is_verified: true,
          specialization: 'General Therapy',
          bio: 'Test therapist for development',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      console.log('✅ Test therapist created');
    } else if (therapistError) {
      console.error('Error fetching therapist:', therapistError);
      return NextResponse.json(
        { error: 'Failed to fetch therapist' },
        { status: 500 }
      );
    }

    // Ensure user has credits (create if not exists)
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', requestUserId || userId)
      .in('user_type', ['individual', 'user'])
      .single();

    if (creditsError && creditsError.code === 'PGRST116') {
      // Create credits for user
      await supabase
        .from('user_credits')
        .insert({
          user_id: requestUserId || userId,
          user_type: 'individual',
          credits_balance: 10,
          total_credits_purchased: 10,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      console.log('✅ Created test credits for user');
    }

    // Create session directly (bypass availability checks)
    const sessionDate = sessionStart.toISOString().split('T')[0];
    const sessionTime = sessionStart.toTimeString().slice(0, 5);

    const { data: newSession, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: requestUserId || userId,
        therapist_id: testTherapistId,
        session_date: sessionDate,
        session_time: sessionTime,
        start_time: sessionStart.toISOString(),
        end_time: sessionEnd.toISOString(),
        duration_minutes: 30,
        status: 'scheduled',
        session_type: 'video',
        title: `Test Session - ${userName}`,
        notes: `Development test session created by ${userName} (${userEmail})`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Create Daily.co room
    try {
      const { createTherapySessionRoom } = await import('@/lib/daily');
      const room = await createTherapySessionRoom({
        sessionId: newSession.id,
        therapistName: 'Test Therapist',
        patientName: userName || 'Test User',
        duration: 30,
        scheduledTime: sessionStart
      });

      // Update session with room URL
      await supabase
        .from('sessions')
        .update({ 
          session_url: room.url,
          room_name: room.name
        })
        .eq('id', newSession.id);

      console.log('✅ Daily.co room created:', room.name);
    } catch (roomError) {
      console.error('❌ Failed to create Daily.co room:', roomError);
      // Don't fail the session creation if room creation fails
    }

    console.log('✅ Dev test session created successfully:', newSession.id);

    return NextResponse.json({
      success: true,
      data: {
        ...newSession,
        therapist_name: 'Test Therapist',
        therapist_email: 'test-therapist@example.com'
      },
      message: 'Test session created successfully'
    });

  } catch (error) {
    console.error('❌ Dev booking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
