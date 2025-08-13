import nodemailer from 'nodemailer';

// Create Brevo SMTP transporter
function createTransporter() {
  if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_PASS) {
    console.warn('Brevo SMTP credentials not configured - email sending will be disabled');
    return null;
  }
  
  // Use a proper sender email address
  const senderEmail = process.env.SENDER_EMAIL || 'noreply@trpi.com';
  
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
    }
  });
}

export async function sendVerificationEmail(email: string, token: string) {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.warn('Email transporter not available - skipping email send');
    return { success: false, error: 'Email service not configured' };
  }
  
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'}/api/auth/verify-email?email=${email}&token=${token}`;
  
  const senderEmail = process.env.SENDER_EMAIL || 'noreply@trpi.com';
  
  const mailOptions = {
    from: `Michael from Quiet  <${senderEmail}>`,
    to: email,
    subject: 'Welcome to Thequietherapy.live - Access Your Dashboard',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Welcome to Trpi!</h2>
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
        <p>Best regards,<br>The Trpi Team</p>
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
  
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'}/reset-password?token=${token}`;
  
  const senderEmail = process.env.SENDER_EMAIL || 'noreply@trpi.com';
  
  const mailOptions = {
    from: `Trpi <${senderEmail}>`,
    to: email,
    subject: 'Reset your Trpi password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Password Reset Request</h2>
        <p>You requested to reset your password. Click the button below to create a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Reset Password
        </a>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <p>Best regards,<br>The Trpi Team</p>
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
  const transporter = createTransporter();
  
  if (!transporter) {
    console.warn('Email transporter not available - skipping email send');
    return { success: false, error: 'Email service not configured' };
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
        subject = 'Login to Your Trpi Therapist Dashboard';
        title = 'Login to Therapist Dashboard';
        description = 'Click the link below to securely log in to your Trpi therapist dashboard:';
      } else if (userType === 'partner') {
        subject = 'Login to Your Trpi Partner Portal';
        title = 'Login to Partner Portal';
        description = 'Click the link below to securely log in to your Trpi partner portal:';
      } else {
        subject = 'Login to Your Trpi Account';
        title = 'Login to Trpi';
        description = 'Click the link below to securely log in to your Trpi account:';
      }
      break;
    case 'signup':
      if (userType === 'therapist') {
        subject = 'Welcome to Trpi - Complete Your Therapist Registration';
        title = 'Welcome to Trpi!';
        description = `Hi ${metadata?.first_name || 'there'}, welcome to Trpi! Click the link below to complete your therapist registration and access your professional dashboard:`;
      } else if (userType === 'partner') {
        subject = 'Welcome to Trpi - Complete Your Partner Onboarding';
        title = 'Welcome to Trpi!';
        description = `Hi ${metadata?.first_name || 'there'}, welcome to Trpi! Click the link below to complete your partner onboarding and access your organization dashboard:`;
      } else {
        subject = 'Welcome to Trpi - Confirm Your Account';
        title = 'Welcome to Trpi!';
        description = `Hi ${metadata?.first_name || 'there'}, welcome to Trpi! Click the link below to confirm your account and start your therapy journey:`;
      }
      break;
  }
  
  const senderEmail = process.env.SENDER_EMAIL || 'noreply@trpi.com';
  
  const mailOptions = {
    from: `Trpi <${senderEmail}>`,
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
        <p>Best regards,<br>The Trpi Team</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Magic link email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send magic link email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}
