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

    // Fetch user credits from user_credits table - only active, non-expired credits
    const now = new Date().toISOString()
    const { data: creditRecords, error: creditsError } = await supabase
      .from('user_credits')
      .select('credits_balance, credits_purchased, credits_used, expires_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${now}`) // Only non-expired credits
      .order('created_at', { ascending: false });

    if (creditsError && creditsError.code !== 'PGRST116') {
      console.error('❌ User credits fetch error:', creditsError);
      return NextResponse.json(
        { error: 'Failed to fetch user credits' },
        { status: 500 }
      );
    }

    // Calculate total credits from active records
    const totalCredits = creditRecords?.reduce((sum, record) => {
      return sum + (record.credits_balance || 0);
    }, 0) || 0;

    const totalPurchased = creditRecords?.reduce((sum, record) => {
      return sum + (record.credits_purchased || 0);
    }, 0) || 0;

    console.log('✅ User credits fetched successfully:', { totalCredits, totalPurchased });

    return NextResponse.json({
      success: true,
      credits: {
        balance: totalCredits,
        totalPurchased: totalPurchased,
        total_credits: totalCredits,
        free_credits: 0,
        paid_credits: totalCredits
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