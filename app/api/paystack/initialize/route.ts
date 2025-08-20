import { NextRequest, NextResponse } from "next/server";
import { initializePayment, generatePaymentReference } from "@/lib/paystack-enhanced";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      amount, 
      email, 
      reference, 
      callback_url, 
      metadata,
      package_id,
      user_id,
      user_type = 'user'
    } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount provided" },
        { status: 400 }
      );
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Generate reference if not provided
    const paymentReference = reference || generatePaymentReference();
    
    // Validate amount limits (prevent abuse)
    if (amount > 1000000) { // 1 million Naira limit
      return NextResponse.json(
        { error: "Amount exceeds maximum limit" },
        { status: 400 }
      );
    }

    // Prepare payment data
    const paymentData = {
      amount,
      email,
      reference: paymentReference,
      callback_url: callback_url || `${process.env.NEXT_PUBLIC_APP_URL}/api/paystack/verify`,
      metadata: {
        ...metadata,
        user_id,
        user_type,
        package_id,
        source: 'trpi_platform',
        timestamp: new Date().toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent')
      }
    };

    console.log(`Initializing payment: ${paymentReference} for ${email}, Amount: ${amount} NGN`);

    // Initialize payment with Paystack
    const result = await initializePayment(paymentData);

    if (!result.success) {
      console.error('Payment initialization failed:', result.error);
      
      return NextResponse.json(
        { 
          error: result.error,
          shouldRetry: result.shouldRetry || false
        },
        { status: 400 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        ...result.data,
        reference: paymentReference,
        amount: amount,
        currency: 'NGN'
      }
    });

  } catch (error) {
    console.error('Payment initialization error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        shouldRetry: true
      },
      { status: 500 }
    );
  }
}
