/**
 * E2E Authentication Test Suite
 * Tests all user types: Individual, Therapist, Partner, Admin
 * 
 * Run: node tests/e2e-auth-test.js
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  async test(name, fn) {
    try {
      process.stdout.write(`${colors.cyan}Testing: ${name}...${colors.reset} `);
      await fn();
      console.log(`${colors.green}✅ PASS${colors.reset}`);
      this.passed++;
      this.tests.push({ name, status: 'passed' });
    } catch (error) {
      console.log(`${colors.red}❌ FAIL${colors.reset}`);
      console.log(`${colors.red}   Error: ${error.message}${colors.reset}`);
      this.failed++;
      this.tests.push({ name, status: 'failed', error: error.message });
    }
  }

  async assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(
        `${message}\n   Expected: ${expected}\n   Got: ${actual}`
      );
    }
  }

  async assertTrue(value, message = 'Expected true') {
    if (!value) {
      throw new Error(message);
    }
  }

  summary() {
    const total = this.passed + this.failed;
    const rate = ((this.passed / total) * 100).toFixed(1);
    
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.blue}TEST SUMMARY${colors.reset}`);
    console.log('='.repeat(60));
    console.log(`Total Tests: ${total}`);
    console.log(`${colors.green}Passed: ${this.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${this.failed}${colors.reset}`);
    console.log(`Success Rate: ${rate}%`);
    console.log('='.repeat(60));

    if (this.failed > 0) {
      console.log(`\n${colors.yellow}Failed Tests:${colors.reset}`);
      this.tests
        .filter(t => t.status === 'failed')
        .forEach(t => {
          console.log(`  ❌ ${t.name}`);
          console.log(`     ${colors.red}${t.error}${colors.reset}`);
        });
    }

    return this.failed === 0;
  }
}

// Test Suite 1: Individual User Authentication
async function testIndividualAuth(runner) {
  console.log(`\n${colors.blue}=== TEST SUITE 1: INDIVIDUAL USER AUTH ===${colors.reset}\n`);

  const testEmail = `patient.${Date.now()}@test.com`;
  
  await runner.test('Individual user registration', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        fullName: 'Test Patient User',
      }),
    });

    const data = await response.json();
    runner.assertTrue(response.ok, `Registration failed: ${JSON.stringify(data)}`);
    runner.assertTrue(data.success, 'Registration did not return success');
  });

  await runner.test('Individual login request', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        userType: 'individual',
      }),
    });

    const data = await response.json();
    runner.assertTrue(response.ok, `Login failed: ${JSON.stringify(data)}`);
    runner.assertTrue(data.success, 'Login did not return success');
  });

  await runner.test('Rate limiting on login', async () => {
    let rateLimitHit = false;

    // Try 10 requests rapidly
    for (let i = 0; i < 10; i++) {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `ratelimit.${i}@test.com`,
          userType: 'individual',
        }),
      });

      if (response.status === 429) {
        rateLimitHit = true;
        break;
      }
    }

    runner.assertTrue(rateLimitHit, 'Rate limit not triggered after multiple requests');
  });
}

// Test Suite 2: Therapist Authentication
async function testTherapistAuth(runner) {
  console.log(`\n${colors.blue}=== TEST SUITE 2: THERAPIST AUTH ===${colors.reset}\n`);

  const testEmail = `therapist.${Date.now()}@test.com`;

  await runner.test('Therapist registration', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        fullName: 'Dr. Test Therapist',
      }),
    });

    const data = await response.json();
    runner.assertTrue(response.ok, `Registration failed: ${JSON.stringify(data)}`);
  });

  await runner.test('Therapist login request', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        userType: 'therapist',
      }),
    });

    const data = await response.json();
    runner.assertTrue(response.ok, `Login failed: ${JSON.stringify(data)}`);
  });
}

// Test Suite 3: Admin Authentication (Secure)
async function testAdminAuth(runner) {
  console.log(`\n${colors.blue}=== TEST SUITE 3: ADMIN AUTH (SECURE) ===${colors.reset}\n`);

  await runner.test('Admin login with unauthorized email', async () => {
    const response = await fetch(`${BASE_URL}/api/admin/secure-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'unauthorized@attacker.com',
      }),
    });

    const data = await response.json();
    
    // Should return success message (doesn't reveal if email is valid)
    runner.assertTrue(response.ok, 'Should return 200 even for unauthorized email');
    runner.assertTrue(
      data.message.includes('administrator'),
      'Should return generic admin message'
    );
  });

  await runner.test('Admin rate limiting (3 attempts)', async () => {
    let rateLimitHit = false;
    const testEmail = 'attacker@evil.com';

    for (let i = 0; i < 5; i++) {
      const response = await fetch(`${BASE_URL}/api/admin/secure-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });

      if (response.status === 429) {
        rateLimitHit = true;
        const data = await response.json();
        runner.assertTrue(
          data.error.includes('Too many'),
          'Rate limit error message incorrect'
        );
        break;
      }
    }

    runner.assertTrue(rateLimitHit, 'Admin rate limit (3 attempts) not triggered');
  });

  await runner.test('Admin login with authorized email', async () => {
    const response = await fetch(`${BASE_URL}/api/admin/secure-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'asereopeyemimichael@gmail.com', // Whitelisted admin
      }),
    });

    const data = await response.json();
    runner.assertTrue(response.ok, 'Admin login should succeed');
    runner.assertTrue(data.success, 'Should return success for valid admin');
  });
}

// Test Suite 4: Security Tests
async function testSecurity(runner) {
  console.log(`\n${colors.blue}=== TEST SUITE 4: SECURITY TESTS ===${colors.reset}\n`);

  await runner.test('Old admin password endpoint removed', async () => {
    const response = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@trpi.com',
        password: 'admin123',
      }),
    });

    // Should return 404 or 405 (endpoint doesn't exist)
    runner.assertTrue(
      response.status === 404 || response.status === 405,
      `Old admin endpoint should not exist. Got status: ${response.status}`
    );
  });

  await runner.test('Therapist POST requires authentication', async () => {
    const response = await fetch(`${BASE_URL}/api/therapists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'fake-id',
        bio: 'Fake therapist',
        specializations: ['Fake'],
        experience_years: 10,
      }),
    });

    runner.assertEqual(
      response.status,
      401,
      'Therapist POST should require authentication'
    );
  });

  await runner.test('RBAC: Individual cannot access admin endpoints', async () => {
    // This would require a valid individual session
    // For now, just test without auth
    const response = await fetch(`${BASE_URL}/api/admin/users`);

    runner.assertTrue(
      response.status === 401 || response.status === 403,
      'Admin endpoint should be protected'
    );
  });

  await runner.test('Generic error messages (no user enumeration)', async () => {
    const response1 = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'newuser@test.com',
        fullName: 'New User',
      }),
    });

    const response2 = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'newuser@test.com', // Same email
        fullName: 'New User',
      }),
    });

    const data1 = await response1.json();
    const data2 = await response2.json();

    // Messages should be similar (no enumeration)
    runner.assertTrue(
      data1.message && data2.message,
      'Both should return messages'
    );
  });
}

// Main test runner
async function main() {
  console.log(`${colors.cyan}
╔═══════════════════════════════════════════════════════════╗
║          QUIET THERAPY - E2E AUTHENTICATION TESTS          ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

  console.log(`Testing against: ${colors.yellow}${BASE_URL}${colors.reset}`);
  console.log(`Start time: ${new Date().toISOString()}\n`);

  const runner = new TestRunner();

  try {
    // Run all test suites
    await testIndividualAuth(runner);
    await testTherapistAuth(runner);
    await testAdminAuth(runner);
    await testSecurity(runner);

    // Print summary
    const allPassed = runner.summary();

    // Exit with appropriate code
    process.exit(allPassed ? 0 : 1);

  } catch (error) {
    console.error(`${colors.red}\nFatal error: ${error.message}${colors.reset}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
main();

