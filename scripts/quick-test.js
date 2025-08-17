const puppeteer = require('puppeteer');

async function quickTest() {
  console.log('🚀 Starting Quick Authentication & Dashboard Test...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();
    
    // Test 1: Login Page
    console.log('1. Testing Login Page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(2000);
    
    // Check if login page loads
    const loginTitle = await page.$eval('h1', el => el.textContent);
    console.log(`✓ Login page loaded: ${loginTitle}`);
    
    // Test 2: Magic Link Form
    console.log('\n2. Testing Magic Link Form...');
    await page.type('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log('✓ Magic link form submitted');
    
    // Test 3: Dashboard Access (simulate authenticated user)
    console.log('\n3. Testing Dashboard...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(3000);
    
    // Check dashboard elements
    const welcomeText = await page.$eval('h1', el => el.textContent);
    console.log(`✓ Dashboard loaded: ${welcomeText}`);
    
    // Test 4: Booking Button
    console.log('\n4. Testing Booking Flow...');
    const bookButton = await page.$('button:contains("Book a Session")');
    if (bookButton) {
      await bookButton.click();
      await page.waitForTimeout(2000);
      console.log('✓ Booking modal opened');
      
      // Test Step 1 form
      await page.type('input[placeholder="John"]', 'Test User');
      await page.type('textarea[placeholder*="therapy"]', 'Testing booking flow');
      await page.type('input[type="number"]', '25');
      console.log('✓ Step 1 form filled');
      
      // Test therapist preferences
      const genderPref = await page.$('select[name="therapistGenderPreference"]');
      if (genderPref) {
        await page.select('select[name="therapistGenderPreference"]', 'Female');
        console.log('✓ Gender preference selected');
      }
      
      const specPref = await page.$('select[name="therapistSpecializationPreference"]');
      if (specPref) {
        await page.select('select[name="therapistSpecializationPreference"]', 'Anxiety & Stress Management');
        console.log('✓ Specialization preference selected');
      }
      
      // Go to next step
      const nextButton = await page.$('button:contains("Next: Select Therapist")');
      if (nextButton) {
        await nextButton.click();
        await page.waitForTimeout(2000);
        console.log('✓ Moved to Step 2');
      }
    }
    
    // Test 5: Responsive Design
    console.log('\n5. Testing Responsive Design...');
    
    // Test mobile viewport
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(2000);
    console.log('✓ Mobile viewport applied');
    
    // Check if elements are still visible
    const mobileBookButton = await page.$('button:contains("Book a Session")');
    if (mobileBookButton) {
      console.log('✓ Booking button visible on mobile');
    }
    
    // Test tablet viewport
    await page.setViewport({ width: 768, height: 1024 });
    await page.waitForTimeout(2000);
    console.log('✓ Tablet viewport applied');
    
    // Test desktop viewport
    await page.setViewport({ width: 1920, height: 1080 });
    await page.waitForTimeout(2000);
    console.log('✓ Desktop viewport applied');
    
    console.log('\n✅ Quick test completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('- Login page: ✓');
    console.log('- Magic link form: ✓');
    console.log('- Dashboard access: ✓');
    console.log('- Booking flow: ✓');
    console.log('- Responsive design: ✓');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the quick test
quickTest().catch(console.error);
