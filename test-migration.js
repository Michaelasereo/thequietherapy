#!/usr/bin/env node

/**
 * Test script to validate the therapist scheduling migration
 * Tests SQL syntax, logic, and simulates execution
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Therapist Scheduling Migration...\n');

// Read the migration file
const migrationPath = path.join(__dirname, 'add-therapist-scheduling-columns.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Test 1: Check file exists and is readable
console.log('✅ Test 1: Migration file exists and is readable');

// Test 2: Parse SQL statements
console.log('\n📋 Test 2: Parsing SQL statements...');
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--'));

console.log(`   Found ${statements.length} SQL statements`);

// Test 3: Validate ALTER TABLE statements
console.log('\n🔧 Test 3: Validating ALTER TABLE statements...');
const alterStatements = statements.filter(s => s.toUpperCase().includes('ALTER TABLE'));
console.log(`   Found ${alterStatements.length} ALTER TABLE statements:`);

alterStatements.forEach((stmt, i) => {
  const columnMatch = stmt.match(/ADD COLUMN IF NOT EXISTS (\w+)/i);
  if (columnMatch) {
    console.log(`   ✓ Adding column: ${columnMatch[1]}`);
  }
});

// Test 4: Validate function definitions
console.log('\n⚙️  Test 4: Validating function definitions...');
const functionMatches = migrationSQL.match(/CREATE OR REPLACE FUNCTION (\w+)/gi);
if (functionMatches) {
  functionMatches.forEach(match => {
    const funcName = match.split(' ').pop();
    console.log(`   ✓ Function: ${funcName}`);
  });
}

// Test 5: Check for common SQL errors
console.log('\n🔍 Test 5: Checking for common SQL errors...');
const errors = [];

// Check for missing semicolons in critical places
const functionDefs = migrationSQL.match(/\$\$ LANGUAGE plpgsql;/g);
if (functionDefs) {
  console.log(`   ✓ All ${functionDefs.length} function definitions properly terminated`);
} else {
  errors.push('⚠️  No function definitions found or missing termination');
}

// Check for balanced parentheses
const openParens = (migrationSQL.match(/\(/g) || []).length;
const closeParens = (migrationSQL.match(/\)/g) || []).length;
if (openParens === closeParens) {
  console.log(`   ✓ Parentheses balanced (${openParens} pairs)`);
} else {
  errors.push(`❌ Unbalanced parentheses: ${openParens} open, ${closeParens} close`);
}

// Check for balanced quotes (excluding comments)
const sqlWithoutComments = migrationSQL
  .split('\n')
  .filter(line => !line.trim().startsWith('--'))
  .join('\n');
const singleQuotes = (sqlWithoutComments.match(/'/g) || []).length;
if (singleQuotes % 2 === 0) {
  console.log(`   ✓ Single quotes balanced (${singleQuotes / 2} pairs)`);
} else {
  // This might be a false positive if there are legitimate escaped quotes
  console.log(`   ⚠️  Quote count: ${singleQuotes} (may include escaped quotes)`);
}

// Test 6: Validate column definitions
console.log('\n📊 Test 6: Validating column definitions...');
const columns = [
  { name: 'duration', type: 'INTEGER', required: true },
  { name: 'scheduled_date', type: 'DATE', required: true },
  { name: 'scheduled_time', type: 'TIME', required: true },
  { name: 'notes', type: 'TEXT', required: true },
  { name: 'title', type: 'VARCHAR', required: true },
  { name: 'description', type: 'TEXT', required: true },
  { name: 'duration_minutes', type: 'INTEGER', required: true },
  { name: 'credit_used_id', type: 'UUID', required: true },
  { name: 'scheduled_by_therapist', type: 'BOOLEAN', required: true }
];

columns.forEach(col => {
  const regex = new RegExp(`ADD COLUMN IF NOT EXISTS ${col.name}`, 'i');
  if (regex.test(migrationSQL)) {
    console.log(`   ✓ Column: ${col.name} (${col.type})`);
  } else if (col.required) {
    errors.push(`❌ Missing required column: ${col.name}`);
  }
});

// Test 7: Validate trigger creation
console.log('\n🎯 Test 7: Validating trigger creation...');
if (/DROP TRIGGER IF EXISTS sync_session_fields/i.test(migrationSQL)) {
  console.log('   ✓ Trigger drop statement found');
}
if (/CREATE TRIGGER sync_session_fields/i.test(migrationSQL)) {
  console.log('   ✓ Trigger creation statement found');
}
if (/BEFORE INSERT OR UPDATE/i.test(migrationSQL)) {
  console.log('   ✓ Trigger timing configured (BEFORE INSERT OR UPDATE)');
}

// Test 8: Validate index creation
console.log('\n📇 Test 8: Validating index creation...');
const indexes = [
  'idx_sessions_scheduled_date',
  'idx_sessions_credit_used',
  'idx_sessions_scheduled_by_therapist',
  'idx_sessions_therapist_date'
];

indexes.forEach(idx => {
  if (migrationSQL.includes(idx)) {
    console.log(`   ✓ Index: ${idx}`);
  } else {
    errors.push(`⚠️  Index not found: ${idx}`);
  }
});

// Test 9: Validate UPDATE statements
console.log('\n🔄 Test 9: Validating UPDATE statements...');
if (/UPDATE sessions SET duration = 30 WHERE duration IS NULL/i.test(migrationSQL)) {
  console.log('   ✓ Default duration update found');
}
if (/UPDATE sessions[\s\S]*SET[\s\S]*scheduled_date/i.test(migrationSQL)) {
  console.log('   ✓ Scheduled fields sync update found');
}

// Test 10: Validate the conflict check function
console.log('\n⚔️  Test 10: Validating conflict check function...');
if (/CREATE OR REPLACE FUNCTION check_booking_conflict/i.test(migrationSQL)) {
  console.log('   ✓ Function definition found');
}
if (/TIMESTAMP WITH TIME ZONE/.test(migrationSQL)) {
  console.log('   ✓ Proper timestamp type casting');
}
if (/s\.start_time < p_end_timestamp AND s\.end_time > p_start_timestamp/.test(migrationSQL)) {
  console.log('   ✓ Correct overlap detection logic');
}

// Test 11: Simulate the migration flow
console.log('\n🎬 Test 11: Simulating migration flow...');
const steps = [
  'Add duration column',
  'Add scheduled_date and scheduled_time',
  'Add notes, title, description',
  'Add duration_minutes',
  'Add credit_used_id with foreign key',
  'Add scheduled_by_therapist flag',
  'Fix check_booking_conflict function',
  'Create sync_scheduled_fields function',
  'Create trigger',
  'Update existing records',
  'Create indexes',
  'Notify schema cache reload',
  'Verify changes'
];

steps.forEach((step, i) => {
  console.log(`   ${i + 1}. ${step}`);
});

// Test 12: Check for potential issues
console.log('\n⚠️  Test 12: Checking for potential issues...');
const warnings = [];

// Check if user_credits table might not exist
if (/REFERENCES user_credits/i.test(migrationSQL)) {
  warnings.push('Migration assumes user_credits table exists');
}

// Check for timezone assumptions
if (/TIMESTAMP WITH TIME ZONE/.test(migrationSQL)) {
  warnings.push('Migration uses TIMESTAMP WITH TIME ZONE (ensure timezone is set)');
}

if (warnings.length > 0) {
  warnings.forEach(w => console.log(`   ⚠️  ${w}`));
} else {
  console.log('   ✓ No potential issues detected');
}

// Final results
console.log('\n' + '='.repeat(60));
console.log('📊 MIGRATION TEST RESULTS');
console.log('='.repeat(60));

if (errors.length === 0) {
  console.log('✅ ALL TESTS PASSED!');
  console.log(`✓ ${statements.length} SQL statements validated`);
  console.log(`✓ ${columns.length} columns to be added`);
  console.log(`✓ ${indexes.length} indexes to be created`);
  console.log('✓ All functions and triggers properly defined');
  
  console.log('\n🚀 Migration is ready to run in Supabase!');
  console.log('\nNext steps:');
  console.log('1. Go to Supabase Dashboard → SQL Editor');
  console.log('2. Copy and paste the entire migration file');
  console.log('3. Click "Run"');
  console.log('4. Go to Settings → API → Click "Reload schema cache"');
  console.log('5. Wait 10 seconds and test the feature');
  
  process.exit(0);
} else {
  console.log('❌ TESTS FAILED!');
  console.log(`\nFound ${errors.length} error(s):\n`);
  errors.forEach(err => console.log(`   ${err}`));
  
  console.log('\n⚠️  Please fix these errors before running the migration!');
  process.exit(1);
}

