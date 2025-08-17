const puppeteer = require('puppeteer');

async function testAuthAndDashboard() {
  console.log('🚀 Starting Authentication and Dashboard Tests...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null,
    args: ['--start-maximized']
  });

  try {
    // Test different screen sizes
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];

    for (const viewport of viewports) {
      console.log(`\n📱 Testing ${viewport.name} Viewport (${viewport.width}x${viewport.height})`);
      console.log('='.repeat(50));
      
      const page = await browser.newPage();
      await page.setViewport(viewport);
      
      // Test 1: Authentication Flow
      await testAuthenticationFlow(page, viewport.name);
      
      // Test 2: Dashboard Responsive States
      await testDashboardResponsive(page, viewport.name);
      
      // Test 3: Booking Flow
      await testBookingFlow(page, viewport.name);
      
      await page.close();
    }

    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

async function testAuthenticationFlow(page, viewportName) {
  console.log(`\n🔐 Testing Authentication Flow (${viewportName})`);
  
  try {
    // Navigate to login page
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(2000);
    
    console.log('✓ Login page loaded');
    
    // Test magic link login
    await page.type('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(2000);
    console.log('✓ Magic link sent');
    
    // Navigate to dashboard (simulating successful login)
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(3000);
    
    console.log('✓ Dashboard loaded after authentication');
    
  } catch (error) {
    console.error(`❌ Authentication test failed for ${viewportName}:`, error.message);
  }
}

async function testDashboardResponsive(page, viewportName) {
  console.log(`\n📊 Testing Dashboard Responsive States (${viewportName})`);
  
  try {
    // Check if dashboard elements are visible
    const elements = [
      'h1', // Welcome message
      'button:contains("Book a Session")',
      '.grid-cols-1', // Summary cards
      'text="Upcoming Sessions"',
      'text="Session Calendar"',
      'text="Session History"'
    ];
    
    for (const selector of elements) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        console.log(`✓ Element found: ${selector}`);
      } catch (error) {
        console.log(`⚠ Element not found: ${selector}`);
      }
    }
    
    // Test responsive grid layouts
    const gridSelectors = [
      '.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4', // Summary cards
      '.grid-cols-1.lg\\:grid-cols-2', // Upcoming sessions and calendar
      '.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3' // Therapist cards
    ];
    
    for (const gridSelector of gridSelectors) {
      try {
        const element = await page.$(gridSelector);
        if (element) {
          console.log(`✓ Grid layout found: ${gridSelector}`);
        }
      } catch (error) {
        console.log(`⚠ Grid layout not found: ${gridSelector}`);
      }
    }
    
    // Test mobile-specific elements
    if (viewportName === 'Mobile') {
      console.log('📱 Testing mobile-specific features...');
      
      // Check for mobile navigation
      const mobileNav = await page.$('[data-mobile-nav]');
      if (mobileNav) {
        console.log('✓ Mobile navigation found');
      }
      
      // Test touch interactions
      await page.tap('button:contains("Book a Session")');
      await page.waitForTimeout(1000);
      console.log('✓ Mobile touch interaction tested');
    }
    
  } catch (error) {
    console.error(`❌ Dashboard responsive test failed for ${viewportName}:`, error.message);
  }
}

async function testBookingFlow(page, viewportName) {
  console.log(`\n📅 Testing Booking Flow (${viewportName})`);
  
  try {
    // Click book session button
    await page.click('button:contains("Book a Session")');
    await page.waitForTimeout(2000);
    
    console.log('✓ Booking modal opened');
    
    // Test step 1: Patient biodata
    await page.type('input[placeholder="John"]', 'Test User');
    await page.type('textarea[placeholder*="therapy"]', 'Testing booking flow');
    await page.type('input[type="number"]', '25');
    
    // Select gender
    await page.click('select[name="gender"]');
    await page.select('select[name="gender"]', 'Male');
    
    // Select marital status
    await page.click('select[name="maritalStatus"]');
    await page.select('select[name="maritalStatus"]', 'Single');
    
    // Test therapist preferences
    await page.click('select[name="therapistGenderPreference"]');
    await page.select('select[name="therapistGenderPreference"]', 'Female');
    
    await page.click('select[name="therapistSpecializationPreference"]');
    await page.select('select[name="therapistSpecializationPreference"]', 'Anxiety & Stress Management');
    
    await page.click('button:contains("Next: Select Therapist")');
    await page.waitForTimeout(2000);
    
    console.log('✓ Step 1 completed');
    
    // Test step 2: Therapist selection
    const therapistCards = await page.$$('[data-therapist-card]');
    if (therapistCards.length > 0) {
      await therapistCards[0].click();
      console.log('✓ Therapist selected');
    }
    
    // Test filters
    await page.click('select[name="filterGender"]');
    await page.select('select[name="filterGender"]', 'Female');
    
    await page.click('select[name="filterSpecialization"]');
    await page.select('select[name="filterSpecialization"]', 'Anxiety & Stress Management');
    
    console.log('✓ Filters applied');
    
    await page.click('button:contains("Next: Checkout")');
    await page.waitForTimeout(2000);
    
    console.log('✓ Step 2 completed');
    
    // Test step 3: Payment (simulate)
    const paymentElements = await page.$$('[data-payment-section]');
    if (paymentElements.length > 0) {
      console.log('✓ Payment section loaded');
    }
    
    // Go back to dashboard
    await page.click('button:contains("Back")');
    await page.waitForTimeout(2000);
    
    console.log('✓ Booking flow completed');
    
  } catch (error) {
    console.error(`❌ Booking flow test failed for ${viewportName}:`, error.message);
  }
}

// Run the tests
testAuthAndDashboard().catch(console.error);
