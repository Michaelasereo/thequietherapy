import { NextRequest, NextResponse } from "next/server";
import { verifyPayment } from "@/lib/paystack-enhanced";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    const trxref = searchParams.get('trxref');

    // Use either reference or trxref (Paystack sends both)
    const paymentReference = reference || trxref;

    if (!paymentReference) {
      console.error('Payment reference not found in verification request');
      return NextResponse.json(
        { error: "Payment reference not found" },
        { status: 400 }
      );
    }

    console.log(`Verifying payment: ${paymentReference}`);

    // Verify payment with retry logic
    let result;
    let retryCount = 0;
    const maxRetries = 3;

    do {
      result = await verifyPayment(paymentReference, retryCount);
      
      if (result.success || !result.shouldRetry) {
        break;
      }
      
      retryCount++;
      if (retryCount < maxRetries) {
        console.log(`Retrying payment verification for ${paymentReference} (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // Exponential backoff
      }
    } while (retryCount < maxRetries);

    if (!result.success) {
      console.error(`Payment verification failed after ${retryCount} attempts:`, result.error);
      
      // Redirect to failure page
      const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/dashboard?payment=failed&reference=${paymentReference}&error=${encodeURIComponent(result.error || 'Verification failed')}`;
      return NextResponse.redirect(redirectUrl);
    }

    const paymentData = result.data;

    // Determine redirect URL based on payment type
    let redirectUrl;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    
    if (paymentData.status === 'success') {
      const metadata = paymentData.metadata || {};
      
      if (metadata.type === 'credits') {
        // Credit purchase success
        redirectUrl = `${baseUrl}/dashboard?payment=success&type=credits&credits=${metadata.credits}&reference=${paymentReference}`;
      } else if (metadata.type === 'session') {
        // Session booking success
        redirectUrl = `${baseUrl}/dashboard?payment=success&type=session&session_id=${metadata.session_id}&reference=${paymentReference}`;
      } else {
        // Generic success
        redirectUrl = `${baseUrl}/dashboard?payment=success&reference=${paymentReference}`;
      }
    } else {
      // Payment failed
      redirectUrl = `${baseUrl}/dashboard?payment=failed&reference=${paymentReference}&status=${paymentData.status}`;
    }

    console.log(`Payment verification completed for ${paymentReference}, redirecting to: ${redirectUrl}`);
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Payment verification error:', error);
    
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/dashboard?payment=error&error=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`;
    return NextResponse.redirect(redirectUrl);
  }
}

// Handle POST requests for manual verification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference } = body;

    if (!reference) {
      return NextResponse.json(
        { error: "Payment reference is required" },
        { status: 400 }
      );
    }

    console.log(`Manual payment verification: ${reference}`);

    const result = await verifyPayment(reference);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          error: result.error,
          shouldRetry: result.shouldRetry
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Manual payment verification error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
