import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireApiAuth } from '@/lib/server-auth'
import { handleApiError, ValidationError, successResponse, validateRequired } from '@/lib/api-response'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!
const PAYSTACK_BASE_URL = 'https://api.paystack.co'

// GET - Get all refund requests (admin only)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth(['admin'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    let query = supabase
      .from('refunds')
      .select(`
        *,
        user:users!refunds_user_id_fkey(id, full_name, email),
        payment:payments(package_type, payment_method)
      `)
      .order('requested_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: refunds, error } = await query

    if (error) {
      throw new Error('Failed to fetch refunds')
    }

    return successResponse({
      refunds: refunds.map(r => ({
        ...r,
        original_amount_naira: r.original_amount_kobo / 100,
        refund_amount_naira: r.refund_amount_kobo / 100,
        net_refund_naira: r.net_refund_kobo / 100
      }))
    })

  } catch (error) {
    return handleApiError(error)
  }
}

// POST - Approve or reject refund (admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth(['admin'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { session } = authResult
    const adminId = session.user.id

    const { refund_id, action, rejection_reason } = await request.json()
    validateRequired({ refund_id, action }, ['refund_id', 'action'])

    if (!['approve', 'reject'].includes(action)) {
      throw new ValidationError('Invalid action. Must be "approve" or "reject"')
    }

    // Get refund details
    const { data: refund, error: refundError } = await supabase
      .from('refunds')
      .select('*')
      .eq('id', refund_id)
      .single()

    if (refundError || !refund) {
      throw new ValidationError('Refund not found')
    }

    if (refund.status !== 'pending') {
      throw new ValidationError(`Cannot ${action} refund with status: ${refund.status}`)
    }

    if (action === 'approve') {
      // Approve and process refund
      const { data: updatedRefund, error: updateError } = await supabase
        .from('refunds')
        .update({
          status: 'approved',
          approved_by: adminId,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', refund_id)
        .select()
        .single()

      if (updateError) {
        throw new Error('Failed to approve refund')
      }

      // Create history entry
      await supabase
        .from('refund_history')
        .insert({
          refund_id: refund_id,
          old_status: 'pending',
          new_status: 'approved',
          changed_by: adminId,
          change_reason: 'Refund approved by admin'
        })

      // Initiate Paystack refund
      try {
        await initiatePaystackRefund(refund, adminId)
      } catch (paystackError) {
        console.error('Paystack refund error:', paystackError)
        // Update status to failed
        await supabase
          .from('refunds')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', refund_id)

        throw new Error('Failed to process refund with payment gateway')
      }

      return successResponse({
        message: 'Refund approved and processing initiated',
        refund: updatedRefund
      })

    } else {
      // Reject refund
      if (!rejection_reason) {
        throw new ValidationError('Rejection reason is required')
      }

      const { data: updatedRefund, error: updateError } = await supabase
        .from('refunds')
        .update({
          status: 'rejected',
          approved_by: adminId,
          rejection_reason: rejection_reason,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', refund_id)
        .select()
        .single()

      if (updateError) {
        throw new Error('Failed to reject refund')
      }

      // Create history entry
      await supabase
        .from('refund_history')
        .insert({
          refund_id: refund_id,
          old_status: 'pending',
          new_status: 'rejected',
          changed_by: adminId,
          change_reason: rejection_reason
        })

      return successResponse({
        message: 'Refund rejected',
        refund: updatedRefund
      })
    }

  } catch (error) {
    return handleApiError(error)
  }
}

// Helper function to initiate Paystack refund
async function initiatePaystackRefund(refund: any, adminId: string) {
  try {
    // Update status to processing
    await supabase
      .from('refunds')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', refund.id)

    // Call Paystack refund API
    const paystackResponse = await fetch(`${PAYSTACK_BASE_URL}/refund`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transaction: refund.payment_reference,
        amount: refund.refund_amount_kobo, // Amount in kobo
        currency: 'NGN',
        customer_note: `Refund for: ${refund.reason}`,
        merchant_note: `Refund request ID: ${refund.id}`
      })
    })

    const paystackResult = await paystackResponse.json()

    if (!paystackResponse.ok || !paystackResult.status) {
      console.error('Paystack refund failed:', paystackResult)
      throw new Error(paystackResult.message || 'Paystack refund failed')
    }

    // Update refund status to completed
    await supabase
      .from('refunds')
      .update({
        status: 'completed',
        processed_by: adminId,
        paystack_refund_id: paystackResult.data?.id?.toString(),
        paystack_refund_reference: paystackResult.data?.transaction?.reference,
        gateway_response: paystackResult.data,
        processed_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', refund.id)

    // Create history entry
    await supabase
      .from('refund_history')
      .insert({
        refund_id: refund.id,
        old_status: 'processing',
        new_status: 'completed',
        changed_by: adminId,
        change_reason: 'Refund processed successfully via Paystack',
        metadata: { paystack_refund_id: paystackResult.data?.id }
      })

    // If refund type is credit_reversal, add credits back to user's account
    if (refund.refund_type === 'credit_reversal') {
      // Get package details
      const { data: payment } = await supabase
        .from('payments')
        .select('package_type')
        .eq('id', refund.payment_id)
        .single()

      if (payment) {
        const { data: packageDef } = await supabase
          .from('package_definitions')
          .select('sessions_included')
          .eq('package_type', payment.package_type)
          .single()

        if (packageDef) {
          // Create new purchase record for reversed credits
          const { data: newPurchase } = await supabase
            .from('user_purchases')
            .insert({
              user_id: refund.user_id,
              package_type: payment.package_type,
              sessions_credited: packageDef.sessions_included,
              amount_paid: 0, // Refunded, so no payment
              session_duration_minutes: 35,
              created_at: new Date().toISOString()
            })
            .select()
            .single()

          if (newPurchase) {
            // Create credits
            const credits = Array.from({ length: packageDef.sessions_included }, () => ({
              user_id: refund.user_id,
              purchase_id: newPurchase.id,
              session_duration_minutes: 35,
              is_free_credit: false,
              created_at: new Date().toISOString()
            }))

            await supabase
              .from('user_session_credits')
              .insert(credits)
          }
        }
      }
    }

    console.log('✅ Refund processed successfully:', {
      refundId: refund.id,
      amount: refund.refund_amount_kobo / 100,
      paystackRefundId: paystackResult.data?.id
    })

    return true

  } catch (error) {
    console.error('Error initiating Paystack refund:', error)
    throw error
  }
}

