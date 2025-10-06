import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/server-auth';
import { handleApiError, successResponse, validateRequired } from '@/lib/api-response';
import { earningsEngine } from '@/lib/earnings-engine';

// =============================================
// EARNINGS CALCULATION API
// Handles session earnings calculation and reporting
// =============================================

/**
 * POST /api/earnings/calculate
 * Calculate earnings for a completed session
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication (therapists can calculate their own, admins can calculate any)
    const authResult = await requireApiAuth(['therapist', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: 401 });
    }

    const { session } = authResult;
    const body = await request.json();
    const { session_id, action } = body;

    validateRequired(body, ['action']);

    console.log(`💰 Earnings calculation request: ${action} by user ${session.user.id}`);

    let result;

    switch (action) {
      case 'calculate_session':
        validateRequired(body, ['session_id']);
        
        // For therapists, only allow calculating their own sessions
        if (session.user.user_type === 'therapist') {
          // Verify session belongs to therapist
          const { data: sessionData, error: sessionError } = await require('@/lib/supabase').supabase
            .from('sessions')
            .select('therapist_id')
            .eq('id', session_id)
            .single();

          if (sessionError || !sessionData) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
          }

          if (sessionData.therapist_id !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized to calculate earnings for this session' }, { status: 403 });
          }
        }

        result = await earningsEngine.calculateSessionEarnings(session_id);
        break;

      case 'get_report':
        const { therapist_id, start_date, end_date } = body;
        
        // For therapists, only allow getting their own report
        const targetTherapistId = session.user.user_type === 'admin' ? therapist_id : session.user.id;
        
        if (!targetTherapistId) {
          return NextResponse.json({ error: 'therapist_id is required' }, { status: 400 });
        }

        validateRequired(body, ['start_date', 'end_date']);
        
        result = await earningsEngine.getEarningsReport(
          targetTherapistId,
          new Date(start_date),
          new Date(end_date),
          session.user.id
        );
        break;

      case 'get_summary':
        const therapistId = session.user.user_type === 'admin' ? body.therapist_id : session.user.id;
        
        if (!therapistId) {
          return NextResponse.json({ error: 'therapist_id is required' }, { status: 400 });
        }

        result = await earningsEngine.getEarningsSummary(therapistId);
        break;

      case 'add_adjustment':
        // Only admins can add adjustments
        if (session.user.user_type !== 'admin') {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { therapist_id: adjTherapistId, amount_kobo, reason } = body;
        validateRequired(body, ['therapist_id', 'amount_kobo', 'reason']);

        result = await earningsEngine.addAdjustment(
          adjTherapistId,
          amount_kobo,
          reason,
          session.user.id,
          body.session_id
        );
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    console.log(`✅ Earnings calculation completed: ${action}`);

    return successResponse({
      action,
      result,
      calculated_by: session.user.id,
      calculated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in earnings calculation:', error);
    return handleApiError(error);
  }
}

/**
 * GET /api/earnings/calculate
 * Get earnings summary for authenticated therapist
 */
export async function GET(request: NextRequest) {
  try {
    // Require therapist authentication
    const authResult = await requireApiAuth(['therapist']);
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: 401 });
    }

    const { session } = authResult;
    const therapistId = session.user.id;

    console.log(`📊 Getting earnings summary for therapist: ${therapistId}`);

    const summary = await earningsEngine.getEarningsSummary(therapistId);

    return successResponse({ summary });

  } catch (error) {
    console.error('❌ Error getting earnings summary:', error);
    return handleApiError(error);
  }
}
