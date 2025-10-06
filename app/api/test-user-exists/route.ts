import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    console.log('🔍 Testing user existence for email:', email);
    
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    console.log('🔍 User query result:', { user, userError });

    // Check all users with similar email
    const { data: similarUsers, error: similarError } = await supabase
      .from('users')
      .select('*')
      .ilike('email', `%${email.split('@')[0]}%`);

    console.log('🔍 Similar users:', { similarUsers, similarError });

    return NextResponse.json({
      success: true,
      userExists: !userError && user !== null,
      user: user,
      userError: userError?.message,
      similarUsers: similarUsers || [],
      similarError: similarError?.message,
      searchedEmail: email
    });

  } catch (error) {
    console.error('❌ Test user exists error:', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
