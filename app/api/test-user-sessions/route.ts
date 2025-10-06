import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Check if user_sessions table exists
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_sessions')
      .select('*')
      .limit(1);

    console.log('🔍 Table check result:', { tableInfo, tableError });

    // Get all sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('*');

    console.log('🔍 All sessions:', { sessions, sessionsError });

    // Check table structure
    const { data: structure, error: structureError } = await supabase
      .rpc('get_table_structure', { table_name: 'user_sessions' })
      .catch(() => ({ data: null, error: 'RPC not available' }));

    return NextResponse.json({
      tableExists: !tableError,
      tableError: tableError?.message,
      sessionsCount: sessions?.length || 0,
      sessions: sessions,
      structure: structure,
      structureError: structureError
    });

  } catch (error) {
    console.error('❌ Test user sessions error:', error);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
}
