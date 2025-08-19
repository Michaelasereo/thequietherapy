const https = require('https');

function checkWebhookEndpoint() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'thequietherapy.live',
      port: 443,
      path: '/api/daily/webhook',
      method: 'POST',
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
          body: body.substring(0, 200) // First 200 chars to check if it's HTML or JSON
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    // Send a test payload
    const testData = JSON.stringify({
      event: 'recording.finished',
      data: {
        id: 'test-recording-id',
        room_name: 'trpi-session-test-123',
        download_url: 'https://example.com/recording.mp4',
        duration: 1800
      }
    });

    req.write(testData);
    req.end();
  });
}

async function monitorWebhook() {
  console.log('🔍 Monitoring webhook endpoint status...');
  console.log('URL: https://thequietherapy.live/api/daily/webhook');
  console.log('');

  let attempts = 0;
  const maxAttempts = 20; // 10 minutes total (30 seconds each)

  const interval = setInterval(async () => {
    attempts++;
    console.log(`Attempt ${attempts}/${maxAttempts} - Checking webhook endpoint...`);

    try {
      const result = await checkWebhookEndpoint();
      
      if (result.status === 200 && !result.body.includes('<!DOCTYPE html>')) {
        console.log('✅ Webhook endpoint is working!');
        console.log('Status:', result.status);
        console.log('Response:', result.body);
        console.log('');
        console.log('🎉 Ready to configure Daily.co webhook!');
        clearInterval(interval);
        return;
      } else if (result.status === 404 || result.body.includes('<!DOCTYPE html>')) {
        console.log('⏳ Still deploying... (404 or HTML response)');
      } else {
        console.log('⚠️  Unexpected response:', result.status, result.body);
      }
    } catch (error) {
      console.log('❌ Error checking endpoint:', error.message);
    }

    if (attempts >= maxAttempts) {
      console.log('');
      console.log('⏰ Timeout reached. The deployment might still be in progress.');
      console.log('You can manually check the endpoint later with:');
      console.log('curl -X POST https://thequietherapy.live/api/daily/webhook -H "Content-Type: application/json" -d \'{"event": "recording.finished", "data": {"id": "test", "room_name": "test", "download_url": "test", "duration": 1800}}\'');
      clearInterval(interval);
    }

    console.log('');
  }, 30000); // Check every 30 seconds
}

// Start monitoring
monitorWebhook();
