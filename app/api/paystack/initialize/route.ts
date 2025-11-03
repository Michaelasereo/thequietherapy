import { NextRequest, NextResponse } from "next/server";
import { initializePayment, generatePaymentReference } from "@/lib/paystack-enhanced";
import { ServerSessionManager } from "@/lib/server-session-manager";

export async function POST(request: NextRequest) {
  try {
    // Check if Paystack is configured
    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.error('❌ PAYSTACK_SECRET_KEY not configured');
      return NextResponse.json(
        { 
          success: false,
          error: 'Payment system is not configured. Please contact support.',
          shouldRetry: false
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { 
      amount, 
      email, 
      reference, 
      callback_url, 
      metadata,
      package_id,
      user_id: providedUserId,
      user_type: providedUserType = 'user'
    } = body;

    // Try to get logged-in user from session (if available)
    let sessionUserId = providedUserId;
    let sessionUserType = providedUserType;
    
    try {
      const session = await ServerSessionManager.getSession();
      if (session?.id) {
        sessionUserId = session.id;
        sessionUserType = session.role || providedUserType;
        console.log(`✅ Found logged-in user in session: ${sessionUserId}`);
      }
    } catch (sessionError) {
      // Not logged in - that's okay, continue with provided or null user_id
      console.log('ℹ️ No logged-in session found (guest user or not authenticated)');
    }

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
        ...(sessionUserId && { user_id: sessionUserId }), // Only include if user is logged in
        user_type: sessionUserType,
        package_id,
        source: 'trpi_platform',
        timestamp: new Date().toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent')
      }
    };

    console.log(`🔐 Initializing payment: ${paymentReference} for ${email}, Amount: ${amount} NGN`);

    // Initialize payment with Paystack
    const result = await initializePayment(paymentData);

    if (!result.success) {
      console.error('❌ Payment initialization failed:', {
        error: result.error,
        shouldRetry: result.shouldRetry,
        reference: paymentReference,
        email: email,
        amount: amount
      });
      
      return NextResponse.json(
        { 
          success: false,
          error: result.error || 'Payment initialization failed',
          shouldRetry: result.shouldRetry || false
        },
        { status: 400 }
      );
    }

    // Validate that authorization URL exists
    if (!result.data || !result.data.authorization_url) {
      console.error('❌ Missing authorization_url in Paystack response:', result);
      return NextResponse.json(
        {
          success: false,
          error: 'Payment gateway did not return a valid payment URL',
          shouldRetry: false
        },
        { status: 500 }
      );
    }

    console.log('✅ Payment initialized successfully:', {
      reference: paymentReference,
      hasAuthorizationUrl: !!result.data.authorization_url
    });

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
