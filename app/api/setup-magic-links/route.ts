import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // First, let's check if the magic_links table exists by trying to query it
    const { data: testQuery, error: testError } = await supabase
      .from('magic_links')
      .select('id')
      .limit(1)

    if (testError) {
      // Table doesn't exist, we need to create it manually
      console.log('Magic links table does not exist')
      
      // Since we can't create tables via the client, let's check if we can insert a test record
      // This will help us understand what's happening
      return NextResponse.json({ 
        error: 'Magic links table does not exist and cannot be created via client',
        suggestion: 'Please run the setup-magic-links.sql script in your Supabase dashboard',
        testError: testError
      })
    }

    // Table exists, let's check how many records
    const { data: magicLinks, error: countError } = await supabase
      .from('magic_links')
      .select('*', { count: 'exact' })

    if (countError) {
      return NextResponse.json({ 
        error: 'Failed to count magic links', 
        details: countError 
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Magic links table exists',
      count: magicLinks?.length || 0
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error 
    })
  }
}
