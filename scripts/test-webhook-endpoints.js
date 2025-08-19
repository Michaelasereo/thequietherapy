const https = require('https');

function testEndpoint(url, method = 'POST', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: body.substring(0, 200), // First 200 chars
          isHtml: body.includes('<!DOCTYPE html>')
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAllEndpoints() {
  const testData = {
    event: 'recording.finished',
    data: {
      id: 'test-recording-id',
      room_name: 'trpi-session-test-123',
      download_url: 'https://example.com/recording.mp4',
      duration: 1800
    }
  };

  const endpoints = [
    'https://thequietherapy.live/api/webhook',
    'https://thequietherapy.live/api/daily/webhook',
    'https://thequietherapy.live/api/test-db'
  ];

  console.log('🔍 Testing webhook endpoints...\n');

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint}`);
      const result = await testEndpoint(endpoint, 'POST', testData);
      
      if (result.status === 200 && !result.isHtml) {
        console.log(`✅ ${endpoint} - WORKING!`);
        console.log(`   Status: ${result.status}`);
        console.log(`   Response: ${result.body}`);
      } else if (result.status === 404 || result.isHtml) {
        console.log(`⏳ ${endpoint} - Still deploying (404 or HTML response)`);
      } else {
        console.log(`⚠️  ${endpoint} - Unexpected response: ${result.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`);
    }
    console.log('');
  }
}

// Test all endpoints
testAllEndpoints();
