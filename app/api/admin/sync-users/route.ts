import { NextRequest, NextResponse } from 'next/server';
import { syncAllUsersToSupabaseAuth, syncUserToSupabaseAuth } from '@/lib/supabase-auth-sync';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // For now, we'll allow this for testing purposes
    console.log('🔄 Admin sync users API called');

    const body = await request.json().catch(() => ({}));
    const { userId, action = 'sync-all' } = body;

    if (action === 'sync-single' && userId) {
      // Sync a single user
      console.log('🔄 Syncing single user:', userId);
      
      const supabase = createServerClient();
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, full_name, user_type')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      const result = await syncUserToSupabaseAuth({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        user_type: user.user_type
      });

      return NextResponse.json({
        success: result.success,
        user: {
          id: user.id,
          email: user.email,
          ...result
        }
      });
    } else {
      // Sync all users
      console.log('🔄 Syncing all users');
      const result = await syncAllUsersToSupabaseAuth();
      
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('❌ Sync API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get sync status - show users that are/aren't synced
    console.log('📊 Getting sync status');
    
    const supabase = createServerClient();
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, user_type, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Check sync status for each user (this could be expensive for many users)
    const syncStatus = await Promise.all(
      users.slice(0, 10).map(async (user) => { // Limit to first 10 for performance
        try {
          const { checkUserInSupabaseAuth } = await import('@/lib/supabase-auth-sync');
          const authCheck = await checkUserInSupabaseAuth(user.id);
          
          return {
            id: user.id,
            email: user.email,
            user_type: user.user_type,
            created_at: user.created_at,
            synced_with_auth: authCheck.success && authCheck.exists,
            sync_error: authCheck.success ? null : authCheck.error
          };
        } catch (error) {
          return {
            id: user.id,
            email: user.email,
            user_type: user.user_type,
            created_at: user.created_at,
            synced_with_auth: false,
            sync_error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      total_users: users.length,
      checked_users: syncStatus.length,
      users: syncStatus
    });
  } catch (error) {
    console.error('❌ Sync status API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
