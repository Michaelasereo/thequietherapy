const https = require('https');

// Your Daily.co API key from the dashboard
const API_KEY = '498c8abf43725d3b725361895338885c87f5a9a10851088c8972cc954f8bca43';

// Your webhook URL
const WEBHOOK_URL = 'https://thequietherapy.live/api/daily/webhook';

// Webhook configuration
const webhookConfig = {
  url: WEBHOOK_URL
};

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
    
    // First, let's check existing webhooks
    console.log('\nChecking existing webhooks...');
    const existingWebhooks = await makeRequest('GET', '/v1/webhooks');
    console.log('Existing webhooks:', existingWebhooks.data);

    // Create new webhook
    console.log('\nCreating new webhook...');
    const createResponse = await makeRequest('POST', '/v1/webhooks', webhookConfig);
    
    if (createResponse.status === 200 || createResponse.status === 201) {
      console.log('✅ Webhook created successfully!');
      console.log('Webhook details:', createResponse.data);
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
