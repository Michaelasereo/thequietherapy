const https = require('https');

// Your Daily.co API key from the dashboard
const API_KEY = '498c8abf43725d3b725361895338885c87f5a9a10851088c8972cc954f8bca43';

function testWebhookEndpoint() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'thequietherapy.live',
      port: 443,
      path: '/api/webhook',
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
          body: body.substring(0, 200),
          isHtml: body.includes('<!DOCTYPE html>')
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

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

function makeDailyRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.daily.co',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
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

async function setupWebhookWhenReady() {
  console.log('🔍 Monitoring webhook endpoint and setting up Daily.co webhook...');
  console.log('URL: https://thequietherapy.live/api/webhook');
  console.log('');

  let attempts = 0;
  const maxAttempts = 30; // 15 minutes total (30 seconds each)

  const interval = setInterval(async () => {
    attempts++;
    console.log(`Attempt ${attempts}/${maxAttempts} - Checking webhook endpoint...`);

    try {
      const result = await testWebhookEndpoint();
      
      if (result.status === 200 && !result.isHtml) {
        console.log('✅ Webhook endpoint is working!');
        console.log('Status:', result.status);
        console.log('Response:', result.body);
        console.log('');
        console.log('🎉 Setting up Daily.co webhook...');
        
        // Clear the interval
        clearInterval(interval);
        
        // Set up the webhook
        try {
          // Check existing webhooks
          console.log('Checking existing webhooks...');
          const existingWebhooks = await makeDailyRequest('GET', '/v1/webhooks');
          console.log('Existing webhooks:', existingWebhooks.data);

          // Delete existing webhooks if any
          if (existingWebhooks.data && existingWebhooks.data.length > 0) {
            console.log('Deleting existing webhooks...');
            for (const webhook of existingWebhooks.data) {
              await makeDailyRequest('DELETE', `/v1/webhooks/${webhook.id}`);
              console.log(`Deleted webhook: ${webhook.id}`);
            }
          }

          // Create new webhook
          console.log('Creating new webhook...');
          const createResponse = await makeDailyRequest('POST', '/v1/webhooks', {
            url: 'https://thequietherapy.live/api/webhook'
          });
          
          if (createResponse.status === 200 || createResponse.status === 201) {
            console.log('✅ Daily.co webhook created successfully!');
            console.log('Webhook details:', createResponse.data);
            console.log('');
            console.log('🎉 Setup complete! Your webhook is now ready to receive recording events.');
            console.log('');
            console.log('📝 Next steps:');
            console.log('1. Test with a real video call recording');
            console.log('2. Check your server logs for webhook events');
            console.log('3. Verify AI processing starts automatically');
          } else {
            console.log('❌ Failed to create webhook');
            console.log('Status:', createResponse.status);
            console.log('Response:', createResponse.data);
          }
        } catch (error) {
          console.error('❌ Error setting up webhook:', error.message);
        }
        
        return;
      } else if (result.status === 404 || result.isHtml) {
        console.log('⏳ Still deploying... (404 or HTML response)');
      } else {
        console.log('⚠️ Unexpected response:', result.status, result.body);
      }
    } catch (error) {
      console.log('❌ Error checking endpoint:', error.message);
    }

    if (attempts >= maxAttempts) {
      console.log('');
      console.log('⏰ Timeout reached. The deployment might still be in progress.');
      console.log('You can manually check the endpoint later and run the setup script again.');
      clearInterval(interval);
    }

    console.log('');
  }, 30000); // Check every 30 seconds
}

// Start monitoring
setupWebhookWhenReady();
