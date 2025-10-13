/**
 * Master Test Runner
 * Runs all E2E test suites in sequence
 * 
 * Run: node tests/run-all-tests.js
 */

const { spawn } = require('child_process');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const testSuites = [
  {
    name: 'Authentication Tests',
    file: 'e2e-auth-test.js',
    description: 'Tests user registration, login, and security',
  },
  {
    name: 'Video Session Tests',
    file: 'e2e-video-test.js',
    description: 'Tests video session creation and Daily.co integration',
  },
  {
    name: 'Booking & Payment Tests',
    file: 'e2e-booking-test.js',
    description: 'Tests availability, booking flow, and payment',
  },
];

class MasterTestRunner {
  constructor() {
    this.results = [];
    this.totalPassed = 0;
    this.totalFailed = 0;
  }

  async runTest(testSuite) {
    return new Promise((resolve) => {
      console.log(`\n${colors.bold}${colors.blue}${'='.repeat(70)}${colors.reset}`);
      console.log(`${colors.bold}${colors.cyan}Running: ${testSuite.name}${colors.reset}`);
      console.log(`${colors.yellow}${testSuite.description}${colors.reset}`);
      console.log(`${colors.blue}${'='.repeat(70)}${colors.reset}\n`);

      const testPath = path.join(__dirname, testSuite.file);
      const testProcess = spawn('node', [testPath], {
        stdio: 'inherit',
        env: { ...process.env },
      });

      testProcess.on('close', (code) => {
        const result = {
          name: testSuite.name,
          passed: code === 0,
          exitCode: code,
        };

        this.results.push(result);

        if (code === 0) {
          this.totalPassed++;
          console.log(`\n${colors.green}✅ ${testSuite.name} PASSED${colors.reset}`);
        } else {
          this.totalFailed++;
          console.log(`\n${colors.red}❌ ${testSuite.name} FAILED (exit code: ${code})${colors.reset}`);
        }

        resolve(result);
      });

      testProcess.on('error', (error) => {
        console.error(`${colors.red}Error running ${testSuite.name}: ${error.message}${colors.reset}`);
        this.results.push({
          name: testSuite.name,
          passed: false,
          error: error.message,
        });
        this.totalFailed++;
        resolve();
      });
    });
  }

  async runAll() {
    console.log(`${colors.cyan}${colors.bold}
╔════════════════════════════════════════════════════════════════════╗
║                     QUIET THERAPY PLATFORM                         ║
║                  COMPREHENSIVE E2E TEST SUITE                      ║
╚════════════════════════════════════════════════════════════════════╝
${colors.reset}`);

    console.log(`${colors.yellow}Start Time: ${new Date().toISOString()}${colors.reset}`);
    console.log(`${colors.yellow}Total Test Suites: ${testSuites.length}${colors.reset}`);
    console.log(`${colors.yellow}Environment: ${process.env.NODE_ENV || 'development'}${colors.reset}\n`);

    const startTime = Date.now();

    // Run tests sequentially
    for (const testSuite of testSuites) {
      await this.runTest(testSuite);
      
      // Brief pause between test suites
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    this.printSummary(duration);

    return this.totalFailed === 0;
  }

  printSummary(duration) {
    console.log(`\n${colors.bold}${colors.blue}${'='.repeat(70)}${colors.reset}`);
    console.log(`${colors.bold}${colors.blue}                      FINAL TEST SUMMARY${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(70)}${colors.reset}\n`);

    console.log(`Total Test Suites: ${testSuites.length}`);
    console.log(`${colors.green}Passed: ${this.totalPassed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${this.totalFailed}${colors.reset}`);
    console.log(`Duration: ${duration}s`);
    console.log(`Success Rate: ${((this.totalPassed / testSuites.length) * 100).toFixed(1)}%\n`);

    console.log('Individual Results:');
    this.results.forEach((result, index) => {
      const icon = result.passed ? `${colors.green}✅` : `${colors.red}❌`;
      const status = result.passed ? `${colors.green}PASSED` : `${colors.red}FAILED`;
      console.log(`  ${icon} ${result.name}: ${status}${colors.reset}`);
    });

    console.log(`\n${colors.blue}${'='.repeat(70)}${colors.reset}`);

    if (this.totalFailed > 0) {
      console.log(`\n${colors.red}${colors.bold}❌ SOME TESTS FAILED${colors.reset}`);
      console.log(`${colors.yellow}Review the output above for details.${colors.reset}\n`);
    } else {
      console.log(`\n${colors.green}${colors.bold}✅ ALL TESTS PASSED!${colors.reset}`);
      console.log(`${colors.green}Your platform is ready for deployment! 🚀${colors.reset}\n`);
    }

    console.log(`${colors.yellow}End Time: ${new Date().toISOString()}${colors.reset}\n`);
  }
}

// Check prerequisites
function checkPrerequisites() {
  console.log(`${colors.cyan}Checking prerequisites...${colors.reset}`);

  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missing = [];

  required.forEach(key => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    console.error(`${colors.red}Missing required environment variables:${colors.reset}`);
    missing.forEach(key => console.error(`  - ${key}`));
    console.error(`\n${colors.yellow}Please set these in your .env.local file${colors.reset}\n`);
    process.exit(1);
  }

  console.log(`${colors.green}✅ Prerequisites check passed${colors.reset}\n`);
}

// Main
async function main() {
  checkPrerequisites();

  const runner = new MasterTestRunner();
  const allPassed = await runner.runAll();

  process.exit(allPassed ? 0 : 1);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(`${colors.red}Uncaught exception: ${error.message}${colors.reset}`);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`${colors.red}Unhandled rejection at: ${promise}${colors.reset}`);
  console.error(`${colors.red}Reason: ${reason}${colors.reset}`);
  process.exit(1);
});

main();

