import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    console.log('🔍 Checking magic links in database...')

    // Check if magic_links table exists and has the auth_type column
    const { data: magicLinks, error } = await supabase
      .from('magic_links')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('❌ Error fetching magic links:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch magic links',
        details: error
      })
    }

    console.log('✅ Magic links found:', magicLinks?.length || 0)

    return NextResponse.json({
      success: true,
      magicLinks: magicLinks || [],
      count: magicLinks?.length || 0
    })

  } catch (error) {
    console.error('❌ Debug magic links error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error
    })
  }
}
