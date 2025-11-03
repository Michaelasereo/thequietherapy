import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireApiAuth } from '@/lib/server-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth(['therapist']);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { session } = authResult;
    const therapistId = session.user.id;

    const body = await request.json();
    const { 
      start_time, 
      duration_minutes, 
      exclude_session_id = null 
    } = body;

    if (!start_time || !duration_minutes) {
      return NextResponse.json(
        { error: 'Missing required fields: start_time and duration_minutes are required' },
        { status: 400 }
      );
    }

    const startTime = new Date(start_time);
    const endTime = new Date(startTime.getTime() + duration_minutes * 60000);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format for start_time' },
        { status: 400 }
      );
    }

    console.log('🔍 Checking availability:', {
      therapist_id: therapistId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_minutes,
      exclude_session_id
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build query to find overlapping sessions
    // Query for sessions that overlap: session.start <= requested.end AND session.end >= requested.start
    let query = supabase
      .from('sessions')
      .select(`
        id,
        start_time,
        end_time,
        status,
        users:user_id (
          id,
          email,
          full_name
        )
      `)
      .eq('therapist_id', therapistId)
      .lte('start_time', endTime.toISOString())
      .gte('end_time', startTime.toISOString());

    // Exclude current session if editing
    if (exclude_session_id) {
      query = query.neq('id', exclude_session_id);
    }

    const { data: allSessions, error } = await query;

    // Filter overlapping sessions in memory for more precise matching
    // Also filter out cancelled and completed sessions
    const conflictingSessions = allSessions?.filter(session => {
      // Filter out cancelled/completed/no_show sessions
      if (['cancelled', 'completed', 'no_show'].includes(session.status)) {
        return false;
      }
      
      const sessionStart = new Date(session.start_time);
      const sessionEnd = new Date(session.end_time);
      // Check if sessions overlap: session starts before requested ends AND session ends after requested starts
      return sessionStart <= endTime && sessionEnd >= startTime;
    }) || [];

    if (error) {
      console.error('❌ Database error checking availability:', error);
      return NextResponse.json(
        { error: 'Failed to check availability', details: error.message },
        { status: 500 }
      );
    }

    const activeConflicts = conflictingSessions;

    console.log('📊 Availability check results:', {
      totalConflicts: conflictingSessions?.length || 0,
      activeConflicts: activeConflicts.length,
      conflicts: activeConflicts.map(c => {
        const user = Array.isArray(c.users) ? c.users[0] : (c.users as any);
        return {
          id: c.id,
          start: c.start_time,
          end: c.end_time,
          status: c.status,
          user: user?.full_name || 'Unknown User'
        };
      })
    });

    const suggestions = activeConflicts.length > 0 
      ? generateSuggestedTimes(startTime, duration_minutes, activeConflicts)
      : [];

    return NextResponse.json({
      available: activeConflicts.length === 0,
      conflicting_sessions: activeConflicts.map(c => {
        const user = Array.isArray(c.users) ? c.users[0] : (c.users as any);
        return {
          id: c.id,
          start_time: c.start_time,
          end_time: c.end_time,
          status: c.status,
          user_name: user?.full_name || 'Unknown User',
          user_email: user?.email
        };
      }),
      suggested_times: suggestions
    });

  } catch (error) {
    console.error('💥 Availability check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

function generateSuggestedTimes(
  originalStart: Date, 
  duration: number, 
  conflicts: any[]
): Array<{ time: string; label: string }> {
  const suggestions: Array<{ time: string; label: string }> = [];
  const bufferMinutes = 15; // Buffer between sessions
  
  // Try 30 minutes later
  const laterTime = new Date(originalStart.getTime() + 30 * 60000);
  suggestions.push({
    time: laterTime.toISOString(),
    label: `30 minutes later (${laterTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
  });
  
  // Try 1 hour later
  const oneHourLater = new Date(originalStart.getTime() + 60 * 60000);
  suggestions.push({
    time: oneHourLater.toISOString(),
    label: `1 hour later (${oneHourLater.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
  });
  
  // Try same time next day
  const nextDay = new Date(originalStart);
  nextDay.setDate(nextDay.getDate() + 1);
  suggestions.push({
    time: nextDay.toISOString(),
    label: `Same time tomorrow (${nextDay.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
  });
  
  return suggestions;
}

