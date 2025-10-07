#!/usr/bin/env node

// Simple script to approve all partners using the new API endpoint
const https = require('https');
const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

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

async function checkPartnerStatus() {
  try {
    console.log('🔍 Checking current partner status...');
    
    const response = await makeRequest(`${BASE_URL}/api/admin/approve-all-partners`);
    
    if (response.status !== 200) {
      console.error('❌ Failed to fetch partner status:', response.data);
      return false;
    }

    const { totalPartners, statusCounts, partnersNeedingApproval } = response.data;
    
    console.log(`📊 Found ${totalPartners} total partners`);
    console.log('Current status breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    
    console.log(`\nPartners needing approval: ${partnersNeedingApproval}`);
    
    return partnersNeedingApproval > 0;
  } catch (error) {
    console.error('❌ Error checking partner status:', error.message);
    return false;
  }
}

async function approveAllPartners() {
  try {
    console.log('🚀 Starting partner approval process...');
    
    const response = await makeRequest(`${BASE_URL}/api/admin/approve-all-partners`, {
      method: 'POST'
    });
    
    if (response.status !== 200) {
      console.error('❌ Failed to approve partners:', response.data);
      return;
    }

    const { success, message, totalPartners, approvedCount, approvedPartners, initialStatusCounts, finalStatusCounts } = response.data;
    
    if (success) {
      console.log(`\n✅ ${message}`);
      console.log(`📊 Total partners: ${totalPartners}`);
      console.log(`🚀 Partners approved: ${approvedCount}`);
      
      if (approvedPartners && approvedPartners.length > 0) {
        console.log('\nApproved partners:');
        approvedPartners.forEach(partner => {
          console.log(`   - ${partner.email} (${partner.name})`);
        });
      }
      
      console.log('\nStatus before approval:');
      Object.entries(initialStatusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
      
      console.log('\nStatus after approval:');
      Object.entries(finalStatusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
      
      console.log('\n🎉 Partner approval process completed successfully!');
    } else {
      console.error('❌ Approval failed:', response.data);
    }

  } catch (error) {
    console.error('❌ Error in partner approval process:', error.message);
  }
}

async function main() {
  console.log('📋 PARTNER APPROVAL SCRIPT');
  console.log('==========================');
  console.log('');
  
  // Check if we can connect to the API
  const hasPartnersToApprove = await checkPartnerStatus();
  
  if (hasPartnersToApprove) {
    console.log('\n🚀 Proceeding with approval...');
    await approveAllPartners();
  } else {
    console.log('\n✅ No partners need approval at this time.');
  }
}

// Run the script
main().catch(console.error);
