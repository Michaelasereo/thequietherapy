import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyPayment } from '@/lib/paystack'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    if (!signature) {
      console.error('❌ Missing Paystack signature')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(body)
      .digest('hex')

    if (hash !== signature) {
      console.error('❌ Invalid Paystack signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)
    
    // CRITICAL: Idempotency check - prevent duplicate processing
    const { data: existingEvent } = await supabase
      .from('payment_events')
      .select('id, processed_at')
      .eq('id', event.id)
      .single()
    
    if (existingEvent) {
      console.log('✅ Webhook already processed:', event.id)
      return NextResponse.json({ status: 'already_processed', id: event.id })
    }

    console.log('🔔 Paystack webhook received:', event.event, 'ID:', event.id)

    // Store event immediately for idempotency within transaction
    const { error: eventError } = await supabase.rpc('process_payment_webhook', {
      p_event_id: event.id,
      p_event_data: event
    })

    if (eventError) {
      console.error('❌ Error processing webhook:', eventError)
      return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
    }

    return NextResponse.json({ received: true, event_id: event.id })

  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleSuccessfulPayment(paymentData: any) {
  try {
    const { reference } = paymentData
    
    console.log('✅ Processing successful payment:', reference)

    // Verify payment with Paystack
    const verification = await verifyPayment(reference)
    
    if (!verification.success || !verification.isSuccessful) {
      console.error('❌ Payment verification failed:', reference)
      return
    }

    const paymentInfo = verification.data

    // Find pending payment record
    const { data: pendingPayment, error: pendingError } = await supabase
      .from('pending_payments')
      .select('*')
      .eq('payment_reference', reference)
      .single()

    if (pendingError || !pendingPayment) {
      console.error('❌ Pending payment not found:', reference)
      return
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

    // Get package details
    const { data: packageDef, error: packageError } = await supabase
      .from('package_definitions')
      .select('*')
      .eq('package_type', pendingPayment.package_type)
      .single()

    if (packageError || !packageDef) {
      console.error('❌ Package definition not found:', pendingPayment.package_type)
      return
    }

    // Add credits to user account
    const { error: creditError } = await supabase
      .from('user_credits')
      .insert({
        user_id: pendingPayment.user_id,
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
      return
    }

    // Create payment record
    await supabase
      .from('payments')
      .insert({
        user_id: pendingPayment.user_id,
        package_type: pendingPayment.package_type,
        amount_kobo: pendingPayment.amount_kobo,
        payment_reference: reference,
        paystack_reference: paymentInfo.reference,
        status: 'success',
        payment_method: paymentInfo.channel,
        gateway_response: paymentInfo,
        created_at: new Date().toISOString()
      })

    console.log('✅ Payment processed successfully:', {
      user: pendingPayment.user_id,
      package: pendingPayment.package_type,
      credits: packageDef.sessions_included,
      amount: pendingPayment.amount_kobo / 100
    })

  } catch (error) {
    console.error('❌ Error handling successful payment:', error)
  }
}

async function handleFailedPayment(paymentData: any) {
  try {
    const { reference } = paymentData
    
    console.log('❌ Processing failed payment:', reference)

    // Update pending payment status
    await supabase
      .from('pending_payments')
      .update({
        status: 'failed',
        verified_at: new Date().toISOString(),
        paystack_data: paymentData
      })
      .eq('payment_reference', reference)

    console.log('✅ Failed payment processed:', reference)

  } catch (error) {
    console.error('❌ Error handling failed payment:', error)
  }
}