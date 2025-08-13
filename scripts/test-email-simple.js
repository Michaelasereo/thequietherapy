require('dotenv').config({ path: '.env.local' });
const { createTransport } = require('nodemailer');

async function testEmail() {
  console.log('Testing email to asereopeyemimichael@gmail.com');
  
  const transporter = createTransport({
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
    const info = await transporter.sendMail({
      from: `Trpi <${process.env.BREVO_SMTP_USER}>`,
      to: 'asereopeyemimichael@gmail.com',
      subject: 'Test Email from Trpi',
      html: '<h2>Test Email</h2><p>If you receive this, email is working!</p>'
    });
    console.log('Email sent:', info.messageId);
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testEmail();
