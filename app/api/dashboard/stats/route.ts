import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { SessionManager } from '@/lib/session-manager';
import { updateAllSessionStatuses } from '@/lib/session-status-updater';

export async function GET(request: NextRequest) {
  try {
    // Get user from session using SessionManager
    const session = await SessionManager.getSessionFromRequest(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.id;
    
    // Update session statuses before calculating stats
    await updateAllSessionStatuses();

    const supabase = createServerClient();

    // Get all sessions for the user
    const { data: allSessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, status, scheduled_date, scheduled_time, start_time, end_time, duration_minutes')
      .eq('user_id', userId);

    if (sessionsError) {
      console.error('Error fetching user sessions for stats:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    const sessions = allSessions || [];
    
    console.log('🔍 Dashboard Stats API: Found sessions:', sessions.length);
    console.log('🔍 Dashboard Stats API: Session statuses:', sessions.map(s => ({ id: s.id, status: s.status })));
    
    // Calculate stats
    const totalSessions = sessions.length;
    
    // Count upcoming sessions (scheduled or in_progress)
    const upcomingSessions = sessions.filter(s => 
      s.status === 'scheduled' || s.status === 'in_progress'
    ).length;
    
    // Count completed sessions
    const completedSessions = sessions.filter(s => 
      s.status === 'completed'
    ).length;
    
    // Calculate progress score (based on completed sessions)
    const progressScore = Math.min(100, Math.max(0, completedSessions * 10));
    
    // Get user credits
    const { data: creditsData, error: creditsError } = await supabase
      .from('credits')
      .select('credits_balance')
      .eq('user_id', userId)
      .single();

    let totalCredits = 1; // Default fallback
    if (!creditsError && creditsData) {
      totalCredits = creditsData.credits_balance || 1;
    }

    // Calculate average session time (from completed sessions)
    let averageSessionTime = 0;
    const completedSessionsWithDuration = sessions.filter(s => 
      s.status === 'completed' && s.duration_minutes
    );
    
    if (completedSessionsWithDuration.length > 0) {
      const totalMinutes = completedSessionsWithDuration.reduce((sum, s) => 
        sum + (s.duration_minutes || 60), 0
      );
      averageSessionTime = Math.round(totalMinutes / completedSessionsWithDuration.length);
    }

    const stats = {
      totalSessions,
      upcomingSessions,
      completedSessions,
      progressScore,
      averageSessionTime,
      totalCredits,
      usedCredits: Math.max(0, totalCredits - completedSessions) // Rough estimate
    };

    console.log('🔍 Dashboard stats calculated:', stats);

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Dashboard stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
