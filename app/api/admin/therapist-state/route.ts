import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/server-auth';
import { handleApiError, successResponse, validateRequired } from '@/lib/api-response';
import { therapistStateManager } from '@/lib/therapist-state-manager';

// =============================================
// ADMIN THERAPIST STATE MANAGEMENT API
// Handles therapist lifecycle management with audit trails
// =============================================

/**
 * GET /api/admin/therapist-state
 * Get therapists by status or get specific therapist state
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireApiAuth(['admin']);
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const therapistId = searchParams.get('therapist_id');
    const status = searchParams.get('status');
    const includeHistory = searchParams.get('include_history') === 'true';

    if (therapistId) {
      // Get specific therapist state
      const currentState = await therapistStateManager.getCurrentState(therapistId);
      
      if (!currentState) {
        return NextResponse.json({ error: 'Therapist state not found' }, { status: 404 });
      }

      let stateHistory = null;
      let verificationHistory = null;

      if (includeHistory) {
        stateHistory = await therapistStateManager.getStateHistory(therapistId);
        verificationHistory = await therapistStateManager.getVerificationHistory(therapistId);
      }

      return successResponse({
        currentState,
        stateHistory,
        verificationHistory
      });
    } else if (status) {
      // Get therapists by status
      const therapists = await therapistStateManager.getTherapistsByStatus(status as any);
      return successResponse({ therapists });
    } else {
      return NextResponse.json({ error: 'therapist_id or status parameter required' }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Error in therapist state GET:', error);
    return handleApiError(error);
  }
}

/**
 * POST /api/admin/therapist-state
 * Transition therapist to new state
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireApiAuth(['admin']);
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: 401 });
    }

    const { session } = authResult;
    const adminId = session.user.id;

    const body = await request.json();
    const { action, therapist_id, new_status, reason, metadata } = body;

    validateRequired(body, ['action', 'therapist_id']);

    console.log(`🔧 Admin ${adminId} performing action: ${action} on therapist: ${therapist_id}`);

    let result;

    switch (action) {
      case 'transition_state':
        validateRequired(body, ['new_status', 'reason']);
        result = await therapistStateManager.transitionState(
          therapist_id,
          new_status,
          reason,
          adminId,
          metadata
        );
        break;

      case 'verify_therapist':
        const { documents } = body;
        result = await therapistStateManager.verifyTherapist(
          therapist_id,
          adminId,
          documents || [],
          reason
        );
        break;

      case 'reject_therapist':
        validateRequired(body, ['reason']);
        result = await therapistStateManager.rejectTherapist(
          therapist_id,
          adminId,
          reason,
          body.documents
        );
        break;

      case 'suspend_therapist':
        validateRequired(body, ['reason']);
        result = await therapistStateManager.suspendTherapist(
          therapist_id,
          adminId,
          reason,
          metadata
        );
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    console.log(`✅ Action ${action} completed successfully for therapist ${therapist_id}`);

    return successResponse({
      action,
      result,
      performed_by: adminId,
      performed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in therapist state POST:', error);
    return handleApiError(error);
  }
}
