import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireApiAuth } from '@/lib/server-auth'
import { handleApiError, ValidationError, successResponse, validateRequired } from '@/lib/api-response'
import { notificationIntegrationService } from '@/lib/notification-integration'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface RefundRequestBody {
  payment_reference: string
  refund_type: 'full_refund' | 'partial_refund' | 'credit_reversal' | 'cancellation_refund'
  refund_amount_kobo?: number // Optional for full refunds
  reason: 'session_cancelled' | 'service_issue' | 'technical_problem' | 'duplicate_payment' | 'unauthorized_charge' | 'customer_request' | 'admin_adjustment' | 'other'
  reason_details?: string
  session_id?: string
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authResult = await requireApiAuth(['individual', 'partner'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { session } = authResult
    const userId = session.user.id

    const body: RefundRequestBody = await request.json()
    validateRequired(body, ['payment_reference', 'refund_type', 'reason'])

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('payment_reference', body.payment_reference)
      .eq('user_id', userId)
      .single()

    if (paymentError || !payment) {
      throw new ValidationError('Payment not found or does not belong to you')
    }

    // Check if payment was already refunded
    const { data: existingRefund } = await supabase
      .from('refunds')
      .select('*')
      .eq('payment_reference', body.payment_reference)
      .in('status', ['pending', 'approved', 'processing', 'completed'])
      .single()

    if (existingRefund) {
      throw new ValidationError('A refund request already exists for this payment')
    }

    // Calculate refund amount
    let refundAmount = body.refund_amount_kobo || payment.amount_kobo
    if (body.refund_type === 'full_refund') {
      refundAmount = payment.amount_kobo
    }

    if (refundAmount > payment.amount_kobo) {
      throw new ValidationError('Refund amount cannot exceed original payment amount')
    }

    // Calculate fees (2% processing fee, minimum 100 kobo)
    const refundFee = Math.max(Math.ceil(refundAmount * 0.02), 100)
    const netRefund = refundAmount - refundFee

    // Create refund request
    const { data: refund, error: refundError } = await supabase
      .from('refunds')
      .insert({
        user_id: userId,
        payment_id: payment.id,
        session_id: body.session_id || null,
        payment_reference: body.payment_reference,
        refund_type: body.refund_type,
        original_amount_kobo: payment.amount_kobo,
        refund_amount_kobo: refundAmount,
        refund_fee_kobo: refundFee,
        net_refund_kobo: netRefund,
        status: 'pending',
        reason: body.reason,
        reason_details: body.reason_details || null,
        requested_by: userId,
        requested_at: new Date().toISOString()
      })
      .select()
      .single()

    if (refundError) {
      console.error('Error creating refund request:', refundError)
      throw new Error('Failed to create refund request')
    }

    // Create refund history entry
    await supabase
      .from('refund_history')
      .insert({
        refund_id: refund.id,
        new_status: 'pending',
        changed_by: userId,
        change_reason: 'Refund request created',
        metadata: { 
          refund_type: body.refund_type,
          reason: body.reason 
        }
      })

    console.log('✅ Refund request created:', {
      refundId: refund.id,
      user: userId,
      amount: refundAmount / 100,
      netRefund: netRefund / 100
    })

    // Send notification to user
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', userId)
        .single()

      if (userData) {
        // Send email notification about refund request
        console.log('📧 Sending refund request confirmation to:', userData.email)
      }
    } catch (notifError) {
      console.error('Error sending refund notification:', notifError)
      // Don't fail the request
    }

    return successResponse({
      refund_id: refund.id,
      status: refund.status,
      refund_amount_naira: refundAmount / 100,
      refund_fee_naira: refundFee / 100,
      net_refund_naira: netRefund / 100,
      message: 'Refund request submitted successfully. Our team will review it within 24-48 hours.'
    })

  } catch (error) {
    return handleApiError(error)
  }
}

// GET - Get user's refund requests
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth(['individual', 'partner'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { session } = authResult
    const userId = session.user.id

    const { data: refunds, error } = await supabase
      .from('refunds')
      .select(`
        id,
        payment_reference,
        refund_type,
        original_amount_kobo,
        refund_amount_kobo,
        refund_fee_kobo,
        net_refund_kobo,
        status,
        reason,
        reason_details,
        rejection_reason,
        requested_at,
        approved_at,
        completed_at
      `)
      .eq('user_id', userId)
      .order('requested_at', { ascending: false })

    if (error) {
      throw new Error('Failed to fetch refunds')
    }

    return successResponse({
      refunds: refunds.map(r => ({
        ...r,
        original_amount_naira: r.original_amount_kobo / 100,
        refund_amount_naira: r.refund_amount_kobo / 100,
        refund_fee_naira: r.refund_fee_kobo / 100,
        net_refund_naira: r.net_refund_kobo / 100
      }))
    })

  } catch (error) {
    return handleApiError(error)
  }
}

