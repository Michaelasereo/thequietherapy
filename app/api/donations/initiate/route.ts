import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// Paystack configuration
const PAYSTACK_BASE_URL = 'https://api.paystack.co'
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

if (!PAYSTACK_SECRET_KEY) {
  throw new Error('PAYSTACK_SECRET_KEY environment variable is required')
}

export async function POST(request: NextRequest) {
  try {
    const { amount, email, name, anonymous } = await request.json()

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid donation amount' },
        { status: 400 }
      )
    }

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      )
    }

    // Convert Naira to kobo (Paystack expects amount in kobo)
    const amountInKobo = Math.round(amount * 100)

    // Prepare Paystack payment data
    const paystackData = {
      email,
      amount: amountInKobo,
      currency: 'NGN',
      reference: `DONATION_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        custom_fields: [
          {
            display_name: 'Donor Name',
            variable_name: 'donor_name',
            value: name
          },
          {
            display_name: 'Donation Type',
            variable_name: 'donation_type',
            value: 'seed_funding'
          }
        ]
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/support/success`,
      channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']
    }

    // Initialize Paystack payment
    const paystackResponse = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paystackData)
    })

    const paystackResult = await paystackResponse.json()

    if (!paystackResponse.ok || !paystackResult.status) {
      console.error('Paystack initialization failed:', paystackResult)
      return NextResponse.json(
        { error: `Payment initialization failed: ${paystackResult.message}` },
        { status: 400 }
      )
    }

    // Store donation record in database
    const supabase = createServerClient()
    const { error: dbError } = await supabase
      .from('donations')
      .insert({
        email,
        donor_name: name,
        amount,
        amount_kobo: amountInKobo,
        paystack_reference: paystackResult.data.reference,
        status: 'pending',
        donation_type: 'seed_funding',
        anonymous: anonymous || false,
        created_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('Database error:', dbError)
      // Don't fail the request if database insert fails
    }

    return NextResponse.json({
      success: true,
      payment_url: paystackResult.data.authorization_url,
      reference: paystackResult.data.reference,
      amount: amount,
      message: 'Donation initialized successfully'
    })

  } catch (error) {
    console.error('Donation initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate donation' },
      { status: 500 }
    )
  }
}
