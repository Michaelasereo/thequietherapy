# 🧪 Automated E2E Test Suite

## 📋 Overview

This test suite provides comprehensive end-to-end testing for the Quiet Therapy Platform.

## 🚀 Quick Start

### **1. Install Dependencies**

```bash
# Already installed with your project
npm install
```

### **2. Set Environment Variables**

Make sure your `.env.local` has:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_SECRET_KEY=sk_test_xxx
DAILY_API_KEY=your-daily-key
DAILY_DOMAIN=your-domain.daily.co
```

### **3. Start Development Server**

```bash
# Terminal 1
npm run dev
```

### **4. Run Tests**

```bash
# Terminal 2 - Run all tests
npm run test:e2e

# Or run individual test suites
npm run test:auth      # Authentication tests
npm run test:video     # Video session tests
npm run test:booking   # Booking & payment tests
```

---

## 📁 Test Files

```
tests/
├── run-all-tests.js         # Master test runner
├── e2e-auth-test.js         # Authentication flow tests
├── e2e-video-test.js        # Video session tests
├── e2e-booking-test.js      # Booking & payment tests
└── TEST_RUNNER_README.md    # This file
```

---

## 🎯 What Gets Tested

### **Authentication Tests** (`test:auth`)
- ✅ Individual user registration
- ✅ Therapist registration
- ✅ Partner registration
- ✅ Admin secure login (magic link only)
- ✅ Rate limiting (login attempts)
- ✅ Security: Old password endpoint removed
- ✅ Security: Unauthorized endpoint access
- ✅ Security: Generic error messages

### **Video Session Tests** (`test:video`)
- ✅ Test user creation
- ✅ Session creation via API
- ✅ Daily.co room creation
- ✅ Room URL assignment
- ✅ Session timer validation
- ✅ Recording flow
- ✅ Transcription API
- ✅ SOAP notes generation
- ✅ Session completion

### **Booking Tests** (`test:booking`)
- ✅ Therapist availability setup
- ✅ Available time slots generation
- ✅ Session booking flow
- ✅ Credit deduction
- ✅ Session visibility (patient & therapist)
- ✅ Payment system configuration
- ✅ Credit packages

---

## 📊 Test Output

```bash
╔════════════════════════════════════════════════════════════════════╗
║                     QUIET THERAPY PLATFORM                         ║
║                  COMPREHENSIVE E2E TEST SUITE                      ║
╚════════════════════════════════════════════════════════════════════╝

Start Time: 2025-10-11T10:30:00.000Z
Total Test Suites: 3
Environment: development

=== Running: Authentication Tests ===
Testing: Individual user registration... ✅ PASS
Testing: Individual login request... ✅ PASS
Testing: Rate limiting on login... ✅ PASS
...

=== Running: Video Session Tests ===
Testing: Create test patient user... ✅ PASS
Testing: Create Daily.co room for session... ✅ PASS
...

=== Running: Booking & Payment Tests ===
Testing: Set therapist weekly availability... ✅ PASS
Testing: Book session via API... ✅ PASS
...

══════════════════════════════════════════════════════════════════
                      FINAL TEST SUMMARY
══════════════════════════════════════════════════════════════════

Total Test Suites: 3
Passed: 3
Failed: 0
Duration: 12.45s
Success Rate: 100.0%

Individual Results:
  ✅ Authentication Tests: PASSED
  ✅ Video Session Tests: PASSED
  ✅ Booking & Payment Tests: PASSED

══════════════════════════════════════════════════════════════════

✅ ALL TESTS PASSED!
Your platform is ready for deployment! 🚀

End Time: 2025-10-11T10:30:12.450Z
```

---

## 🔧 Customization

### **Change Base URL**

```bash
# Test against staging
BASE_URL=https://staging.yourapp.com npm run test:e2e

# Test against production (be careful!)
BASE_URL=https://yourapp.com npm run test:e2e
```

### **Add Custom Tests**

Create a new test file:

```javascript
// tests/my-custom-test.js
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function myTest() {
  const response = await fetch(`${BASE_URL}/api/my-endpoint`);
  console.log('Response:', await response.json());
}

myTest();
```

Run it:
```bash
node tests/my-custom-test.js
```

---

## 🐛 Troubleshooting

### **Test Fails: "Connection refused"**

**Cause:** Development server not running

**Fix:**
```bash
# Make sure server is running
npm run dev
```

---

### **Test Fails: "Missing environment variables"**

**Cause:** .env.local not configured

**Fix:**
```bash
# Check your .env.local file
cat .env.local

# Make sure all required variables are set
```

---

### **Test Fails: "Daily.co room creation failed"**

**Cause:** Invalid Daily.co API key

**Fix:**
```bash
# Verify your Daily.co credentials
echo $DAILY_API_KEY
echo $DAILY_DOMAIN

# Update in .env.local if needed
```

---

### **Tests Pass Locally but Fail in CI/CD**

**Cause:** Different environment or timing issues

**Fix:**
- Ensure CI/CD has same environment variables
- Add delays between tests if needed
- Check database state between runs

---

## 📈 CI/CD Integration

### **GitHub Actions**

```yaml
# .github/workflows/test.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_KEY }}
        run: npm run test:e2e
```

---

## ✅ Success Criteria

Your platform is ready for deployment when:

- ✅ All test suites pass
- ✅ Success rate is 100%
- ✅ No security vulnerabilities found
- ✅ All critical features working

---

## 📞 Support

If tests fail:

1. Check server logs
2. Verify environment variables
3. Check database connectivity
4. Review error messages carefully
5. Run individual test suites to isolate issues

---

**Happy Testing!** 🚀🧪

---

**Last Updated:** 2025-10-11  
**Version:** 1.0

