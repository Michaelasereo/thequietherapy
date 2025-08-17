const puppeteer = require('puppeteer');

async function testTherapistAuth() {
  console.log('🧪 Starting therapist authentication test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    // Enable console logging
    page.on('console', msg => console.log('Browser:', msg.text()));
    
    // Go to therapist login page
    console.log('📝 Step 1: Going to therapist login page...');
    await page.goto('http://localhost:3000/therapist/login', { waitUntil: 'networkidle0' });
    
    // Enter email
    console.log('📝 Step 2: Entering therapist email...');
    await page.type('input[type="email"]', 'asereope@gmail.com'); // Use the therapist email from your database
    
    // Submit form
    console.log('📝 Step 3: Submitting therapist login form...');
    await page.click('button[type="submit"]');
    
    // Wait for response
    console.log('📝 Step 4: Waiting for response...');
    await page.waitForTimeout(2000);
    
    // Check if toast appears
    const toastText = await page.evaluate(() => {
      const toast = document.querySelector('[role="alert"]');
      return toast ? toast.textContent : null;
    });
    
    console.log('📝 Toast message:', toastText);
    
    console.log('✅ Test completed! Check the browser and server logs above.');
    console.log('📧 Check your email for the therapist magic link.');
    console.log('🔗 When you click the link, watch the Network tab in DevTools.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Keep browser open for manual testing
    console.log('🔍 Browser will stay open for manual testing...');
    console.log('🔍 Click the magic link in your email and watch the Network tab.');
  }
}

testTherapistAuth().catch(console.error);
