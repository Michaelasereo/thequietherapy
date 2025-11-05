import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireApiAuth } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Admin Users API called');

    // 1. SECURE Authentication Check - admin only
    const authResult = await requireApiAuth(['admin']);
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || searchParams.get('user_type') || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';

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

    // Build query
    let query = supabase
      .from('users')
      .select('id, email, full_name, user_type, is_active, is_verified, created_at, last_login_at', { count: 'exact' });

    // Filter by user type if not 'all'
    if (type !== 'all') {
      query = query.eq('user_type', type);
    }

    // Search filter
    if (search) {
      const searchPattern = `%${search}%`;
      query = query.or(`full_name.ilike.${searchPattern},email.ilike.${searchPattern}`);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

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
      users: users || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });

  } catch (error) {
    console.error('Admin Users API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Admin Users DELETE API called');

    // 1. SECURE Authentication Check - admin only
    const authResult = await requireApiAuth(['admin']);
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: 401 });
    }

    const body = await request.json();
    const { userId, permanent = false } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

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

    // Get user email before deletion
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('email, id')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (permanent) {
      // Permanent delete - delete from database and Supabase Auth
      console.log('🗑️ Permanently deleting user:', user.email);

      // Delete from Supabase Auth
      try {
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const authUser = authUsers?.users?.find(u => u.email === user.email);
        
        if (authUser) {
          const { error: authDeleteError } = await supabase.auth.admin.deleteUser(authUser.id);
          if (authDeleteError) {
            console.error('⚠️ Error deleting from Supabase Auth:', authDeleteError);
          } else {
            console.log('✅ Deleted from Supabase Auth');
          }
        }
      } catch (authError) {
        console.error('⚠️ Could not delete from Supabase Auth:', authError);
      }

      // Delete from database (cascades will handle related data)
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (deleteError) {
        console.error('❌ Error deleting user:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete user' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `User ${user.email} permanently deleted successfully`
      });
    } else {
      // Soft delete - deactivate user
      console.log('🔒 Deactivating user:', user.email);

      const { error: updateError } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Error deactivating user:', updateError);
        return NextResponse.json(
          { error: 'Failed to deactivate user' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `User ${user.email} deactivated successfully`
      });
    }

  } catch (error) {
    console.error('Admin Users DELETE API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    console.log('🔄 Admin Users PATCH API called');

    // 1. SECURE Authentication Check - admin only
    const authResult = await requireApiAuth(['admin']);
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: 401 });
    }

    const body = await request.json();
    const { userId, action } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'User ID and action are required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === 'reactivate') {
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_active: true })
        .eq('id', userId);

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to reactivate user' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'User reactivated successfully'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Admin Users PATCH API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}