require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('📧 Testing Brevo Email Configuration...\n');

  // Check environment variables
  console.log('1️⃣ Checking environment variables:');
  console.log('BREVO_SMTP_USER:', process.env.BREVO_SMTP_USER ? 'SET' : 'NOT SET');
  console.log('BREVO_SMTP_PASS:', process.env.BREVO_SMTP_PASS ? 'SET' : 'NOT SET');
  console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || 'NOT SET');

  if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_PASS) {
    console.log('❌ Missing Brevo SMTP credentials in .env.local');
    console.log('💡 Please add:');
    console.log('   BREVO_SMTP_USER=your_brevo_smtp_user');
    console.log('   BREVO_SMTP_PASS=your_brevo_smtp_password');
    return;
  }

  // Test SMTP connection
  console.log('\n2️⃣ Testing SMTP connection...');
  const transporter = nodemailer.createTransporter({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    // Verify SMTP connection
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
  } catch (error) {
    console.log('❌ SMTP connection failed:', error.message);
    return;
  }

  // Test email sending
  console.log('\n3️⃣ Testing email sending...');
  const testEmail = 'test@example.com'; // Change this to your email for testing
  
  const mailOptions = {
    from: `Trpi <${process.env.BREVO_SMTP_USER}>`, // Use the SMTP user as sender
    to: testEmail,
    subject: 'Test Email from Trpi',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Test Email</h2>
        <p>This is a test email to verify Brevo SMTP configuration.</p>
        <p>If you receive this, your email setup is working correctly!</p>
        <p>Best regards,<br>The Trpi Team</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📧 Response:', info.response);
  } catch (error) {
    console.log('❌ Test email failed:', error.message);
    console.log('🔍 Error details:', error);
  }

  // Check Brevo dashboard settings
  console.log('\n4️⃣ Brevo Configuration Checklist:');
  console.log('   ✅ Verify your Brevo account is active');
  console.log('   ✅ Check if you have email sending credits');
  console.log('   ✅ Verify sender domain is authenticated');
  console.log('   ✅ Check Brevo dashboard for any delivery issues');
  console.log('   ✅ Look in spam/junk folders for test emails');
}

testEmail();
