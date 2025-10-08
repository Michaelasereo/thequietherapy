import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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
      console.error('❌ Missing Paystack signature for donation webhook')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(body)
      .digest('hex')

    if (hash !== signature) {
      console.error('❌ Invalid Paystack signature for donation webhook')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔔 DONATION WEBHOOK RECEIVED')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Event Type:', event.event)
    console.log('Event ID:', event.id)
    console.log('Timestamp:', new Date().toISOString())

    // Handle successful donation
    if (event.event === 'charge.success') {
      const paymentData = event.data
      const reference = paymentData.reference

      console.log('✅ Processing successful donation')
      console.log('Reference:', reference)
      console.log('Amount:', paymentData.amount / 100, 'NGN')
      console.log('Customer Email:', paymentData.customer?.email)

      // Update donation status to success
      const { error: updateError } = await supabase
        .from('donations')
        .update({
          status: 'success',
          verified_at: new Date().toISOString(),
          gateway_response: paymentData
        })
        .eq('paystack_reference', reference)

      if (updateError) {
        console.error('❌ ERROR UPDATING DONATION STATUS')
        console.error('Error details:', updateError)
        console.error('Reference:', reference)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        return NextResponse.json({ error: 'Failed to update donation' }, { status: 500 })
      }

      console.log('✅ DONATION VERIFIED & UPDATED TO SUCCESS')
      console.log('Reference:', reference)
      console.log('Database updated successfully')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      // Invalidate donation stats cache
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/donations/stats`, {
          headers: { 'Cache-Control': 'no-cache' }
        })
        console.log('📊 Donation stats cache invalidated')
      } catch (cacheError) {
        console.warn('⚠️ Failed to invalidate donation stats cache:', cacheError)
      }
    }

    return NextResponse.json({ received: true, event_id: event.id })

  } catch (error) {
    console.error('❌ Donation webhook processing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
