import { NextResponse } from 'next/server'
import { syncUserToSupabaseAuth } from '@/lib/supabase-auth-sync'

export async function POST(request: Request) {
  try {
    const { email, full_name, user_type } = await request.json()
    
    console.log('🧪 Testing user sync with:', { email, full_name, user_type })
    
    const syncResult = await syncUserToSupabaseAuth({
      email: email || 'test@example.com',
      full_name: full_name || 'Test User',
      user_type: user_type || 'individual',
      metadata: {
        test_user: true,
        created_at: new Date().toISOString()
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'User sync test completed',
      result: syncResult
    })
  } catch (error) {
    console.error('❌ Error in test-user-sync:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to test user sync',
      details: error
    }, { status: 500 })
  }
}
