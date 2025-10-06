import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireApiAuth } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Admin Users API called');

    // 1. SECURE Authentication Check - allow both admin and therapist
    const authResult = await requireApiAuth(['admin', 'therapist']);
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: 401 });
    }

    const { session } = authResult;
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('user_type') || 'individual';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

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

    // Fetch users based on type
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, user_type, is_active, is_verified, created_at')
      .eq('user_type', userType)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Users fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    console.log('✅ Users fetched successfully:', users?.length || 0);

    return NextResponse.json({
      success: true,
      users: users || []
    });

  } catch (error) {
    console.error('Admin Users API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}