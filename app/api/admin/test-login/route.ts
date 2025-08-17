import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const testResults = {
    timestamp: new Date().toISOString(),
    steps: [] as any[],
    success: false,
    error: null as string | null
  }

  const addStep = (step: string, success: boolean, data?: any, error?: any) => {
    testResults.steps.push({
      step,
      success,
      data,
      error: error?.message || error
    })
  }

  try {
    console.log('🧪 Starting admin login test...')

    // Step 1: Check if Supabase connection works
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1)
      if (error) throw error
      addStep('Supabase Connection', true, 'Connected successfully')
    } catch (error) {
      addStep('Supabase Connection', false, null, error)
      throw error
    }

    // Step 2: Check if admin_auth table exists
    try {
      const { data, error } = await supabase.from('admin_auth').select('count').limit(1)
      if (error) throw error
      addStep('Admin Auth Table', true, 'Table exists')
    } catch (error) {
      addStep('Admin Auth Table', false, null, error)
      throw error
    }

    // Step 3: Check if admin_sessions table exists
    try {
      const { data, error } = await supabase.from('admin_sessions').select('count').limit(1)
      if (error) throw error
      addStep('Admin Sessions Table', true, 'Table exists')
    } catch (error) {
      addStep('Admin Sessions Table', false, null, error)
      throw error
    }

    // Step 4: Check if magic_links table exists
    try {
      const { data, error } = await supabase.from('magic_links').select('count').limit(1)
      if (error) throw error
      addStep('Magic Links Table', true, 'Table exists')
    } catch (error) {
      addStep('Magic Links Table', false, null, error)
      throw error
    }

    // Step 5: Check if admin user exists in users table
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'asereopeyemimichael@gmail.com')
        .single()
      
      if (error) throw error
      addStep('Admin User in Users Table', true, { id: user.id, email: user.email, user_type: user.user_type })
    } catch (error) {
      addStep('Admin User in Users Table', false, null, error)
      throw error
    }

    // Step 6: Check if admin user exists in admin_auth table
    try {
      const { data: adminAuth, error } = await supabase
        .from('admin_auth')
        .select('*')
        .eq('email', 'asereopeyemimichael@gmail.com')
        .single()
      
      if (error) throw error
      addStep('Admin User in Admin Auth Table', true, { id: adminAuth.id, role: adminAuth.role, permissions: adminAuth.permissions })
    } catch (error) {
      addStep('Admin User in Admin Auth Table', false, null, error)
      throw error
    }

    // Step 7: Test magic link creation
    try {
      const token = randomUUID()
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
      
      const { error } = await supabase
        .from('magic_links')
        .insert({
          email: 'asereopeyemimichael@gmail.com',
          token,
          type: 'login',
          auth_type: 'admin',
          expires_at: expiresAt.toISOString(),
          metadata: { auth_type: 'admin' }
        })

      if (error) throw error
      addStep('Magic Link Creation', true, { token: token.substring(0, 8) + '...', expiresAt: expiresAt.toISOString() })
    } catch (error) {
      addStep('Magic Link Creation', false, null, error)
      throw error
    }

    // Step 8: Test admin session creation
    try {
      const sessionToken = randomUUID()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      
      const { error } = await supabase
        .from('admin_sessions')
        .insert({
          user_id: 'test-user-id', // We'll use a test ID
          session_token: sessionToken,
          expires_at: expiresAt.toISOString()
        })

      if (error) throw error
      addStep('Admin Session Creation', true, { sessionToken: sessionToken.substring(0, 8) + '...', expiresAt: expiresAt.toISOString() })
    } catch (error) {
      addStep('Admin Session Creation', false, null, error)
      throw error
    }

    // Step 9: Test validate_auth_session function
    try {
      const { data, error } = await supabase.rpc('validate_auth_session', {
        session_token: 'test-token',
        auth_type: 'admin'
      })
      
      if (error) throw error
      addStep('Validate Auth Session Function', true, 'Function exists and can be called')
    } catch (error) {
      addStep('Validate Auth Session Function', false, null, error)
      // Don't throw here as this might be expected
    }

    // Step 10: Test add_auth_type function
    try {
      const { data, error } = await supabase.rpc('add_auth_type', {
        user_email: 'test@example.com',
        auth_type: 'admin',
        full_name: 'Test Admin'
      })
      
      if (error) throw error
      addStep('Add Auth Type Function', true, 'Function exists and can be called')
    } catch (error) {
      addStep('Add Auth Type Function', false, null, error)
      // Don't throw here as this might be expected
    }

    testResults.success = true
    console.log('✅ Admin login test completed successfully')

  } catch (error) {
    testResults.success = false
    testResults.error = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Admin login test failed:', error)
  }

  return NextResponse.json(testResults)
}
