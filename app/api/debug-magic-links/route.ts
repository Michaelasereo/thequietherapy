import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Get all magic links
    const { data: magicLinks, error } = await supabase
      .from('magic_links')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch magic links', details: error })
    }

    return NextResponse.json({
      magicLinks,
      count: magicLinks?.length || 0
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error 
    })
  }
}
