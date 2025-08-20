const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testDatabaseSetup() {
  console.log('🧪 Testing database setup...\n')

  const tests = [
    {
      name: 'Check sessions table',
      query: () => supabase.from('sessions').select('id').limit(1)
    },
    {
      name: 'Check session_notes table',
      query: () => supabase.from('session_notes').select('id').limit(1)
    },
    {
      name: 'Check session_processing_queue table',
      query: () => supabase.from('session_processing_queue').select('id').limit(1)
    },
    {
      name: 'Check session_processing_errors table',
      query: () => supabase.from('session_processing_errors').select('id').limit(1)
    },
    {
      name: 'Check notifications table',
      query: () => supabase.from('notifications').select('id').limit(1)
    },
    {
      name: 'Check users table',
      query: () => supabase.from('users').select('id').limit(1)
    }
  ]

  let allPassed = true

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`)
      const { data, error } = await test.query()
      
      if (error) {
        console.log(`❌ ${test.name} - FAILED:`, error.message)
        allPassed = false
      } else {
        console.log(`✅ ${test.name} - PASSED`)
      }
    } catch (error) {
      console.log(`❌ ${test.name} - FAILED:`, error.message)
      allPassed = false
    }
  }

  console.log('\n' + '='.repeat(50))
  
  if (allPassed) {
    console.log('🎉 All database tests passed!')
    console.log('✅ Your database is ready for video features')
  } else {
    console.log('❌ Some database tests failed')
    console.log('🔧 Please run the database setup script:')
    console.log('   Execute create-session-processing-queue.sql in your Supabase SQL editor')
  }

  console.log('\n📋 Required tables:')
  console.log('   - sessions')
  console.log('   - session_notes') 
  console.log('   - session_processing_queue')
  console.log('   - session_processing_errors')
  console.log('   - notifications')
  console.log('   - users')
}

// Run the test
testDatabaseSetup().catch(console.error)
