import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    console.log('🔍 Testing magic_links table...');
    
    // Get all magic links
    const { data: magicLinks, error: magicLinksError } = await supabase
      .from('magic_links')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    console.log('🔍 Magic links query result:', { magicLinks, magicLinksError });

    // Get recent magic links for our test email
    const { data: recentLinks, error: recentError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('email', 'asereopeyemimichael@gmail.com')
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('🔍 Recent links for test email:', { recentLinks, recentError });

    // Check table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('magic_links')
      .select('*')
      .limit(1);

    return NextResponse.json({
      success: true,
      allMagicLinks: magicLinks || [],
      recentLinksForEmail: recentLinks || [],
      tableExists: !tableError,
      tableError: tableError?.message,
      magicLinksError: magicLinksError?.message,
      recentError: recentError?.message,
      totalCount: magicLinks?.length || 0
    });

  } catch (error) {
    console.error('❌ Test magic links error:', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
