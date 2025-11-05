import nodemailer from 'nodemailer';

// Create Brevo SMTP transporter
export function createTransporter() {
  const hasUser = !!process.env.BREVO_SMTP_USER
  const hasPass = !!process.env.BREVO_SMTP_PASS
  
  if (!hasUser || !hasPass) {
    console.warn('⚠️ Brevo SMTP credentials not configured - email sending will be disabled');
    console.warn(`   BREVO_SMTP_USER: ${hasUser ? '✅ Set' : '❌ Missing'}`);
    console.warn(`   BREVO_SMTP_PASS: ${hasPass ? '✅ Set' : '❌ Missing'}`);
    return null;
  }
  
  // Use a proper sender email address
  const senderEmail = process.env.SENDER_EMAIL || 'noreply@thequietherapy.live';
  
  console.log('📧 Creating SMTP transporter with Brevo...');
  console.log(`   Host: smtp-relay.brevo.com`);
  console.log(`   Port: 587`);
  console.log(`   User: ${process.env.BREVO_SMTP_USER?.substring(0, 10)}...`);
  console.log(`   Sender: ${senderEmail}`);
  
  return nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    },
    // Add connection timeout and greetingTimeout to speed up failures
    connectionTimeout: 5000, // 5 seconds
    greetingTimeout: 5000, // 5 seconds
    socketTimeout: 10000, // 10 seconds
  });
}

export async function sendVerificationEmail(email: string, token: string) {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.warn('Email transporter not available - skipping email send');
    return { success: false, error: 'Email service not configured' };
  }
  
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/auth/verify-email?email=${email}&token=${token}`;
  
  const senderEmail = process.env.SENDER_EMAIL || 'noreply@thequietherapy.live';
  
  const mailOptions = {
    from: `The Quiet Therapy <${senderEmail}>`,
    to: email,
    subject: 'Welcome to The Quiet Therapy - Access Your Dashboard',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Welcome to Quiet!</h2>
        <p>Your account has been created successfully! Click the button below to access your dashboard and start your therapy journey:</p>
        <a href="${verificationUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          🚀 Access Your Dashboard
        </a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
        <p>From your dashboard, you can:</p>
        <ul style="color: #6b7280;">
          <li>Book therapy sessions</li>
          <li>Manage your appointments</li>
          <li>Track your progress</li>
          <li>Access your credits and packages</li>
        </ul>
        <p>Best regards,<br>The Quiet Team</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.warn('Email transporter not available - skipping email send');
    return { success: false, error: 'Email service not configured' };
  }
  
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/reset-password?token=${token}`;
  
  const senderEmail = process.env.SENDER_EMAIL || 'noreply@thequietherapy.live';
  
  const mailOptions = {
    from: `The Quiet Therapy <${senderEmail}>`,
    to: email,
    subject: 'Reset your The Quiet Therapy password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Password Reset Request</h2>
        <p>You requested to reset your password. Click the button below to create a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Reset Password
        </a>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <p>Best regards,<br>The Quiet Team</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

export async function sendMagicLinkEmail(email: string, verificationUrl: string, type: 'booking' | 'login' | 'signup', metadata?: any) {
  console.log('📧 sendMagicLinkEmail called with:', { email, verificationUrl, type, metadata });
  
  const transporter = createTransporter();
  console.log('📧 Transporter created:', !!transporter);
  
  if (!transporter) {
    console.warn('Email transporter not available - logging magic link instead');
    console.log('🔗 MAGIC LINK FOR TESTING:');
    console.log('Email:', email);
    console.log('URL:', verificationUrl);
    console.log('Type:', type);
    console.log('Metadata:', metadata);
    console.log('🔗 END MAGIC LINK');
    return { success: true, error: 'Email service not configured - link logged to console' };
  }
  
  let subject = '';
  let title = '';
  let description = '';
  
  // Determine user type for specific messaging
  const userType = metadata?.user_type || 'individual';
  
  switch (type) {
    case 'booking':
      subject = 'Confirm Your Therapy Session Booking';
      title = 'Confirm Your Booking';
      description = `Hi ${metadata?.first_name || 'there'}, your therapy session has been booked successfully! Click the link below to confirm your details and access your dashboard:`;
      break;
    case 'login':
      if (userType === 'therapist') {
        subject = 'Login to Your Quiet Therapist Dashboard';
        title = 'Login to Therapist Dashboard';
        description = 'Click the link below to securely log in to your Quiet therapist dashboard:';
      } else if (userType === 'partner') {
        subject = 'Login to Your Quiet Partner Portal';
        title = 'Login to Partner Portal';
        description = 'Click the link below to securely log in to your Quiet partner portal:';
      } else {
        subject = 'Login to Your Quiet Account';
        title = 'Login to Quiet';
        description = 'Click the link below to securely log in to your Quiet account:';
      }
      break;
    case 'signup':
      if (userType === 'therapist') {
        subject = 'Welcome to Quiet - Complete Your Therapist Registration';
        title = 'Welcome to Quiet!';
        description = `Hi ${metadata?.first_name || 'there'}, welcome to Quiet! Click the link below to complete your therapist registration and access your professional dashboard:`;
      } else if (userType === 'partner') {
        subject = 'Welcome to The Quiet Therapy - Complete Your Partner Onboarding';
        title = 'Welcome to The Quiet Therapy!';
        description = `Hi ${metadata?.first_name || 'there'}, welcome to The Quiet Therapy! Click the link below to complete your partner onboarding and access your organization dashboard:`;
      } else {
        subject = 'Welcome to The Quiet Therapy - Confirm Your Account';
        title = 'Welcome to The Quiet Therapy!';
        description = `Hi ${metadata?.first_name || 'there'}, welcome to The Quiet Therapy! Click the link below to confirm your account and start your therapy journey:`;
      }
      break;
  }
  
  const senderEmail = process.env.SENDER_EMAIL || 'noreply@thequietherapy.live';
  
  const mailOptions = {
    from: `The Quiet Therapy <${senderEmail}>`,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">${title}</h2>
        <p>${description}</p>
        <a href="${verificationUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          ${type === 'booking' ? 'Confirm & Access Dashboard' : 
            type === 'login' ? (userType === 'therapist' ? 'Login to Therapist Dashboard' : userType === 'partner' ? 'Login to Partner Portal' : 'Login to Account') : 
            userType === 'therapist' ? 'Complete Therapist Registration' : userType === 'partner' ? 'Complete Partner Onboarding' : 'Confirm Account'}
        </a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>The Quiet Team</p>
      </div>
    `,
  };

  try {
    // Add timeout to prevent hanging - shorter in development
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const timeoutDuration = isDevelopment ? 5000 : 15000; // 5 seconds in dev, 15 in prod
    
    console.log('📤 Attempting to send email...');
    console.log(`   To: ${email}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Timeout: ${timeoutDuration}ms`);
    
    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email send timeout')), timeoutDuration)
    );
    
    const info = await Promise.race([sendPromise, timeoutPromise]) as any;
    console.log('✅ Magic link email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response || 'N/A'}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('❌ Failed to send magic link email');
    
    // Log detailed error information
    if (error.code) {
      console.error(`   Error Code: ${error.code}`);
    }
    if (error.command) {
      console.error(`   Command: ${error.command}`);
    }
    if (error.response) {
      console.error(`   SMTP Response: ${error.response}`);
    }
    if (error.responseCode) {
      console.error(`   Response Code: ${error.responseCode}`);
    }
    if (error.message) {
      console.error(`   Error Message: ${error.message}`);
    }
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    
    // In development, always log the magic link prominently
    const isDevelopment = process.env.NODE_ENV !== 'production';
    if (isDevelopment) {
      console.log('\n');
      console.log('═══════════════════════════════════════════════════════');
      console.log('🔗 MAGIC LINK FOR DEVELOPMENT (Click to access):');
      console.log('═══════════════════════════════════════════════════════');
      console.log('Email:', email);
      console.log('Link:', verificationUrl);
      console.log('Type:', type);
      console.log('═══════════════════════════════════════════════════════');
      console.log('\n');
    } else {
      // Always log the magic link when email fails so users can still access it
      console.log('🔗 MAGIC LINK (Email failed - use this link directly):');
      console.log('Email:', email);
      console.log('URL:', verificationUrl);
      console.log('Type:', type);
      console.log('Metadata:', metadata);
      console.log('🔗 END MAGIC LINK');
    }
    
    // Return the magic link in development mode so frontend can display it
    return { 
      success: isDevelopment, // In dev, treat as success if we logged the link
      error: isDevelopment ? `Email timeout/error: ${error.message || 'Connection failed'}` : 'Failed to send email',
      magicLink: isDevelopment ? verificationUrl : undefined
    };
  }
}

/**
 * Send booking confirmation email to user
 */
export async function sendBookingConfirmationToUser(
  userEmail: string,
  userName: string,
  therapistName: string,
  sessionDate: string,
  sessionTime: string,
  duration: number,
  sessionType: string,
  sessionUrl?: string,
  calendarIcs?: string
) {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.warn('Email transporter not available - skipping booking confirmation email');
    return { success: false, error: 'Email service not configured' };
  }
  
  const senderEmail = process.env.SENDER_EMAIL || 'noreply@thequietherapy.live';
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/dashboard/sessions`;
  
  // Format date and time nicely
  const dateObj = new Date(sessionDate);
  const formattedDate = dateObj.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = new Date(`2000-01-01T${sessionTime}`).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  const mailOptions = {
    from: `The Quiet Therapy <${senderEmail}>`,
    to: userEmail,
    subject: `✅ Your Therapy Session is Confirmed - ${formattedDate}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">✅ Session Confirmed!</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hi ${userName},
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Your therapy session has been successfully booked! We're excited to support you on your journey.
          </p>
          
          <div style="background: white; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3 style="color: #1f2937; margin-top: 0;">Session Details</h3>
            <table style="width: 100%; color: #374151;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Therapist:</td>
                <td style="padding: 8px 0;">${therapistName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Date:</td>
                <td style="padding: 8px 0;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Time:</td>
                <td style="padding: 8px 0;">${formattedTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Duration:</td>
                <td style="padding: 8px 0;">${duration} minutes</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Type:</td>
                <td style="padding: 8px 0; text-transform: capitalize;">${sessionType}</td>
              </tr>
            </table>
          </div>
          
          ${sessionUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${sessionUrl}" style="display: inline-block; background-color: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px;">
              🎥 Join Session Room
            </a>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="display: inline-block; background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px;">
              📅 View in Dashboard
            </a>
          </div>
          
          ${calendarIcs ? `
          <div style="text-align: center; margin: 20px 0;">
            <a href="data:text/calendar;charset=utf-8,${encodeURIComponent(calendarIcs)}" download="therapy-session.ics" style="display: inline-block; background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px;">
              📆 Add to Calendar
            </a>
            <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
              Click to add this session to your calendar app and set a reminder to check your dashboard
            </p>
          </div>
          ` : ''}
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              <strong>💡 Reminder:</strong> Please check your dashboard before the session to access the meeting room and any important updates.
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you need to reschedule or cancel, please visit your dashboard or contact us.
          </p>
          
          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>
            <strong>The Quiet Therapy Team</strong>
          </p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Booking confirmation email sent to user:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send booking confirmation email to user:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send booking confirmation email to therapist
 */
export async function sendBookingConfirmationToTherapist(
  therapistEmail: string,
  therapistName: string,
  userName: string,
  userEmail: string,
  sessionDate: string,
  sessionTime: string,
  duration: number,
  sessionType: string,
  notes?: string,
  sessionUrl?: string,
  calendarIcs?: string
) {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.warn('Email transporter not available - skipping booking confirmation email');
    return { success: false, error: 'Email service not configured' };
  }
  
  const senderEmail = process.env.SENDER_EMAIL || 'noreply@thequietherapy.live';
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/therapist/dashboard/sessions`;
  
  // Format date and time nicely
  const dateObj = new Date(sessionDate);
  const formattedDate = dateObj.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = new Date(`2000-01-01T${sessionTime}`).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  const mailOptions = {
    from: `The Quiet Therapy <${senderEmail}>`,
    to: therapistEmail,
    subject: `📅 New Session Booking - ${userName} - ${formattedDate}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">📅 New Session Booking</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hi ${therapistName},
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            You have a new therapy session booked. Please review the details below.
          </p>
          
          <div style="background: white; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3 style="color: #1f2937; margin-top: 0;">Session Details</h3>
            <table style="width: 100%; color: #374151;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Client:</td>
                <td style="padding: 8px 0;">${userName} (${userEmail})</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Date:</td>
                <td style="padding: 8px 0;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Time:</td>
                <td style="padding: 8px 0;">${formattedTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Duration:</td>
                <td style="padding: 8px 0;">${duration} minutes</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Type:</td>
                <td style="padding: 8px 0; text-transform: capitalize;">${sessionType}</td>
              </tr>
              ${notes ? `
              <tr>
                <td style="padding: 8px 0; font-weight: 600; vertical-align: top;">Notes:</td>
                <td style="padding: 8px 0;">${notes}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          ${sessionUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${sessionUrl}" style="display: inline-block; background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px;">
              🎥 Join Session Room
            </a>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="display: inline-block; background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px;">
              📋 View in Dashboard
            </a>
          </div>
          
          ${calendarIcs ? `
          <div style="text-align: center; margin: 20px 0;">
            <a href="data:text/calendar;charset=utf-8,${encodeURIComponent(calendarIcs)}" download="therapy-session.ics" style="display: inline-block; background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px;">
              📆 Add to Calendar
            </a>
            <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
              Click to add this session to your calendar app and set a reminder to check your dashboard
            </p>
          </div>
          ` : ''}
          
          <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="color: #1e40af; margin: 0; font-size: 14px;">
              <strong>💡 Reminder:</strong> Please check your dashboard before the session to access the meeting room and review client information.
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            <strong>The Quiet Therapy Team</strong>
          </p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Booking confirmation email sent to therapist:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send booking confirmation email to therapist:', error);
    return { success: false, error: 'Failed to send email' };
  }
}
