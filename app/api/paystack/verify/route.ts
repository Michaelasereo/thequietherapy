import { NextRequest, NextResponse } from "next/server";
import { verifyPayment } from "@/lib/paystack";
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    const trxref = searchParams.get('trxref');

    // Use either reference or trxref (Paystack sends both)
    const paymentReference = reference || trxref;

    if (!paymentReference) {
      return NextResponse.json(
        { error: "Payment reference not found" },
        { status: 400 }
      );
    }

    const result = await verifyPayment(paymentReference);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    const paymentData = result.data;

    // Check if payment was successful
    if (paymentData.status === 'success') {
      // Update user credits or session booking based on metadata
      const metadata = paymentData.metadata;
      
      if (metadata?.type === 'credits') {
        // Handle credit purchase
        await handleCreditPurchase(paymentData);
      } else if (metadata?.type === 'session') {
        // Handle session booking
        await handleSessionBooking(paymentData);
      }
    }

    // Redirect to success page or dashboard
    const redirectUrl = paymentData.status === 'success' 
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?payment=success`
      : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?payment=failed`;

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?payment=error`
    );
  }
}

async function handleCreditPurchase(paymentData: any) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { credits, userId } = paymentData.metadata;

  // Update user credits
  const { error } = await supabase
    .from('users')
    .update({ 
      credits: supabase.rpc('increment', { credits }),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user credits:', error);
  }
}

async function handleSessionBooking(paymentData: any) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { therapistId, createSession } = paymentData.metadata;

  if (createSession) {
    // Create a new session after successful payment
    const sessionData = {
      user_id: 'cde3ab4a-7bdf-46df-a704-b4df29adba7a', // Mock user ID - replace with actual user
      therapist_id: therapistId,
      title: `Therapy Session with Therapist`,
      description: 'Therapy session booked via Paystack',
      scheduled_date: new Date().toISOString().split('T')[0], // Today's date
      scheduled_time: '10:00:00',
      duration_minutes: 60,
      status: 'confirmed',
      daily_room_name: `trpi-session-${Date.now()}`,
      daily_room_url: `https://thequietherapy.daily.co/trpi-session-${Date.now()}`
    };

    const { data: session, error } = await supabase
      .from('sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
    } else {
      console.log('Session created successfully:', session);
    }
  }
}
