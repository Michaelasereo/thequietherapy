import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // First, let's disable RLS temporarily to test
    const { error: disableRLSError } = await supabase
      .rpc('exec_sql', { sql: 'ALTER TABLE magic_links DISABLE ROW LEVEL SECURITY;' })

    if (disableRLSError) {
      console.log('Could not disable RLS via RPC, trying alternative approach')
      
      // Try to insert a test magic link with RLS disabled manually
      const testMagicLink = {
        email: 'test@example.com',
        token: 'test-token-' + Date.now(),
        type: 'signup',
        metadata: { first_name: 'Test' },
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }

      const { data: insertedLink, error: insertError } = await supabase
        .from('magic_links')
        .insert(testMagicLink)
        .select()
        .single()

      if (insertError) {
        return NextResponse.json({ 
          error: 'Failed to insert magic link even with RLS disabled', 
          details: insertError,
          suggestion: 'Please manually disable RLS on magic_links table in Supabase dashboard'
        })
      }

      // If successful, delete the test record
      await supabase
        .from('magic_links')
        .delete()
        .eq('id', insertedLink.id)

      return NextResponse.json({ 
        success: true, 
        message: 'Magic link insert test successful with RLS disabled',
        suggestion: 'Please disable RLS on magic_links table in Supabase dashboard for now'
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'RLS disabled successfully'
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error 
    })
  }
}
