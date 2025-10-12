import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { patientData, therapistId, slot, packageData } = await request.json()

    // Validate required fields
    if (!patientData?.email || !patientData?.firstName) {
      return NextResponse.json(
        { success: false, error: 'Missing required patient data' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Generate verification token
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store the booking data in magic_links table with metadata
    const { error: magicLinkError } = await supabase
      .from('magic_links')
      .insert({
        email: patientData.email.toLowerCase(),
        token,
        expires_at: expiresAt.toISOString(),
        metadata: {
          first_name: patientData.firstName,
          user_type: 'individual',
          booking_data: {
            patientData,
            therapistId,
            slot,
            packageData,
            createdAt: new Date().toISOString(),
          }
        }
      })

    if (magicLinkError) {
      console.error('Error creating magic link:', magicLinkError)
      return NextResponse.json(
        { success: false, error: 'Failed to create verification link' },
        { status: 500 }
      )
    }

    // If this is a package purchase, create the credits now (they'll be linked to the user after email verification)
    if (packageData) {
      try {
        console.log('Creating package purchase record for guest user...')
        
        // Create a temporary user record for the package purchase
        const { data: tempUser, error: tempUserError } = await supabase
          .from('users')
          .insert({
            email: patientData.email.toLowerCase(),
            full_name: patientData.firstName,
            user_type: 'individual',
            is_verified: false,
            is_active: false,
            temp_for_package: true, // Flag to indicate this is temporary for package purchase
          })
          .select()
          .single()

        if (tempUserError) {
          console.error('Error creating temp user:', tempUserError)
        } else if (tempUser) {
          // Create the package purchase record
          const { error: purchaseError } = await supabase
            .from('user_purchases')
            .insert({
              user_id: tempUser.id,
              package_type: packageData.package_type,
              sessions_credited: packageData.sessions_included,
              amount_paid: packageData.amount_paid,
              session_duration_minutes: 35, // All packages are 35 minutes
            })

          if (purchaseError) {
            console.error('Error creating package purchase:', purchaseError)
          } else {
            // Create the individual credits
            const { error: creditsError } = await supabase
              .from('user_session_credits')
              .insert(
                Array(packageData.sessions_included).fill(null).map(() => ({
                  user_id: tempUser.id,
                  purchase_id: tempUser.id, // We'll update this after the purchase is created
                  session_duration_minutes: 35,
                  is_free_credit: false,
                }))
              )

            if (creditsError) {
              console.error('Error creating credits:', creditsError)
            }
          }
        }
      } catch (packageError) {
        console.error('Error processing package purchase:', packageError)
      }
    }

    // Send verification email using Brevo (already set up in the app)
    try {
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify-email?email=${encodeURIComponent(patientData.email)}&token=${token}`
      
      const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY || '',
        },
        body: JSON.stringify({
          sender: {
            name: 'Quiet',
            email: process.env.BREVO_SENDER_EMAIL || 'noreply@quiet.com',
          },
          to: [
            {
              email: patientData.email,
              name: patientData.firstName,
            },
          ],
          subject: 'Verify Your Email - Your Therapy Session is Booked!',
          htmlContent: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #1a1a1a; margin: 0;">Quiet</h1>
                  </div>
                  
                  <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="color: #22c55e; margin-top: 0;">🎉 Payment Successful!</h2>
                    
                    <p>Hi ${patientData.firstName},</p>
                    
                    <p>Great news! Your therapy session has been booked successfully. To access your session details and dashboard, please verify your email address.</p>
                    
                    ${packageData ? `
                    <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
                      <h3 style="color: #1e40af; margin-top: 0;">Package Purchased</h3>
                      <p style="margin: 10px 0;"><strong>Package:</strong> ${packageData.package_type === 'single' ? 'Pay-As-You-Go' : packageData.package_type === 'bronze' ? 'Bronze Pack' : packageData.package_type === 'silver' ? 'Silver Pack' : 'Gold Pack'}</p>
                      <p style="margin: 10px 0;"><strong>Credits:</strong> ${packageData.sessions_included} session credits</p>
                      <p style="margin: 10px 0;"><strong>Amount:</strong> ₦${(packageData.amount_paid / 100).toLocaleString()}</p>
                    </div>
                    ` : ''}
                    ${slot ? `
                    <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
                      <h3 style="color: #1e40af; margin-top: 0;">Session Details</h3>
                      <p style="margin: 10px 0;"><strong>Date:</strong> ${slot.date}</p>
                      <p style="margin: 10px 0;"><strong>Time:</strong> ${slot.start_time}</p>
                      <p style="margin: 10px 0;"><strong>Duration:</strong> ${slot.session_duration || 35} minutes</p>
                    </div>
                    ` : ''}
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${verificationUrl}" style="background-color: #3b82f6; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                        Verify Email & Access Dashboard
                      </a>
                    </div>
                    
                    <div style="background-color: #fef9c3; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #facc15;">
                      <p style="margin: 0; font-size: 14px;"><strong>What happens next?</strong></p>
                      <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px;">
                        <li>Click the button above to verify your email</li>
                        <li>Access your dashboard to view your credits and session details</li>
                        ${packageData ? `<li>Use your ${packageData.sessions_included} session credits to book appointments</li>` : ''}
                        ${slot ? '<li>Join your session at the scheduled time</li>' : ''}
                      </ul>
                    </div>
                    
                    <p style="font-size: 14px; color: #666; margin-top: 25px;">
                      This link will expire in 24 hours. If you didn't book this session, please ignore this email.
                    </p>
                    
                    <p style="font-size: 14px; color: #666;">
                      If the button doesn't work, copy and paste this link into your browser:<br>
                      <a href="${verificationUrl}" style="color: #3b82f6; word-break: break-all;">${verificationUrl}</a>
                    </p>
                  </div>
                  
                  <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
                    <p>© ${new Date().getFullYear()} Quiet. All rights reserved.</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        }),
      })

      if (!brevoResponse.ok) {
        console.error('Failed to send email via Brevo')
        // Don't fail the request, just log the error
      }
    } catch (emailError) {
      console.error('Error sending verification email:', emailError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      message: 'Booking created successfully. Please check your email to verify your account.',
    })

  } catch (error) {
    console.error('Error creating guest booking:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

