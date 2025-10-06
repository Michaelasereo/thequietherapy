#!/usr/bin/env node

/**
 * Development Setup Test Script
 * 
 * Tests the development environment setup for video flow testing.
 * Run this script to verify all development tools are working correctly.
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Testing Development Setup...\n');

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';
console.log(`Environment: ${process.env.NODE_ENV || 'undefined'}`);
console.log(`Development Mode: ${isDevelopment ? '✅ Enabled' : '❌ Disabled'}\n`);

// Check if required files exist
const requiredFiles = [
  'lib/dev-time-utils.ts',
  'components/dev-session-setup.tsx',
  'app/api/dev/book-now/route.ts',
  'app/api/dev/seed-test-sessions/route.ts'
];

console.log('📁 Checking Required Files:');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  const exists = fs.existsSync(filePath);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

console.log(`\nFiles Check: ${allFilesExist ? '✅ All files exist' : '❌ Missing files'}\n`);

// Check modified files
const modifiedFiles = [
  'lib/availability-manager.ts',
  'app/api/sessions/book/route.ts',
  'app/dashboard/layout.tsx',
  'app/therapist/dashboard/layout.tsx'
];

console.log('🔧 Checking Modified Files:');
let allModified = true;

modifiedFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  const exists = fs.existsSync(filePath);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allModified = false;
});

console.log(`\nModified Files: ${allModified ? '✅ All files exist' : '❌ Missing files'}\n`);

// Test development utilities
console.log('🧪 Testing Development Utilities:');

try {
  // Check if dev-time-utils can be imported
  const devTimeUtilsPath = path.join(process.cwd(), 'lib/dev-time-utils.ts');
  const devTimeUtilsContent = fs.readFileSync(devTimeUtilsPath, 'utf8');
  
  const hasRequiredFunctions = [
    'getTestTime',
    'setTestTimeOffset', 
    'canBookImmediately',
    'isTestTherapist',
    'createTestSessionTime'
  ].every(func => devTimeUtilsContent.includes(`export function ${func}`));
  
  console.log(`  ${hasRequiredFunctions ? '✅' : '❌'} Dev time utilities functions`);
  
} catch (error) {
  console.log(`  ❌ Error reading dev-time-utils.ts: ${error.message}`);
}

// Check availability manager modifications
try {
  const availabilityManagerPath = path.join(process.cwd(), 'lib/availability-manager.ts');
  const availabilityManagerContent = fs.readFileSync(availabilityManagerPath, 'utf8');
  
  const hasDevelopmentBypass = availabilityManagerContent.includes('🚀 DEVELOPMENT BYPASS');
  console.log(`  ${hasDevelopmentBypass ? '✅' : '❌'} Availability manager development bypass`);
  
} catch (error) {
  console.log(`  ❌ Error reading availability-manager.ts: ${error.message}`);
}

console.log('\n🎯 Development Setup Summary:');
console.log('='.repeat(50));

if (isDevelopment && allFilesExist && allModified) {
  console.log('✅ Development setup is READY!');
  console.log('\n🚀 Quick Start Guide:');
  console.log('1. Start your development server: npm run dev');
  console.log('2. Open your dashboard');
  console.log('3. Look for the "Dev Tools" panel in the bottom-right corner');
  console.log('4. Click "Test Session" to create an instant test session');
  console.log('5. Use "Time Travel" controls to test different scenarios');
  console.log('6. Use "Seed Data" to create multiple test sessions');
  
  console.log('\n💡 Pro Tips:');
  console.log('• Test therapists bypass all availability checks');
  console.log('• Time travel affects booking validation');
  console.log('• All dev tools are automatically hidden in production');
  console.log('• You can now test video flows in 2 minutes instead of 45!');
  
} else {
  console.log('❌ Development setup needs attention:');
  if (!isDevelopment) console.log('  • Set NODE_ENV=development');
  if (!allFilesExist) console.log('  • Some required files are missing');
  if (!allModified) console.log('  • Some files need to be modified');
}

console.log('\n🎉 Happy coding!');
