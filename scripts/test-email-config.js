require('dotenv').config({ path: '.env.local' });

function testEmailConfiguration() {
  console.log('🧪 Testing Email Configuration...\n');

  // Check environment variables
  console.log('📋 Environment Variables Check:');
  console.log('  BREVO_SMTP_USER:', process.env.BREVO_SMTP_USER ? '✅ Configured' : '❌ Missing');
  console.log('  BREVO_SMTP_PASS:', process.env.BREVO_SMTP_PASS ? '✅ Configured' : '❌ Missing');
  console.log('  SENDER_EMAIL:', process.env.SENDER_EMAIL || 'noreply@trpi.com');
  console.log('  NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
  console.log('');

  if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_PASS) {
    console.log('❌ Email credentials not configured.');
    console.log('   Please set these in your .env.local file:');
    console.log('   BREVO_SMTP_USER=your_brevo_username');
    console.log('   BREVO_SMTP_PASS=your_brevo_password');
    console.log('   SENDER_EMAIL=noreply@yourdomain.com');
    return;
  }

  console.log('✅ Email configuration looks good!');
  console.log('');
  console.log('🎯 Next Steps:');
  console.log('   1. Try the partner onboarding flow');
  console.log('   2. Try the partner login flow');
  console.log('   3. Check your email for magic links');
  console.log('');
  console.log('📧 Test the email functionality by:');
  console.log('   - Going to http://localhost:3002/partner/auth');
  console.log('   - Click "Existing Partner"');
  console.log('   - Enter your email address');
  console.log('   - Check if you receive the magic link email');
}

// Run the test
testEmailConfiguration();
