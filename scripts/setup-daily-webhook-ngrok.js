const https = require('https');

// Your Daily.co API key from the dashboard
const API_KEY = '498c8abf43725d3b725361895338885c87f5a9a10851088c8972cc954f8bca43';

// Function to make API request
function makeRequest(method, path, data = null) {
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

// Main function to set up webhook with ngrok URL
async function setupWebhookWithNgrok(ngrokUrl) {
  try {
    console.log('Setting up Daily.co webhook with ngrok...');
    console.log('Ngrok URL:', ngrokUrl);
    
    const webhookUrl = `${ngrokUrl}/api/daily/webhook`;
    console.log('Webhook URL:', webhookUrl);
    
    // First, let's check existing webhooks
    console.log('\nChecking existing webhooks...');
    const existingWebhooks = await makeRequest('GET', '/v1/webhooks');
    console.log('Existing webhooks:', existingWebhooks.data);

    // Delete existing webhooks if any
    if (existingWebhooks.data && existingWebhooks.data.length > 0) {
      console.log('\nDeleting existing webhooks...');
      for (const webhook of existingWebhooks.data) {
        await makeRequest('DELETE', `/v1/webhooks/${webhook.id}`);
        console.log(`Deleted webhook: ${webhook.id}`);
      }
    }

    // Create new webhook
    console.log('\nCreating new webhook...');
    const createResponse = await makeRequest('POST', '/v1/webhooks', {
      url: webhookUrl
    });
    
    if (createResponse.status === 200 || createResponse.status === 201) {
      console.log('✅ Webhook created successfully!');
      console.log('Webhook details:', createResponse.data);
      
      // Test the webhook
      console.log('\nTesting webhook...');
      const testResponse = await makeRequest('POST', `/v1/webhooks/${createResponse.data.id}/test`, {
        event: 'recording.finished',
        data: {
          id: 'test-recording-id',
          room_name: 'trpi-session-test-123',
          download_url: 'https://example.com/recording.mp4',
          duration: 1800
        }
      });
      
      if (testResponse.status === 200) {
        console.log('✅ Webhook test successful!');
      } else {
        console.log('❌ Webhook test failed:', testResponse.data);
      }
    } else {
      console.log('❌ Failed to create webhook');
      console.log('Status:', createResponse.status);
      console.log('Response:', createResponse.data);
    }

  } catch (error) {
    console.error('❌ Error setting up webhook:', error.message);
  }
}

// Check if ngrok URL is provided
const ngrokUrl = process.argv[2];
if (!ngrokUrl) {
  console.log('❌ Please provide ngrok URL as argument');
  console.log('Usage: node scripts/setup-daily-webhook-ngrok.js <ngrok-url>');
  console.log('Example: node scripts/setup-daily-webhook-ngrok.js https://abc123.ngrok.io');
  process.exit(1);
}

// Run the setup
setupWebhookWithNgrok(ngrokUrl);
