const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testMiddleware() {
  console.log('🛡️ Testing Middleware Protection...\n');

  const protectedRoutes = [
    '/dashboard',
    '/therapist/dashboard',
    '/partner/dashboard',
    '/admin/dashboard'
  ];

  for (const route of protectedRoutes) {
    console.log(`Testing ${route}...`);
    try {
      const response = await fetch(`${BASE_URL}${route}`, {
        method: 'GET',
        redirect: 'manual' // Don't follow redirects
      });
      
      console.log(`   Status: ${response.status}`);
      console.log(`   Location: ${response.headers.get('location') || 'No redirect'}`);
      
      if (response.status === 302 || response.status === 307) {
        const location = response.headers.get('location');
        if (location) {
          if (route.includes('therapist') && location.includes('/therapist/login')) {
            console.log('   ✅ Correctly redirected to therapist login');
          } else if (route.includes('partner') && location.includes('/partner/auth')) {
            console.log('   ✅ Correctly redirected to partner auth');
          } else if (route.includes('admin') && location.includes('/admin/login')) {
            console.log('   ✅ Correctly redirected to admin login');
          } else if (route === '/dashboard' && location.includes('/login')) {
            console.log('   ✅ Correctly redirected to individual login');
          } else {
            console.log('   ⚠️ Redirected but not to expected location');
          }
        }
      } else {
        console.log('   ❌ No redirect - middleware may not be working');
      }
      console.log('');
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  console.log('🎉 Middleware protection tests completed!');
}

// Run the tests
testMiddleware().catch(console.error);
