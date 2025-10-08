import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!

/**
 * Verify donation payment with Paystack and update database status
 * This endpoint is called when users return from Paystack to ensure donation is marked as successful
 */
export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json()

    if (!reference) {
      return NextResponse.json({
        success: false,
        error: 'Payment reference is required'
      }, { status: 400 })
    }

    console.log('🔍 Verifying donation payment:', reference)

    // Verify payment with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    const paystackResult = await paystackResponse.json()

    if (!paystackResponse.ok || !paystackResult.status) {
      console.error('❌ Paystack verification failed:', paystackResult)
      return NextResponse.json({
        success: false,
        error: 'Payment verification failed'
      }, { status: 400 })
    }

    const paymentData = paystackResult.data

    console.log('✅ Paystack verification successful:', {
      reference: paymentData.reference,
      amount: paymentData.amount / 100,
      status: paymentData.status
    })

    // Only update if payment was successful
    if (paymentData.status === 'success') {
      // Update donation status in database
      const { data: updatedDonation, error: updateError } = await supabase
        .from('donations')
        .update({
          status: 'success',
          verified_at: new Date().toISOString(),
          gateway_response: paymentData
        })
        .eq('paystack_reference', reference)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Error updating donation status:', updateError)
        return NextResponse.json({
          success: false,
          error: 'Failed to update donation status'
        }, { status: 500 })
      }

      console.log('✅ Donation status updated to SUCCESS:', {
        id: updatedDonation.id,
        amount: updatedDonation.amount,
        donor: updatedDonation.donor_name
      })

      return NextResponse.json({
        success: true,
        donation: {
          paystack_reference: updatedDonation.paystack_reference,
          amount: updatedDonation.amount,
          status: updatedDonation.status,
          donor_name: updatedDonation.donor_name,
          verified_at: updatedDonation.verified_at
        }
      })
    } else {
      console.log('⚠️ Payment status is not success:', paymentData.status)
      return NextResponse.json({
        success: false,
        error: `Payment status: ${paymentData.status}`
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Donation verification error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

