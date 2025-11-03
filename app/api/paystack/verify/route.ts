import { NextRequest, NextResponse } from "next/server";
import { verifyPayment } from "@/lib/paystack-enhanced";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
        // Credit purchase success - Add credits to user account
        try {
          const userId = metadata.user_id;
          const creditsToAdd = metadata.credits || 1;
          const amountNaira = metadata.amount_naira || (paymentData.amount / 100);
          
          console.log(`✅ Processing credit purchase: ${creditsToAdd} credits for user ${userId}`);
          
          // Add credits to user account
          const { error: creditError } = await supabase
            .from('user_credits')
            .insert({
              user_id: userId,
              user_type: metadata.user_type || 'individual',
              credits_balance: creditsToAdd,
              credits_purchased: creditsToAdd,
              credits_used: 0,
              credits_expired: 0,
              amount_paid_kobo: paymentData.amount, // amount is in kobo from Paystack
              payment_reference: paymentReference,
              status: 'active',
              expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (creditError) {
            console.error('❌ Error adding credits:', creditError);
            // Continue anyway - redirect to dashboard with error message
            redirectUrl = `${baseUrl}/dashboard/credits?payment=success&error=credits_pending&reference=${paymentReference}`;
          } else {
            console.log(`✅ Successfully added ${creditsToAdd} credits to user ${userId}`);
            
            // Create payment record
            await supabase
              .from('payments')
              .insert({
                user_id: userId,
                package_type: metadata.package_id || 'custom',
                amount_kobo: paymentData.amount,
                payment_reference: paymentReference,
                paystack_reference: paymentReference,
                status: 'success',
                payment_method: paymentData.channel || 'card',
                gateway_response: paymentData,
                created_at: new Date().toISOString()
              });
            
            redirectUrl = `${baseUrl}/dashboard/credits?payment=success&type=credits&credits=${creditsToAdd}&reference=${paymentReference}`;
          }
        } catch (creditProcessingError) {
          console.error('❌ Error processing credit purchase:', creditProcessingError);
          // Redirect anyway - webhook will handle it
          redirectUrl = `${baseUrl}/dashboard/credits?payment=success&error=processing&reference=${paymentReference}`;
        }
      } else if (metadata.type === 'package_purchase') {
        // Package purchase - handle both logged-in users and guests
        const userId = metadata.user_id;
        const isLoggedInUser = !!userId;
        
        if (isLoggedInUser) {
          // Logged-in user purchasing package - add credits
          try {
            const creditsToAdd = metadata.sessions_included || 1;
            
            console.log(`✅ Processing package purchase for logged-in user: ${creditsToAdd} credits for user ${userId}`);
            
            // Add credits to user account
            const { error: creditError } = await supabase
              .from('user_credits')
              .insert({
                user_id: userId,
                user_type: metadata.user_type || 'individual',
                credits_balance: creditsToAdd,
                credits_purchased: creditsToAdd,
                credits_used: 0,
                credits_expired: 0,
                amount_paid_kobo: paymentData.amount, // amount is in kobo from Paystack
                payment_reference: paymentReference,
                status: 'active',
                expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            if (creditError) {
              console.error('❌ Error adding credits:', creditError);
              redirectUrl = `${baseUrl}/dashboard/credits?payment=success&error=credits_pending&reference=${paymentReference}`;
            } else {
              console.log(`✅ Successfully added ${creditsToAdd} credits to user ${userId}`);
              
              // Create payment record
              await supabase
                .from('payments')
                .insert({
                  user_id: userId,
                  package_type: metadata.package_type || 'custom',
                  amount_kobo: paymentData.amount,
                  payment_reference: paymentReference,
                  paystack_reference: paymentReference,
                  status: 'success',
                  payment_method: paymentData.channel || 'card',
                  gateway_response: paymentData,
                  created_at: new Date().toISOString()
                });
              
              // Redirect based on whether this was for booking
              if (metadata.therapistId && metadata.timeSlotId) {
                // Package purchase during booking - redirect to dashboard/book where BookingConfirmation component will handle it
                redirectUrl = `${baseUrl}/dashboard/book?payment=success&credits=${creditsToAdd}&reference=${paymentReference}&therapistId=${metadata.therapistId}&timeSlotId=${metadata.timeSlotId}`;
              } else {
                // Just credit purchase
                redirectUrl = `${baseUrl}/dashboard/credits?payment=success&type=package&credits=${creditsToAdd}&reference=${paymentReference}`;
              }
            }
          } catch (creditProcessingError) {
            console.error('❌ Error processing package purchase:', creditProcessingError);
            redirectUrl = `${baseUrl}/dashboard/credits?payment=success&error=processing&reference=${paymentReference}`;
          }
        } else {
          // Guest user - create credits and send verification email
          try {
            const packageResponse = await fetch(`${baseUrl}/api/bookings/create-guest-booking`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                patientData: metadata.patientData,
                therapistId: metadata.therapistId,
                slot: {
                  id: metadata.timeSlotId,
                  date: metadata.sessionDate,
                  start_time: metadata.sessionTime,
                  session_duration: 60, // Default duration
                },
                packageData: {
                  package_type: metadata.package_type,
                  sessions_included: metadata.sessions_included,
                  amount_paid: paymentData.amount,
                },
              }),
            });
            
            const packageResult = await packageResponse.json();
            console.log('Guest package purchase processed:', packageResult);
          } catch (packageError) {
            console.error('Error processing guest package purchase:', packageError);
          }
          
          // Redirect to book-session success page
          redirectUrl = `${baseUrl}/book-session?payment=success&email=${encodeURIComponent(metadata.patientData?.email || '')}`;
        }
      } else if (metadata.type === 'session_booking') {
        // Session booking from guest user - create booking and send verification email
        try {
          const bookingResponse = await fetch(`${baseUrl}/api/bookings/create-guest-booking`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patientData: metadata.patientData,
              therapistId: metadata.therapistId,
              slot: {
                id: metadata.timeSlotId,
                date: metadata.sessionDate,
                start_time: metadata.sessionTime,
                session_duration: 60, // Default duration
              },
            }),
          });
          
          const bookingResult = await bookingResponse.json();
          console.log('Guest booking created:', bookingResult);
        } catch (bookingError) {
          console.error('Error creating guest booking after payment:', bookingError);
        }
        
        // Redirect to book-session success page
        redirectUrl = `${baseUrl}/book-session?payment=success&email=${encodeURIComponent(metadata.patientData?.email || '')}`;
      } else if (metadata.type === 'session') {
        // Session booking success (for logged-in users)
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
