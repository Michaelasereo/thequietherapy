import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, processWebhook } from "@/lib/paystack-enhanced";

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const rawBody = await request.text();
    
    // Get the signature from headers
    const signature = request.headers.get('x-paystack-signature');
    
    if (!signature) {
      console.error('Missing Paystack signature in webhook');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const isValidSignature = verifyWebhookSignature(rawBody, signature);
    
    if (!isValidSignature) {
      console.error('Invalid Paystack webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse the webhook data
    let webhookData;
    try {
      webhookData = JSON.parse(rawBody);
    } catch (error) {
      console.error('Invalid JSON in webhook payload:', error);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Validate webhook structure
    if (!webhookData.event || !webhookData.data) {
      console.error('Invalid webhook structure:', webhookData);
      return NextResponse.json(
        { error: 'Invalid webhook structure' },
        { status: 400 }
      );
    }

    console.log(`Processing webhook: ${webhookData.event} for reference: ${webhookData.data.reference}`);

    // Process the webhook
    const success = await processWebhook(webhookData);

    if (success) {
      return NextResponse.json({ status: 'success' });
    } else {
      return NextResponse.json(
        { error: 'Webhook processing failed' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests (for webhook verification)
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { message: 'Paystack webhook endpoint is active' },
    { status: 200 }
  );
}
