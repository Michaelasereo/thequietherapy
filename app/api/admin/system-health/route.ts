import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/server-auth';
import { handleApiError, successResponse } from '@/lib/api-response';
import { supabase } from '@/lib/supabase';

// =============================================
// SYSTEM HEALTH MONITORING API
// Provides real-time system health status
// =============================================

/**
 * GET /api/admin/system-health
 * Get comprehensive system health status
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireApiAuth(['admin']);
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: 401 });
    }

    console.log('🔍 Checking system health...');

    // Check database connectivity and constraints
    const databaseHealth = await checkDatabaseHealth();
    
    // Check availability system
    const availabilityHealth = await checkAvailabilitySystem();
    
    // Check earnings system
    const earningsHealth = await checkEarningsSystem();
    
    // Check booking system
    const bookingsHealth = await checkBookingsSystem();

    const health = {
      database: databaseHealth,
      availability: availabilityHealth,
      earnings: earningsHealth,
      bookings: bookingsHealth,
      overall: getOverallHealth([databaseHealth, availabilityHealth, earningsHealth, bookingsHealth]),
      checkedAt: new Date().toISOString()
    };

    console.log('✅ System health check completed:', health.overall);

    return successResponse({ health });

  } catch (error) {
    console.error('❌ Error checking system health:', error);
    return handleApiError(error);
  }
}

// =============================================
// HEALTH CHECK FUNCTIONS
// =============================================

async function checkDatabaseHealth(): Promise<'healthy' | 'warning' | 'critical'> {
  try {
    // Test basic database connectivity
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Database connectivity error:', error);
      return 'critical';
    }

    // Check for missing constraints
    const constraintChecks = await Promise.all([
      checkConstraintExists('unique_therapist_session_slot'),
      checkConstraintExists('fk_therapist_user'),
      checkConstraintExists('check_valid_time_range')
    ]);

    const missingConstraints = constraintChecks.filter(check => !check);
    
    if (missingConstraints.length > 0) {
      console.warn(`⚠️ Missing ${missingConstraints.length} database constraints`);
      return 'warning';
    }

    // Check for orphaned records
    const orphanedRecords = await checkOrphanedRecords();
    if (orphanedRecords > 0) {
      console.warn(`⚠️ Found ${orphanedRecords} orphaned records`);
      return 'warning';
    }

    console.log('✅ Database health: healthy');
    return 'healthy';

  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return 'critical';
  }
}

async function checkAvailabilitySystem(): Promise<'healthy' | 'warning' | 'critical'> {
  try {
    // Check for dual availability system conflicts
    const { data: weeklySchedules, error: weeklyError } = await supabase
      .from('availability_weekly_schedules')
      .select('count')
      .limit(1);

    const { data: legacyAvailability, error: legacyError } = await supabase
      .from('therapist_availability')
      .select('count')
      .limit(1);

    if (weeklyError || legacyError) {
      console.error('❌ Availability system error:', { weeklyError, legacyError });
      return 'critical';
    }

    // Check for therapists with conflicting availability data
    const { data: conflicts, error: conflictError } = await supabase
      .rpc('check_availability_conflicts');

    if (conflictError) {
      console.warn('⚠️ Could not check availability conflicts:', conflictError);
      return 'warning';
    }

    if (conflicts && conflicts.length > 0) {
      console.warn(`⚠️ Found ${conflicts.length} availability conflicts`);
      return 'warning';
    }

    console.log('✅ Availability system health: healthy');
    return 'healthy';

  } catch (error) {
    console.error('❌ Availability system health check failed:', error);
    return 'warning';
  }
}

async function checkEarningsSystem(): Promise<'healthy' | 'warning' | 'critical'> {
  try {
    // Check if earnings transactions table exists and is accessible
    const { data, error } = await supabase
      .from('earnings_transactions')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Earnings system error:', error);
      return 'critical';
    }

    // Check for sessions without earnings calculations
    const { data: uncalculatedSessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id')
      .eq('status', 'completed')
      .not('id', 'in', `(
        SELECT DISTINCT session_id 
        FROM earnings_transactions 
        WHERE session_id IS NOT NULL 
        AND transaction_type = 'session_completion'
      )`)
      .limit(10);

    if (sessionsError) {
      console.warn('⚠️ Could not check uncalculated sessions:', sessionsError);
      return 'warning';
    }

    if (uncalculatedSessions && uncalculatedSessions.length > 0) {
      console.warn(`⚠️ Found ${uncalculatedSessions.length} completed sessions without earnings calculations`);
      return 'warning';
    }

    console.log('✅ Earnings system health: healthy');
    return 'healthy';

  } catch (error) {
    console.error('❌ Earnings system health check failed:', error);
    return 'warning';
  }
}

async function checkBookingsSystem(): Promise<'healthy' | 'warning' | 'critical'> {
  try {
    // Check for double bookings (sessions with same therapist, date, time)
    const { data: doubleBookings, error: bookingError } = await supabase
      .from('sessions')
      .select('therapist_id, scheduled_date, scheduled_time')
      .in('status', ['scheduled', 'confirmed', 'in_progress'])
      .not('id', 'in', `(
        SELECT DISTINCT id FROM (
          SELECT id, ROW_NUMBER() OVER (
            PARTITION BY therapist_id, scheduled_date, scheduled_time 
            ORDER BY created_at
          ) as rn
          FROM sessions 
          WHERE status IN ('scheduled', 'confirmed', 'in_progress')
        ) t WHERE rn = 1
      )`);

    if (bookingError) {
      console.warn('⚠️ Could not check for double bookings:', bookingError);
      return 'warning';
    }

    if (doubleBookings && doubleBookings.length > 0) {
      console.error(`❌ Found ${doubleBookings.length} double bookings`);
      return 'critical';
    }

    // Check for sessions with invalid therapist references
    const { data: invalidSessions, error: invalidError } = await supabase
      .from('sessions')
      .select('id')
      .not('therapist_id', 'in', `(SELECT id FROM users WHERE user_type = 'therapist')`)
      .limit(5);

    if (invalidError) {
      console.warn('⚠️ Could not check invalid therapist references:', invalidError);
      return 'warning';
    }

    if (invalidSessions && invalidSessions.length > 0) {
      console.warn(`⚠️ Found ${invalidSessions.length} sessions with invalid therapist references`);
      return 'warning';
    }

    console.log('✅ Bookings system health: healthy');
    return 'healthy';

  } catch (error) {
    console.error('❌ Bookings system health check failed:', error);
    return 'warning';
  }
}

// =============================================
// HELPER FUNCTIONS
// =============================================

async function checkConstraintExists(constraintName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('check_constraint_exists', { constraint_name: constraintName });
    
    return !error && data;
  } catch (error) {
    console.warn(`Could not check constraint ${constraintName}:`, error);
    return false;
  }
}

async function checkOrphanedRecords(): Promise<number> {
  try {
    const { data, error } = await supabase
      .rpc('count_orphaned_records');
    
    if (error) {
      console.warn('Could not check orphaned records:', error);
      return 0;
    }
    
    return data || 0;
  } catch (error) {
    console.warn('Error checking orphaned records:', error);
    return 0;
  }
}

function getOverallHealth(healthChecks: Array<'healthy' | 'warning' | 'critical'>): 'healthy' | 'warning' | 'critical' {
  if (healthChecks.includes('critical')) return 'critical';
  if (healthChecks.includes('warning')) return 'warning';
  return 'healthy';
}