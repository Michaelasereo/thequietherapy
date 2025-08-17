require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugMagicLinkIssue() {
  console.log('🔍 Debugging Magic Link Creation Issue...\n');

  try {
    // Step 1: Check environment variables
    console.log('1. Environment Variables Check:');
    console.log('  NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.log('  SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
    console.log('  BREVO_SMTP_USER:', process.env.BREVO_SMTP_USER ? '✅ Set' : '❌ Missing');
    console.log('  BREVO_SMTP_PASS:', process.env.BREVO_SMTP_PASS ? '✅ Set' : '❌ Missing');
    console.log('  SENDER_EMAIL:', process.env.SENDER_EMAIL || 'noreply@trpi.com');
    console.log('');

    // Step 2: Test Supabase connection
    console.log('2. Testing Supabase Connection...');
    const { data: testData, error: testError } = await supabase
      .from('magic_links')
      .select('count')
      .limit(1);

    if (testError) {
      console.log('❌ Supabase connection failed:', testError.message);
      return;
    }
    console.log('✅ Supabase connection successful');
    console.log('');

    // Step 3: Test magic_links table structure
    console.log('3. Checking magic_links table structure...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'magic_links')
      .eq('table_schema', 'public');

    if (columnsError) {
      console.log('❌ Could not check table structure:', columnsError.message);
    } else {
      console.log('✅ magic_links table structure:');
      columns.forEach(col => {
        console.log(`    ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }
    console.log('');

    // Step 4: Test email transporter creation
    console.log('4. Testing Email Transporter...');
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
      }
    });

    try {
      await transporter.verify();
      console.log('✅ Email transporter created successfully');
    } catch (emailError) {
      console.log('❌ Email transporter failed:', emailError.message);
    }
    console.log('');

    // Step 5: Test magic link creation step by step
    console.log('5. Testing Magic Link Creation Process...');
    
    const testEmail = 'test@example.com';
    const token = 'test-token-' + Date.now();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    console.log('   Creating magic link with data:');
    console.log('     Email:', testEmail);
    console.log('     Token:', token.substring(0, 20) + '...');
    console.log('     Expires:', expiresAt);
    
    const { data: magicLink, error: insertError } = await supabase
      .from('magic_links')
      .insert({
        email: testEmail,
        token: token,
        type: 'login',
        auth_type: 'partner',
        expires_at: expiresAt,
        metadata: { 
          auth_type: 'partner',
          first_name: 'Test Partner',
          organization_name: 'Test Org'
        }
      })
      .select()
      .single();

    if (insertError) {
      console.log('❌ Magic link creation failed:', insertError);
      console.log('   Error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
    } else {
      console.log('✅ Magic link created successfully');
      console.log('   Magic link ID:', magicLink.id);
      
      // Clean up test data
      await supabase
        .from('magic_links')
        .delete()
        .eq('id', magicLink.id);
      console.log('   Test data cleaned up');
    }
    console.log('');

    // Step 6: Test email sending
    console.log('6. Testing Email Sending...');
    try {
      const mailOptions = {
        from: `Trpi <${process.env.SENDER_EMAIL || 'noreply@trpi.com'}>`,
        to: testEmail,
        subject: 'Test Magic Link Email',
        html: '<p>This is a test email to verify email sending works.</p>'
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Test email sent successfully');
      console.log('   Message ID:', info.messageId);
    } catch (emailSendError) {
      console.log('❌ Email sending failed:', emailSendError.message);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugMagicLinkIssue();
