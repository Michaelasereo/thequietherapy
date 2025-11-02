import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireApiAuth } from '@/lib/server-auth'
import { ValidationError, NotFoundError, successResponse, validateRequired } from '@/lib/api-response'
import crypto from 'crypto'
import { handleApiError } from '@/lib/app-error-handler'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Paystack configuration
const PAYSTACK_BASE_URL = 'https://api.paystack.co'
if (!process.env.PAYSTACK_SECRET_KEY) {
  throw new Error('PAYSTACK_SECRET_KEY environment variable is required')
}

interface PaymentInitiationRequest {
  package_type: string
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Payment initiation request received')
    
    // 1. SECURE Authentication Check
    console.log('🔍 Checking authentication...')
    const authResult = await requireApiAuth(['individual'])
    
    if ('error' in authResult) {
      console.error('❌ Authentication failed')
      // Return proper error response
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required. Please log in to continue.' 
        },
        { status: 401 }
      )
    }

    const { session } = authResult
    const userId = session.user.id
    const userEmail = session.user.email
    const userName = session.user.full_name
    
    console.log('✅ User authenticated:', { userId, userEmail })

    // 2. Parse and validate request
    const { package_type }: PaymentInitiationRequest = await request.json()
    validateRequired({ package_type }, ['package_type'])

    // 3. Get package details
    const { data: packageDef, error: packageError } = await supabase
      .from('package_definitions')
      .select('*')
      .eq('package_type', package_type)
      .eq('is_active', true)
      .single()

    if (packageError || !packageDef) {
      throw new NotFoundError(`Package '${package_type}' not found or inactive`)
    }

    // Don't allow purchasing free packages
    if (packageDef.price_kobo === 0) {
      throw new ValidationError('Cannot purchase free packages')
    }

    // 4. Create payment reference
    const paymentReference = `trpi_${package_type}_${userId.slice(0, 8)}_${Date.now()}`

    // 5. Prepare Paystack payment data
    const paystackData = {
      email: userEmail,
      amount: packageDef.price_kobo, // Paystack expects amount in kobo
      reference: paymentReference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/book?payment=success`,
      metadata: {
        user_id: userId,
        type: 'credits', // Mark as credit purchase
        package_type: package_type,
        sessions_included: packageDef.sessions_included,
        credits: packageDef.sessions_included, // Number of credits being purchased
        custom_fields: [
          {
            display_name: "Package",
            variable_name: "package_type",
            value: package_type
          },
          {
            display_name: "Sessions",
            variable_name: "sessions_included", 
            value: packageDef.sessions_included.toString()
          }
        ]
      },
      channels: ['card', 'bank', 'ussd', 'mobile_money'] // Payment methods for Nigerian users
    }

    console.log('🔗 Calling Paystack API with data:', {
      email: paystackData.email,
      amount: paystackData.amount,
      reference: paystackData.reference,
      hasSecretKey: !!process.env.PAYSTACK_SECRET_KEY
    })

    const paystackResponse = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paystackData)
    })

    const paystackResult = await paystackResponse.json()
    console.log('📦 Paystack API response:', {
      status: paystackResponse.status,
      ok: paystackResponse.ok,
      paystackStatus: paystackResult.status,
      hasData: !!paystackResult.data,
      hasAuthorizationUrl: !!paystackResult.data?.authorization_url,
      message: paystackResult.message
    })

    if (!paystackResponse.ok || !paystackResult.status) {
      console.error('❌ Paystack initialization failed:', {
        status: paystackResponse.status,
        statusText: paystackResponse.statusText,
        result: paystackResult
      })
      throw new Error(`PAYSTACK_INIT_ERROR: ${paystackResult.message || 'Payment initialization failed'}`)
    }

    if (!paystackResult.data?.authorization_url) {
      console.error('❌ Paystack response missing authorization_url:', paystackResult)
      throw new Error('Paystack did not return payment URL')
    }

    console.log('✅ Paystack payment initialized successfully:', paystackResult.data.reference)

    const { error: pendingPaymentError } = await supabase
      .from('pending_payments')    
      .insert({
        user_id: userId,
        package_type: package_type,
        amount_kobo: packageDef.price_kobo,
        payment_reference: paymentReference,
        paystack_reference: paystackResult.data.reference,
        status: 'pending',
        created_at: new Date().toISOString()
      })

    if (pendingPaymentError) {
      console.error('Error storing pending payment:', pendingPaymentError)
      // Don't throw - payment can still proceed
    }

    const responseData = {
      payment_url: paystackResult.data.authorization_url,
      payment_reference: paymentReference,
      amount_naira: packageDef.price_kobo / 100,
      package_name: packageDef.name,
      sessions_included: packageDef.sessions_included
    }
    return successResponse(responseData)

  } catch (error) {
    return handleApiError(error)
  }
}

// Add the pending_payments table to track payment status
/* 
CREATE TABLE pending_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    package_type TEXT NOT NULL,
    amount_kobo INTEGER NOT NULL,
    payment_reference TEXT NOT NULL UNIQUE,
    paystack_reference TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_pending_payments_user ON pending_payments(user_id);
CREATE INDEX idx_pending_payments_reference ON pending_payments(payment_reference);
CREATE INDEX idx_pending_payments_status ON pending_payments(status);
*/
