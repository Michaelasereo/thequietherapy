import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection by querying a simple table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    console.log('🔍 Users table test:', { users, usersError });

    // Test magic_links table
    const { data: magicLinks, error: magicLinksError } = await supabase
      .from('magic_links')
      .select('count')
      .limit(1);

    console.log('🔍 Magic links table test:', { magicLinks, magicLinksError });

    // Test user_sessions table
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('count')
      .limit(1);

    console.log('🔍 User sessions table test:', { sessions, sessionsError });

    // Get table counts
    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: magicLinksCount } = await supabase
      .from('magic_links')
      .select('*', { count: 'exact', head: true });

    const { count: sessionsCount } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      connection: 'OK',
      tables: {
        users: {
          accessible: !usersError,
          error: usersError?.message,
          count: usersCount
        },
        magic_links: {
          accessible: !magicLinksError,
          error: magicLinksError?.message,
          count: magicLinksCount
        },
        user_sessions: {
          accessible: !sessionsError,
          error: sessionsError?.message,
          count: sessionsCount
        }
      },
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'
      }
    });

  } catch (error) {
    console.error('❌ Database connection test error:', error);
    return NextResponse.json({ 
      error: 'Database connection failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
