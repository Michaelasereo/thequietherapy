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

    // Fetch user credits from user_credits table
    // Only select columns that definitely exist (avoid expires_at which may not exist)
    let { data: creditRecords, error: creditsError } = await supabase
      .from('user_credits')
      .select('id, credits_balance, credits_purchased, credits_used')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // If query fails due to missing columns, try with minimal columns
    if (creditsError && creditsError.message?.includes('column')) {
      console.warn('⚠️ Column error detected, retrying with minimal columns:', creditsError.message);
      const retryResult = await supabase
        .from('user_credits')
        .select('id, credits_balance, credits_purchased, credits_used')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (retryResult.error) {
        console.error('❌ Retry also failed:', retryResult.error);
      } else {
        creditRecords = retryResult.data;
        creditsError = retryResult.error;
      }
    }
    
    // Try to get expires_at and status separately if they exist (optional)
    // This won't fail the query if columns don't exist
    if (!creditsError && creditRecords && creditRecords.length > 0) {
      const recordIds = creditRecords.map((r: any) => r.id).filter((id: any) => id != null);
      
      if (recordIds.length > 0) {
        try {
          const fullQuery = await supabase
            .from('user_credits')
            .select('id, expires_at, status')
            .eq('user_id', userId)
            .in('id', recordIds)
          
          if (!fullQuery.error && fullQuery.data) {
            // Merge optional fields
            const fullDataMap = new Map(fullQuery.data.map((r: any) => [r.id, r]));
            creditRecords = creditRecords.map((record: any) => ({
              ...record,
              expires_at: fullDataMap.get(record.id)?.expires_at || null,
              status: fullDataMap.get(record.id)?.status || null
            }));
          } else if (fullQuery.error && fullQuery.error.message?.includes('column')) {
            // Expected - columns don't exist, that's okay
            console.log('ℹ️ Optional columns (expires_at, status) not available in schema');
          }
        } catch (optionalError) {
          // Silently ignore - these columns are optional
          console.log('ℹ️ Optional columns (expires_at, status) query failed (expected if columns don\'t exist)');
        }
      }
    }

    if (creditsError) {
      // PGRST116 = no rows found, which is okay
      if (creditsError.code === 'PGRST116' || creditsError.message?.includes('No rows found')) {
        console.log('ℹ️ No credit records found for user, returning empty credits');
        return NextResponse.json({
          success: true,
          credits: {
            balance: 0,
            totalPurchased: 0,
            total_credits: 0,
            free_credits: 0,
            paid_credits: 0
          }
        });
      }
      // Other errors - log and return error
      console.error('❌ User credits fetch error:', {
        code: creditsError.code,
        message: creditsError.message,
        details: creditsError.details,
        hint: creditsError.hint
      });
      return NextResponse.json(
        { 
          error: 'Failed to fetch user credits', 
          details: creditsError.message,
          code: creditsError.code
        },
        { status: 500 }
      );
    }

    console.log('📊 Raw credit records found:', {
      count: creditRecords?.length || 0,
      records: creditRecords?.map((r: any) => ({
        balance: r.credits_balance,
        purchased: r.credits_purchased,
        used: r.credits_used,
        expires_at: r.expires_at,
        status: r.status || 'N/A'
      })) || []
    });

    // Filter active and non-expired records
    const now = new Date();
    const activeRecords = (creditRecords || []).filter((record: any) => {
      // Filter by status if column exists and is set (but be lenient in dev)
      if (record && 'status' in record && record.status && record.status !== 'active') {
        // In development, be less strict
        if (process.env.NODE_ENV === 'development' && !record.expires_at) {
          console.log('⚠️ Including non-active credit in dev mode:', record);
          // Still include it in dev if it doesn't have an expiration
        } else {
          return false;
        }
      }
      // Only filter out expired credits if they have an expiration date
      // Credits without expiration dates are valid indefinitely
      if (record?.expires_at) {
        try {
          const expiresAt = new Date(record.expires_at);
          if (isNaN(expiresAt.getTime())) {
            // Invalid date, keep the record
            return true;
          }
          if (expiresAt <= now) {
            console.log('⏰ Filtering out expired credit:', {
              balance: record.credits_balance,
              expired_at: record.expires_at
            });
            return false; // Credit has expired
          }
        } catch (dateError) {
          // If date parsing fails, keep the record
          console.warn('⚠️ Could not parse expires_at:', record.expires_at);
          return true;
        }
      }
      return true;
    });

    console.log('📊 Active credit records after filtering:', {
      count: activeRecords.length,
      records: activeRecords.map(r => ({
        balance: r.credits_balance,
        purchased: r.credits_purchased,
        used: r.credits_used
      }))
    });

    // Calculate total credits from active records
    const totalCredits = activeRecords.reduce((sum, record) => {
      return sum + (record.credits_balance || 0);
    }, 0);

    const totalPurchased = activeRecords.reduce((sum, record) => {
      return sum + (record.credits_purchased || 0);
    }, 0);

    console.log('✅ User credits calculated:', { 
      totalCredits, 
      totalPurchased,
      rawCount: creditRecords?.length || 0,
      activeCount: activeRecords.length
    });

    return NextResponse.json({
      success: true,
      credits: {
        balance: totalCredits,
        totalPurchased: totalPurchased,
        total_credits: totalCredits,
        free_credits: 0,
        paid_credits: totalCredits
      },
      debug: process.env.NODE_ENV === 'development' ? {
        raw_records_count: creditRecords?.length || 0,
        active_records_count: activeRecords.length,
        all_records: creditRecords?.map(r => ({
          balance: r.credits_balance,
          purchased: r.credits_purchased,
          used: r.credits_used,
          expires_at: (r as any).expires_at,
          status: (r as any).status || 'N/A'
        })) || []
      } : undefined
    });

  } catch (error) {
    console.error('❌ User Credits API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    
    console.error('❌ Error details:', {
      message: errorMessage,
      details: errorDetails
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: errorMessage,
        success: false
      },
      { status: 500 }
    );
  }
}

// POST endpoint to add test credits (for development/testing)
export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development' },
        { status: 403 }
      );
    }

    console.log('🔍 Add Test Credits API called');

    // Authentication check
    const authResult = await requireApiAuth(['individual']);
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: 401 });
    }

    const { session } = authResult;
    const userId = session.user.id;

    const body = await request.json().catch(() => ({}));
    const creditsToAdd = body.amount || body.credits || 10;

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
    
    console.log(`🔧 Adding ${creditsToAdd} test credits to user: ${userId}`);

    // Get user type
    const { data: user } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', userId)
      .single();

    const userType = user?.user_type === 'individual' ? 'individual' : 'user';

    const { data: newCredits, error: insertError } = await supabase
      .from('user_credits')
      .insert({
        user_id: userId,
        user_type: userType,
        credits_balance: creditsToAdd,
        credits_purchased: creditsToAdd,
        credits_used: 0,
        expires_at: null, // No expiration for test credits
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error adding test credits:', insertError);
      return NextResponse.json(
        { 
          error: 'Failed to add test credits',
          details: insertError.message
        },
        { status: 500 }
      );
    }

    console.log('✅ Test credits added successfully:', newCredits);

    return NextResponse.json({
      success: true,
      credits_added: creditsToAdd,
      message: `Successfully added ${creditsToAdd} test credits`,
      new_balance: newCredits.credits_balance
    });

  } catch (error) {
    console.error('❌ Add Test Credits API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: errorMessage,
        success: false
      },
      { status: 500 }
    );
  }
}