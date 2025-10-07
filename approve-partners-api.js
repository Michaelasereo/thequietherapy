#!/usr/bin/env node

// Simple script to approve all partners using the existing API
const https = require('https');
const http = require('http');

// You'll need to replace these with your actual values
const BASE_URL = 'http://localhost:3000'; // or your deployed URL
const API_KEY = 'your-api-key-if-needed'; // if you have API key authentication

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function approveAllPartners() {
  try {
    console.log('🔍 Fetching all partners...');
    
    // 1. Get all partners
    const partnersResponse = await makeRequest(`${BASE_URL}/api/admin/partners`);
    
    if (partnersResponse.status !== 200) {
      console.error('❌ Failed to fetch partners:', partnersResponse.data);
      return;
    }

    const partners = partnersResponse.data;
    console.log(`📊 Found ${partners.length} partners`);

    // Show current status
    const statusCounts = partners.reduce((acc, partner) => {
      acc[partner.status] = (acc[partner.status] || 0) + 1;
      return acc;
    }, {});

    console.log('Current partner status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    // 2. Approve all partners that need approval
    const partnersToApprove = partners.filter(p => 
      ['pending', 'under_review', 'inactive'].includes(p.status)
    );

    if (partnersToApprove.length === 0) {
      console.log('✅ All partners are already approved or in a non-approvable state');
      return;
    }

    console.log(`\n🚀 Approving ${partnersToApprove.length} partners...`);

    let approvedCount = 0;
    let errorCount = 0;

    for (const partner of partnersToApprove) {
      try {
        console.log(`   Approving ${partner.email}...`);
        
        const approveResponse = await makeRequest(`${BASE_URL}/api/admin/partner-state`, {
          method: 'POST',
          body: {
            partnerId: partner.id,
            action: 'activate'
          }
        });

        if (approveResponse.status === 200) {
          console.log(`   ✅ Approved ${partner.email}`);
          approvedCount++;
        } else {
          console.log(`   ❌ Failed to approve ${partner.email}: ${approveResponse.data.error || 'Unknown error'}`);
          errorCount++;
        }
      } catch (error) {
        console.log(`   ❌ Error approving ${partner.email}: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Approval Summary:`);
    console.log(`   ✅ Successfully approved: ${approvedCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📋 Total processed: ${partnersToApprove.length}`);

    if (approvedCount > 0) {
      console.log('\n🎉 Partner approval process completed!');
    }

  } catch (error) {
    console.error('❌ Error in partner approval process:', error.message);
  }
}

// Instructions for the user
console.log('📋 PARTNER APPROVAL SCRIPT');
console.log('========================');
console.log('');
console.log('This script will approve all currently registered partners.');
console.log('');
console.log('Before running, make sure:');
console.log('1. Your application is running (npm run dev)');
console.log('2. You have admin access');
console.log('3. The API endpoints are accessible');
console.log('');
console.log('To run this script:');
console.log('1. Start your application: npm run dev');
console.log('2. Run this script: node approve-partners-api.js');
console.log('');
console.log('Or manually approve partners through the admin dashboard at:');
console.log('http://localhost:3000/admin/dashboard/partners');
console.log('');

// Uncomment the line below to run the approval process
// approveAllPartners();
