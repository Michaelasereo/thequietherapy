#!/usr/bin/env node

/**
 * Test Donation Flow Script
 * 
 * This script helps debug the donation flow by:
 * 1. Testing the donation initiation API
 * 2. Testing the webhook endpoint
 * 3. Checking database updates
 * 4. Verifying stats API
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testDonationInitiation() {
  console.log('🧪 Testing donation initiation...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/donations/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 5000,
        email: 'test@example.com',
        name: 'Test Donor',
        anonymous: false
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Donation initiation successful');
      console.log('📝 Reference:', result.reference);
      console.log('💰 Amount:', result.amount);
      return result.reference;
    } else {
      console.log('❌ Donation initiation failed:', result.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Error testing donation initiation:', error.message);
    return null;
  }
}

async function testWebhook(reference) {
  console.log('🧪 Testing webhook endpoint...');
  
  try {
    // Create a test webhook payload
    const webhookData = {
      event: 'charge.success',
      data: {
        reference: reference,
        amount: 500000, // 5000 Naira in kobo
        status: 'success',
        customer: {
          email: 'test@example.com'
        }
      }
    };

    // Create test signature (for testing only)
    const testSignature = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || 'test-key')
      .update(JSON.stringify(webhookData))
      .digest('hex');

    const response = await fetch(`${BASE_URL}/api/donations/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-paystack-signature': testSignature
      },
      body: JSON.stringify(webhookData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Webhook test successful');
      console.log('📝 Response:', result);
      return true;
    } else {
      console.log('❌ Webhook test failed:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing webhook:', error.message);
    return false;
  }
}

async function checkDatabase() {
  console.log('🧪 Checking database...');
  
  try {
    // Check all donations
    const { data: donations, error } = await supabase
      .from('donations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.log('❌ Error fetching donations:', error.message);
      return;
    }

    console.log('📊 Found', donations.length, 'donations');
    donations.forEach((donation, index) => {
      console.log(`${index + 1}. ${donation.donor_name} - ₦${donation.amount} - ${donation.status} - ${donation.created_at}`);
    });

    // Check successful donations
    const { data: successfulDonations, error: successError } = await supabase
      .from('donations')
      .select('amount')
      .eq('status', 'success');

    if (!successError && successfulDonations) {
      const totalRaised = successfulDonations.reduce((sum, d) => sum + Number(d.amount), 0);
      console.log('💰 Total raised from successful donations: ₦', totalRaised);
    }

  } catch (error) {
    console.log('❌ Error checking database:', error.message);
  }
}

async function testStatsAPI() {
  console.log('🧪 Testing stats API...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/donations/stats`, {
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Stats API working');
      console.log('📊 Stats:', {
        raised: result.data.raised,
        donors: result.data.donors,
        progress: `${result.data.progressPercentage.toFixed(1)}%`
      });
      return true;
    } else {
      console.log('❌ Stats API failed:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing stats API:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting donation flow tests...\n');

  // Test 1: Check database
  await checkDatabase();
  console.log('');

  // Test 2: Test stats API
  await testStatsAPI();
  console.log('');

  // Test 3: Test donation initiation
  const reference = await testDonationInitiation();
  console.log('');

  // Test 4: Test webhook (if we have a reference)
  if (reference) {
    await testWebhook(reference);
    console.log('');

    // Check database again after webhook
    console.log('🔍 Checking database after webhook...');
    await checkDatabase();
  }

  console.log('✅ Tests completed!');
}

// Run the tests
runTests().catch(console.error);
