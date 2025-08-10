import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3007'}/api/auth/verify-email?email=${email}&token=${token}`;
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Trpi <onboarding@resend.dev>',
      to: [email],
      subject: 'Welcome to Trpi - Access Your Dashboard',
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
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3007'}/reset-password?token=${token}`;
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Trpi <onboarding@resend.dev>',
      to: [email],
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
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
}
