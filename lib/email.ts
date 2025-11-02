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
