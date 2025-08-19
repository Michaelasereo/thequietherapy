const https = require('https');

// Your Daily.co API key from the dashboard
const API_KEY = '498c8abf43725d3b725361895338885c87f5a9a10851088c8972cc954f8bca43';

// Use a simpler webhook URL that we know works
const WEBHOOK_URL = 'https://thequietherapy.live/api/test-db';

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

// Main function to set up webhook
async function setupWebhook() {
  try {
    console.log('Setting up Daily.co webhook...');
    console.log('Webhook URL:', WEBHOOK_URL);
    console.log('Note: Using test endpoint temporarily until webhook endpoint is ready');
    
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
      url: WEBHOOK_URL
    });
    
    if (createResponse.status === 200 || createResponse.status === 201) {
      console.log('✅ Webhook created successfully!');
      console.log('Webhook details:', createResponse.data);
      
      console.log('\n📝 Next Steps:');
      console.log('1. The webhook is now configured with a test endpoint');
      console.log('2. Once the webhook endpoint is ready, update the URL to:');
      console.log('   https://thequietherapy.live/api/webhook');
      console.log('3. Test the webhook with a real recording');
      
    } else {
      console.log('❌ Failed to create webhook');
      console.log('Status:', createResponse.status);
      console.log('Response:', createResponse.data);
    }

  } catch (error) {
    console.error('❌ Error setting up webhook:', error.message);
  }
}

// Run the setup
setupWebhook();
