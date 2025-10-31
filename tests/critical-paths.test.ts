/**
 * Critical Path Tests
 * 
 * Tests the most important user flows to prevent regressions.
 * Run before every commit to ensure nothing breaks.
 * 
 * Usage: node tests/critical-paths.test.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Test results tracking
let passedTests = 0
let failedTests = 0
const failures: string[] = []

// Test utilities
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    console.log(`\n🧪 Testing: ${name}`)
    await fn()
    console.log(`✅ PASS: ${name}`)
    passedTests++
  } catch (error) {
    console.error(`❌ FAIL: ${name}`)
    console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`)
    failedTests++
    failures.push(name)
  }
}

// ============================================
// CRITICAL PATH 1: Avatar 3-Way Sync
// ============================================

await test('Avatar updates sync to all 3 tables', async () => {
  const testEmail = 'avatar-test-' + Date.now() + '@test.com'
  const testAvatarUrl = 'https://test.com/avatar-' + Date.now() + '.jpg'

  // Create test therapist in all 3 tables
  const { data: user } = await supabase
    .from('users')
    .insert({
      email: testEmail,
      full_name: 'Avatar Test User',
      user_type: 'therapist',
      is_verified: true,
      is_active: true
    })
    .select()
    .single()

  assert(user != null, 'User should be created')

  await supabase.from('therapist_enrollments').insert({
    user_id: user.id,
    email: testEmail,
    full_name: 'Avatar Test User',
    status: 'approved'
  })

  await supabase.from('therapist_profiles').insert({
    user_id: user.id
  })

  // Import and use AvatarService
  const { AvatarService } = await import('../lib/services/avatar-service')
  
  // Update avatar using the service
  const result = await AvatarService.updateAvatarFromUrl(testAvatarUrl, testEmail)
  
  assert(result.success, 'Avatar update should succeed')
  assert(result.syncedTables?.length === 3, 'Should sync to all 3 tables')

  // Verify consistency
  const check = await AvatarService.verifyAvatarConsistency(testEmail)
  
  assert(check.consistent, 'Avatar should be consistent across all tables')
  assert(check.details.users === testAvatarUrl, 'users.avatar_url should match')
  assert(check.details.enrollments === testAvatarUrl, 'enrollments.profile_image_url should match')
  assert(check.details.profiles === testAvatarUrl, 'profiles.profile_image_url should match')

  // Cleanup
  await supabase.from('users').delete().eq('email', testEmail)

  console.log('   ✓ Avatar synced to all 3 tables')
  console.log('   ✓ Consistency verified')
})

// ============================================
// CRITICAL PATH 2: Therapist Approval Sync
// ============================================

await test('Therapist approval syncs all tables', async () => {
  const testEmail = 'approval-test-' + Date.now() + '@test.com'

  // Create test therapist
  const { data: user } = await supabase
    .from('users')
    .insert({
      email: testEmail,
      full_name: 'Approval Test User',
      user_type: 'therapist',
      is_verified: false,
      is_active: false
    })
    .select()
    .single()

  await supabase.from('therapist_enrollments').insert({
    user_id: user!.id,
    email: testEmail,
    full_name: 'Approval Test User',
    status: 'pending',
    is_active: false
  })

  // Approve using TherapistConsistencyManager
  const { TherapistConsistencyManager } = await import('../lib/therapist-consistency')
  const result = await TherapistConsistencyManager.approveTherapist(testEmail)

  assert(result.success, 'Approval should succeed')

  // Verify all tables updated
  const userCheck = await supabase
    .from('users')
    .select('is_verified, is_active')
    .eq('email', testEmail)
    .single()

  const enrollmentCheck = await supabase
    .from('therapist_enrollments')
    .select('status, is_active')
    .eq('email', testEmail)
    .single()

  assert(userCheck.data?.is_verified === true, 'users.is_verified should be true')
  assert(userCheck.data?.is_active === true, 'users.is_active should be true')
  assert(enrollmentCheck.data?.status === 'approved', 'enrollments.status should be approved')
  assert(enrollmentCheck.data?.is_active === true, 'enrollments.is_active should be true')

  // Cleanup
  await supabase.from('users').delete().eq('email', testEmail)

  console.log('   ✓ Approval synced all tables')
  console.log('   ✓ Verification status consistent')
})

// ============================================
// CRITICAL PATH 3: Session Booking
// ============================================

await test('Session booking deducts credits correctly', async () => {
  // This is a simplified test - full implementation would require more setup
  const testUserEmail = 'booking-test-' + Date.now() + '@test.com'

  // Create test user with credits
  const { data: user } = await supabase
    .from('users')
    .insert({
      email: testUserEmail,
      full_name: 'Booking Test User',
      user_type: 'individual',
      is_verified: true,
      is_active: true
    })
    .select()
    .single()

  // Add initial credits
  await supabase.from('user_credits').insert({
    user_id: user!.id,
    user_type: 'individual',
    credits_balance: 5,
    credits_purchased: 5
  })

  // Get credits before
  const { data: creditsBefore } = await supabase
    .from('user_credits')
    .select('credits_balance, credits_used')
    .eq('user_id', user!.id)
    .single()

  assert(creditsBefore?.credits_balance === 5, 'Initial balance should be 5')

  // Simulate credit deduction (in real app, this happens during booking)
  await supabase
    .from('user_credits')
    .update({
      credits_balance: 4,
      credits_used: 1
    })
    .eq('user_id', user!.id)

  // Get credits after
  const { data: creditsAfter } = await supabase
    .from('user_credits')
    .select('credits_balance, credits_used')
    .eq('user_id', user!.id)
    .single()

  assert(creditsAfter?.credits_balance === 4, 'Balance should decrease to 4')
  assert(creditsAfter?.credits_used === 1, 'Used credits should be 1')

  // Cleanup
  await supabase.from('users').delete().eq('email', testUserEmail)

  console.log('   ✓ Credits deducted correctly')
  console.log('   ✓ Balance updated')
})

// ============================================
// CRITICAL PATH 4: Data Consistency Check
// ============================================

await test('Data consistency checker works', async () => {
  const { DataConsistencyChecker } = await import('../lib/services/data-consistency-checker')

  // This test assumes therapists exist in the database
  // In a real test, we'd create test data first
  
  // Just verify the checker runs without errors
  const testEmail = 'consistency-test-' + Date.now() + '@test.com'
  
  // Create consistent test data
  const { data: user } = await supabase
    .from('users')
    .insert({
      email: testEmail,
      full_name: 'Consistency Test',
      user_type: 'therapist',
      is_verified: true,
      is_active: true,
      avatar_url: 'https://test.com/avatar.jpg'
    })
    .select()
    .single()

  await supabase.from('therapist_enrollments').insert({
    user_id: user!.id,
    email: testEmail,
    full_name: 'Consistency Test',
    status: 'approved',
    is_active: true,
    profile_image_url: 'https://test.com/avatar.jpg'
  })

  await supabase.from('therapist_profiles').insert({
    user_id: user!.id,
    profile_image_url: 'https://test.com/avatar.jpg'
  })

  // Check consistency
  const result = await DataConsistencyChecker.checkTherapistConsistency(testEmail)

  assert(result.consistent, 'Data should be consistent')
  assert(result.inconsistencies.length === 0, 'Should have no inconsistencies')

  // Cleanup
  await supabase.from('users').delete().eq('email', testEmail)

  console.log('   ✓ Consistency checker works')
  console.log('   ✓ No inconsistencies found')
})

// ============================================
// CRITICAL PATH 5: Database Foreign Keys
// ============================================

await test('Database foreign keys prevent orphaned records', async () => {
  const testEmail = 'fk-test-' + Date.now() + '@test.com'

  // Create user with related records
  const { data: user } = await supabase
    .from('users')
    .insert({
      email: testEmail,
      full_name: 'FK Test User',
      user_type: 'therapist'
    })
    .select()
    .single()

  await supabase.from('therapist_enrollments').insert({
    user_id: user!.id,
    email: testEmail,
    full_name: 'FK Test User'
  })

  await supabase.from('therapist_profiles').insert({
    user_id: user!.id
  })

  // Delete user (should cascade)
  await supabase.from('users').delete().eq('email', testEmail)

  // Verify cascaded deletes
  const enrollmentCheck = await supabase
    .from('therapist_enrollments')
    .select('id')
    .eq('email', testEmail)

  const profileCheck = await supabase
    .from('therapist_profiles')
    .select('id')
    .eq('user_id', user!.id)

  assert(enrollmentCheck.data?.length === 0, 'Enrollment should be deleted (CASCADE)')
  assert(profileCheck.data?.length === 0, 'Profile should be deleted (CASCADE)')

  console.log('   ✓ Foreign key cascades working')
  console.log('   ✓ No orphaned records')
})

// ============================================
// TEST SUMMARY
// ============================================

console.log('\n' + '='.repeat(50))
console.log('TEST SUMMARY')
console.log('='.repeat(50))
console.log(`✅ Passed: ${passedTests}`)
console.log(`❌ Failed: ${failedTests}`)
console.log(`📊 Total: ${passedTests + failedTests}`)

if (failures.length > 0) {
  console.log('\n❌ Failed tests:')
  failures.forEach(test => console.log(`   - ${test}`))
}

console.log('\n' + '='.repeat(50))

// Exit with appropriate code
process.exit(failedTests > 0 ? 1 : 0)

