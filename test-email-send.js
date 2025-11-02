const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Test email function
async function testEmailSend() {
  console.log('🧪 Testing Email Send Functionality\n');
  console.log('='.repeat(60));
  
  // Check environment variables
  const hasUser = !!process.env.BREVO_SMTP_USER;
  const hasPass = !!process.env.BREVO_SMTP_PASS;
  const senderEmail = process.env.SENDER_EMAIL || 'noreply@thequietherapy.live';
  
  console.log('\n📋 Environment Check:');
  console.log(`   BREVO_SMTP_USER: ${hasUser ? '✅ Set (' + process.env.BREVO_SMTP_USER?.substring(0, 10) + '...)' : '❌ Missing'}`);
  console.log(`   BREVO_SMTP_PASS: ${hasPass ? '✅ Set (' + process.env.BREVO_SMTP_PASS?.substring(0, 5) + '...)' : '❌ Missing'}`);
  console.log(`   SENDER_EMAIL: ${senderEmail}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  
  if (!hasUser || !hasPass) {
    console.error('\n❌ Email credentials not configured!');
    console.error('   Please set BREVO_SMTP_USER and BREVO_SMTP_PASS in .env.local');
    return;
  }
  
  // Create transporter
  console.log('\n📧 Creating SMTP Transporter...');
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  
  // Test connection
  console.log('\n🔌 Testing SMTP Connection...');
  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
    if (error.code) console.error(`   Error Code: ${error.code}`);
    if (error.response) console.error(`   SMTP Response: ${error.response}`);
    return;
  }
  
  // Get test email - from command line or fetch most recent user
  let testEmail = process.argv[2];
  
  if (!testEmail) {
    console.log('\n🔍 Fetching most recent user from database...');
    try {
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('email, full_name, user_type')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (userError) {
        console.warn('⚠️ Could not fetch users from database:', userError.message);
        console.log('   Using default test email');
        testEmail = 'test@example.com';
      } else if (users && users.length > 0) {
        console.log('\n📋 Found recent users:');
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (${user.user_type})`);
        });
        testEmail = users[0].email;
        console.log(`\n✅ Using email: ${testEmail}`);
      } else {
        console.warn('⚠️ No users found in database');
        testEmail = 'test@example.com';
      }
    } catch (error) {
      console.warn('⚠️ Error fetching users:', error.message);
      testEmail = 'test@example.com';
    }
  }
  
  const testUrl = 'http://localhost:3001/api/auth/verify-magic-link?token=test123&auth_type=individual';
  
  console.log(`\n📤 Sending test email to: ${testEmail}`);
  console.log(`   From: ${senderEmail}`);
  
  const mailOptions = {
    from: `The Quiet Therapy <${senderEmail}>`,
    to: testEmail,
    subject: 'Test Magic Link - The Quiet Therapy',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Test Magic Link</h2>
        <p>This is a test email to verify email sending functionality.</p>
        <a href="${testUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Test Magic Link
        </a>
        <p>If the button doesn't work, copy and paste this link:</p>
        <p style="word-break: break-all; color: #6b7280;">${testUrl}</p>
        <p>Best regards,<br>The Quiet Team</p>
      </div>
    `,
    text: `Test Magic Link\n\nClick this link: ${testUrl}`,
  };
  
  try {
    console.log('\n⏳ Sending email...');
    const startTime = Date.now();
    
    const info = await Promise.race([
      transporter.sendMail(mailOptions),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email send timeout after 15 seconds')), 15000)
      )
    ]);
    
    const duration = Date.now() - startTime;
    
    console.log('\n✅ Email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response || 'N/A'}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`\n📬 Check your email inbox at: ${testEmail}`);
    
  } catch (error) {
    console.error('\n❌ Failed to send email:');
    console.error(`   Error: ${error.message}`);
    
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
    if (error.stack) {
      console.error(`   Stack: ${error.stack.substring(0, 500)}...`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
}

// Run the test
testEmailSend().catch(console.error);
