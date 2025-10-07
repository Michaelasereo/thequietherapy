import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyPayment } from '@/lib/paystack'
import { requireApiAuth } from '@/lib/server-auth'
import { ValidationError, NotFoundError, successResponse, validateRequired } from '@/lib/api-response'
import { notificationIntegrationService } from '@/lib/notification-integration'
import { handleApiError } from '@/lib/app-error-handler'
import { randomUUID } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authResult = await requireApiAuth(['individual'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { session } = authResult
    const userId = session.user.id

    const { reference } = await request.json()
    validateRequired({ reference }, ['reference'])

    console.log('🔍 Verifying payment:', reference, 'for user:', userId)

    // Verify payment with Paystack
    const verification = await verifyPayment(reference)
    
    if (!verification.success) {
      throw new Error('Payment verification failed')
    }

    const paymentInfo = verification.data

    // Check if payment is successful
    if (paymentInfo.status !== 'success') {
      return successResponse({
        verified: false,
        status: paymentInfo.status,
        message: 'Payment was not successful'
      })
    }

    // Find pending payment record
    const { data: pendingPayment, error: pendingError } = await supabase
      .from('pending_payments')
      .select('*')
      .eq('payment_reference', reference)
      .eq('user_id', userId)
      .single()

    if (pendingError || !pendingPayment) {
      throw new NotFoundError('Payment record not found')
    }

    // Check if already processed
    if (pendingPayment.status === 'success') {
      return successResponse({
        verified: true,
        status: 'already_processed',
        message: 'Payment already processed'
      })
    }

    // Get package details
    const { data: packageDef, error: packageError } = await supabase
      .from('package_definitions')
      .select('*')
      .eq('package_type', pendingPayment.package_type)
      .single()

    if (packageError || !packageDef) {
      throw new NotFoundError('Package definition not found')
    }

    // Update pending payment status
    await supabase
      .from('pending_payments')
      .update({
        status: 'success',
        verified_at: new Date().toISOString(),
        paystack_data: paymentInfo
      })
      .eq('payment_reference', reference)

    // Add credits to user account
    const { error: creditError } = await supabase
      .from('user_credits')
      .insert({
        user_id: userId,
        package_type: pendingPayment.package_type,
        credits_purchased: packageDef.sessions_included,
        amount_paid_kobo: pendingPayment.amount_kobo,
        payment_reference: reference,
        status: 'active',
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        created_at: new Date().toISOString()
      })

    if (creditError) {
      console.error('❌ Error adding credits:', creditError)
      throw new Error('Failed to add credits to account')
    }

    // Create payment record
    await supabase
      .from('payments')
      .insert({
        user_id: userId,
        package_type: pendingPayment.package_type,
        amount_kobo: pendingPayment.amount_kobo,
        payment_reference: reference,
        paystack_reference: paymentInfo.reference,
        status: 'success',
        payment_method: paymentInfo.channel,
        gateway_response: paymentInfo,
        created_at: new Date().toISOString()
      })

    console.log('✅ Payment verified and processed:', {
      user: userId,
      package: pendingPayment.package_type,
      credits: packageDef.sessions_included,
      amount: pendingPayment.amount_kobo / 100
    })

    // Send payment confirmation notifications
    try {
      // Get user details for notifications
      const { data: userData } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', userId)
        .single()

      if (userData) {
        const user = {
          id: userId,
          email: userData.email,
          firstName: userData.full_name?.split(' ')[0] || 'User',
          lastName: userData.full_name?.split(' ').slice(1).join(' ') || '',
        }

        await notificationIntegrationService.sendPaymentConfirmation(
          userData.email,
          pendingPayment.amount_kobo / 100,
          packageDef.sessions_included
        )

        console.log('📧 Payment confirmation notifications sent')
      }
    } catch (notificationError) {
      console.error('❌ Error sending payment notifications:', notificationError)
      // Don't fail the payment if notifications fail
    }

    return successResponse({
      verified: true,
      status: 'success',
      package: {
        name: packageDef.name,
        sessions_included: packageDef.sessions_included,
        amount_naira: pendingPayment.amount_kobo / 100
      },
      credits_added: packageDef.sessions_included,
      message: 'Payment verified and credits added successfully'
    })

  } catch (error) {
    return handleApiError(error)
  }
}
