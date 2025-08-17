require('dotenv').config({ path: '.env.local' });
const { sendMagicLinkEmail } = require('../lib/email.ts');

async function testEmailSending() {
  console.log('🧪 Testing Email Sending...\n');

  // Check environment variables
  console.log('📋 Environment Check:');
  console.log('  BREVO_SMTP_USER:', process.env.BREVO_SMTP_USER ? '✅ Configured' : '❌ Missing');
  console.log('  BREVO_SMTP_PASS:', process.env.BREVO_SMTP_PASS ? '✅ Configured' : '❌ Missing');
  console.log('  SENDER_EMAIL:', process.env.SENDER_EMAIL || 'noreply@trpi.com');
  console.log('  NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
  console.log('');

  if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_PASS) {
    console.log('❌ Email credentials not configured. Please set BREVO_SMTP_USER and BREVO_SMTP_PASS in .env.local');
    return;
  }

  try {
    console.log('📧 Testing magic link email sending...');
    
    const testEmail = 'test@example.com'; // Change this to your email for testing
    const verificationUrl = 'http://localhost:3000/api/auth/verify-magic-link?token=test-token&auth_type=partner';
    
    const result = await sendMagicLinkEmail(
      testEmail,
      verificationUrl,
      'login',
      {
        auth_type: 'partner',
        first_name: 'Test Partner',
        organization_name: 'Test Organization'
      }
    );

    console.log('📧 Email sending result:', result);

    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log('📧 Message ID:', result.messageId);
    } else {
      console.log('❌ Email sending failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testEmailSending();
