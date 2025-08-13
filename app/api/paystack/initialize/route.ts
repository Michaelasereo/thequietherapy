import { NextRequest, NextResponse } from "next/server";
import { initializePayment, formatAmount } from "@/lib/paystack";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, email, reference, callback_url, metadata } = body;

    if (!amount || !email || !reference) {
      return NextResponse.json(
        { error: "Missing required fields: amount, email, reference" },
        { status: 400 }
      );
    }

    const paymentData = {
      amount: formatAmount(amount), // Convert to kobo
      email,
      reference,
      callback_url: callback_url || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/paystack/verify`,
      metadata
    };

    const result = await initializePayment(paymentData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
