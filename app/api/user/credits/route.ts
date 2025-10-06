import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireApiAuth } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 User Credits API called');

    // 1. SECURE Authentication Check
    const authResult = await requireApiAuth(['individual']);
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: 401 });
    }

    const { session } = authResult;
    const userId = session.user.id;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ Supabase client initialized');

    // Fetch user credits from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('❌ User fetch error:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user credits' },
        { status: 500 }
      );
    }

    console.log('✅ User credits fetched successfully');

    return NextResponse.json({
      success: true,
      credits: {
        balance: user.credits || 0,
        totalPurchased: user.credits || 0 // Using same value since we only have one credits column
      }
    });

  } catch (error) {
    console.error('User Credits API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}