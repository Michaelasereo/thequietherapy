import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireApiAuth } from '@/lib/server-auth';
import { createTestSessionTime, createTestSessionEndTime, getTestTherapistIds } from '@/lib/dev-time-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Development-only endpoint for seeding test sessions
 * Creates multiple test sessions with different scenarios
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
    const userName = session.user.full_name;
    const userEmail = session.user.email;

    console.log('🌱 Seeding test sessions for user:', userId);

    // Ensure user has credits
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .in('user_type', ['individual', 'user'])
      .single();

    if (creditsError && creditsError.code === 'PGRST116') {
      await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          user_type: 'individual',
          credits_balance: 20,
          total_credits_purchased: 20,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      console.log('✅ Created test credits for user');
    }

    // Create test therapists if they don't exist
    const testTherapistIds = getTestTherapistIds();
    const therapists = [
      { id: 'test-therapist-1', name: 'Dr. Sarah Johnson', email: 'sarah.test@example.com', specialization: 'Anxiety & Depression' },
      { id: 'test-therapist-2', name: 'Dr. Michael Chen', email: 'michael.test@example.com', specialization: 'Relationship Therapy' },
      { id: 'test-therapist-3', name: 'Dr. Emily Rodriguez', email: 'emily.test@example.com', specialization: 'Trauma Recovery' }
    ];

    for (const therapist of therapists) {
      const { error: therapistError } = await supabase
        .from('users')
        .upsert({
          id: therapist.id,
          email: therapist.email,
          full_name: therapist.name,
          user_type: 'therapist',
          is_active: true,
          is_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (!therapistError) {
        // Create therapist profile
        await supabase
          .from('therapist_profiles')
          .upsert({
            therapist_id: therapist.id,
            verification_status: 'approved',
            is_verified: true,
            specialization: therapist.specialization,
            bio: `Test therapist specializing in ${therapist.specialization.toLowerCase()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
    }

    // Create test sessions with different scenarios
    const now = new Date();
    const testSessions = [
      {
        therapistId: 'test-therapist-1',
        startTime: new Date(now.getTime() + 5 * 60 * 1000), // 5 minutes from now
        status: 'scheduled',
        title: 'Immediate Test Session',
        notes: 'Test session starting soon'
      },
      {
        therapistId: 'test-therapist-2',
        startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
        status: 'scheduled',
        title: 'Afternoon Test Session',
        notes: 'Test session for later today'
      },
      {
        therapistId: 'test-therapist-3',
        startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
        status: 'scheduled',
        title: 'Tomorrow Test Session',
        notes: 'Test session for tomorrow'
      },
      {
        therapistId: 'test-therapist-1',
        startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        status: 'completed',
        title: 'Completed Test Session',
        notes: 'Completed test session for history'
      },
      {
        therapistId: 'test-therapist-2',
        startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Yesterday
        status: 'completed',
        title: 'Yesterday Test Session',
        notes: 'Yesterday\'s completed test session'
      }
    ];

    const createdSessions = [];

    for (const sessionData of testSessions) {
      const sessionDate = sessionData.startTime.toISOString().split('T')[0];
      const sessionTime = sessionData.startTime.toTimeString().slice(0, 5);
      const sessionEnd = new Date(sessionData.startTime.getTime() + 30 * 60 * 1000);

      const { data: newSession, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          user_id: userId,
          therapist_id: sessionData.therapistId,
          session_date: sessionDate,
          session_time: sessionTime,
          start_time: sessionData.startTime.toISOString(),
          end_time: sessionEnd.toISOString(),
          duration_minutes: 30,
          status: sessionData.status,
          session_type: 'video',
          title: sessionData.title,
          notes: `${sessionData.notes} - Created by ${userName} (${userEmail})`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (!sessionError) {
        createdSessions.push(newSession);

        // Create Daily.co room for scheduled sessions
        if (sessionData.status === 'scheduled') {
          try {
            const { createTherapySessionRoom } = await import('@/lib/daily');
            const room = await createTherapySessionRoom({
              sessionId: newSession.id,
              therapistName: therapists.find(t => t.id === sessionData.therapistId)?.name || 'Test Therapist',
              patientName: userName || 'Test User',
              duration: 30,
              scheduledTime: sessionData.startTime
            });

            await supabase
              .from('sessions')
              .update({ 
                session_url: room.url,
                room_name: room.name
              })
              .eq('id', newSession.id);

            console.log('✅ Daily.co room created for session:', newSession.id);
          } catch (roomError) {
            console.error('❌ Failed to create Daily.co room for session:', newSession.id, roomError);
          }
        }
      } else {
        console.error('Error creating test session:', sessionError);
      }
    }

    console.log('✅ Seeded test sessions:', createdSessions.length);

    return NextResponse.json({
      success: true,
      data: {
        sessionsCreated: createdSessions.length,
        sessions: createdSessions
      },
      message: `Successfully created ${createdSessions.length} test sessions`
    });

  } catch (error) {
    console.error('❌ Test seeding error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
