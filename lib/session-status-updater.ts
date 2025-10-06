import { createServerClient } from '@/lib/supabase';

/**
 * Updates session statuses based on their scheduled end times
 * This should be called periodically or when fetching sessions
 */
export async function updateExpiredSessions() {
  try {
    const supabase = createServerClient();
    
    // Get current time
    const now = new Date();
    const nowISO = now.toISOString();
    
    console.log('🔍 Session Status Updater: Checking for expired sessions at', nowISO);
    
    // Find sessions that should be marked as completed
    // These are sessions that are currently 'in_progress' or 'scheduled' 
    // and their calculated end time has passed
    const { data: sessionsToUpdate, error: fetchError } = await supabase
      .from('sessions')
      .select('id, scheduled_date, scheduled_time, duration_minutes, status')
      .in('status', ['scheduled', 'in_progress']);
    
    if (fetchError) {
      console.error('Error fetching sessions for status update:', fetchError);
      return { success: false, error: fetchError.message };
    }
    
    if (!sessionsToUpdate || sessionsToUpdate.length === 0) {
      console.log('🔍 Session Status Updater: No sessions to check');
      return { success: true, updated: 0 };
    }
    
    const sessionsToComplete: string[] = [];
    
    for (const session of sessionsToUpdate) {
      let sessionEndTime: Date;
      
      // Calculate session end time using scheduled_date and scheduled_time
      if (session.scheduled_date && session.scheduled_time && session.duration_minutes) {
        const startDateTime = new Date(`${session.scheduled_date}T${session.scheduled_time}`);
        sessionEndTime = new Date(startDateTime.getTime() + (session.duration_minutes * 60 * 1000));
      } else {
        // Skip sessions without proper time data
        console.log(`⚠️ Skipping session ${session.id} - missing time data`);
        continue;
      }
      
      // Check if session has ended (add 5 minute grace period)
      const graceEndTime = new Date(sessionEndTime.getTime() + (5 * 60 * 1000)); // 5 minutes grace
      
      if (now > graceEndTime && (session.status === 'in_progress' || session.status === 'scheduled')) {
        console.log(`🔍 Session ${session.id} should be completed. End time: ${sessionEndTime.toISOString()}, Current time: ${nowISO}`);
        sessionsToComplete.push(session.id);
      }
    }
    
    if (sessionsToComplete.length === 0) {
      console.log('🔍 Session Status Updater: No sessions need to be completed');
      return { success: true, updated: 0 };
    }
    
    // Update sessions to completed status
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        status: 'completed',
        updated_at: nowISO
      })
      .in('id', sessionsToComplete);
    
    if (updateError) {
      console.error('Error updating session statuses:', updateError);
      return { success: false, error: updateError.message };
    }
    
    console.log(`✅ Session Status Updater: Updated ${sessionsToComplete.length} sessions to completed`);
    
    return { success: true, updated: sessionsToComplete.length };
    
  } catch (error) {
    console.error('Session status updater error:', error);
    return { success: false, error: 'Internal error updating session statuses' };
  }
}

/**
 * Auto-start sessions that are scheduled to begin now
 */
export async function autoStartScheduledSessions() {
  try {
    const supabase = createServerClient();
    
    // Get current time
    const now = new Date();
    const nowISO = now.toISOString();
    
    // Find sessions that should be started (within 5 minutes of start time)
    const { data: sessionsToStart, error: fetchError } = await supabase
      .from('sessions')
      .select('id, scheduled_date, scheduled_time, status')
      .eq('status', 'scheduled');
    
    if (fetchError) {
      console.error('Error fetching sessions for auto-start:', fetchError);
      return { success: false, error: fetchError.message };
    }
    
    if (!sessionsToStart || sessionsToStart.length === 0) {
      return { success: true, started: 0 };
    }
    
    const sessionsToUpdate: string[] = [];
    
    for (const session of sessionsToStart) {
      let sessionStartTime: Date;
      
      if (session.scheduled_date && session.scheduled_time) {
        sessionStartTime = new Date(`${session.scheduled_date}T${session.scheduled_time}`);
      } else {
        console.log(`⚠️ Skipping session ${session.id} for auto-start - missing time data`);
        continue;
      }
      
      // Check if session should start (within 5 minutes before or after start time)
      const timeDiff = now.getTime() - sessionStartTime.getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      
      if (minutesDiff >= -5 && minutesDiff <= 5) { // 5 minutes before to 5 minutes after
        sessionsToUpdate.push(session.id);
      }
    }
    
    if (sessionsToUpdate.length === 0) {
      return { success: true, started: 0 };
    }
    
    // Update sessions to in_progress status
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        status: 'in_progress',
        updated_at: nowISO
      })
      .in('id', sessionsToUpdate);
    
    if (updateError) {
      console.error('Error auto-starting sessions:', updateError);
      return { success: false, error: updateError.message };
    }
    
    console.log(`✅ Auto-started ${sessionsToUpdate.length} sessions`);
    
    return { success: true, started: sessionsToUpdate.length };
    
  } catch (error) {
    console.error('Auto-start sessions error:', error);
    return { success: false, error: 'Internal error auto-starting sessions' };
  }
}

/**
 * Combined function to update all session statuses
 */
export async function updateAllSessionStatuses() {
  console.log('🔍 Running complete session status update...');
  
  const [expiredResult, autoStartResult] = await Promise.all([
    updateExpiredSessions(),
    autoStartScheduledSessions()
  ]);
  
  return {
    expired: expiredResult,
    autoStart: autoStartResult,
    success: expiredResult.success && autoStartResult.success
  };
}
