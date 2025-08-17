const puppeteer = require('puppeteer');

async function debugPartnerDashboard() {
  console.log('🔍 Starting partner dashboard debug...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log('📱 Browser Console:', msg.text());
  });
  
  // Enable network logging
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log(`🌐 API Call: ${response.url()} - Status: ${response.status()}`);
    }
  });
  
  try {
    console.log('🔍 Going to partner auth page...');
    await page.goto('http://localhost:3002/partner/auth', { waitUntil: 'networkidle0' });
    
    console.log('🔍 Filling in email...');
    await page.type('input[type="email"]', 'test@partner.com');
    
    console.log('🔍 Clicking login button...');
    await page.click('button[type="submit"]');
    
    console.log('🔍 Waiting for response...');
    await page.waitForTimeout(3000);
    
    // Check if we got a success message
    const successText = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (let el of elements) {
        if (el.textContent && el.textContent.includes('magic link')) {
          return el.textContent;
        }
      }
      return null;
    });
    
    if (successText) {
      console.log('✅ Magic link message found:', successText);
    } else {
      console.log('❌ No magic link message found');
    }
    
    // Check for any error messages
    const errorText = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (let el of elements) {
        if (el.textContent && (el.textContent.includes('error') || el.textContent.includes('failed'))) {
          return el.textContent;
        }
      }
      return null;
    });
    
    if (errorText) {
      console.log('❌ Error message found:', errorText);
    }
    
    console.log('🔍 Waiting 10 seconds to see if dashboard loads...');
    await page.waitForTimeout(10000);
    
    // Check current URL
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    // Check if we're on dashboard
    if (currentUrl.includes('/partner/dashboard')) {
      console.log('✅ Successfully redirected to partner dashboard!');
      
      // Check for loading indicators
      const loadingElements = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('*')).filter(el => 
          el.textContent && (
            el.textContent.includes('loading') || 
            el.textContent.includes('Loading') ||
            el.textContent.includes('Please wait')
          )
        ).length;
      });
      
      console.log(`🔍 Found ${loadingElements} loading elements`);
      
      // Check for any console errors
      console.log('🔍 Checking for any remaining console errors...');
      await page.waitForTimeout(5000);
      
    } else {
      console.log('❌ Not redirected to dashboard');
    }
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    console.log('🔍 Debug complete. Keeping browser open for manual inspection...');
    // Keep browser open for manual inspection
    // await browser.close();
  }
}

debugPartnerDashboard().catch(console.error);
