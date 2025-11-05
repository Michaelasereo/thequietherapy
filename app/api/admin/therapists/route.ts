import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireApiAuth } from '@/lib/server-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireApiAuth(['admin'])
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: 401 })
    }

    // Add cache control headers to prevent stale data
    console.log('🔍 Fetching therapists with fresh data...')
    
    // Fetch therapists from users table
    const { data: therapistUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('user_type', 'therapist')
      .order('created_at', { ascending: false })

    if (usersError) throw usersError

    // Fetch therapist enrollment data
    const { data: therapistEnrollments, error: enrollmentsError } = await supabase
      .from('therapist_enrollments')
      .select('*')

    if (enrollmentsError) throw enrollmentsError

    // Create a map of therapist enrollments by email
    // IMPORTANT: Deduplicate by email - keep only the most recent enrollment per email
    const enrollmentMap = new Map()
    therapistEnrollments?.forEach(enrollment => {
      const existing = enrollmentMap.get(enrollment.email)
      if (!existing || new Date(enrollment.created_at) > new Date(existing.created_at)) {
        enrollmentMap.set(enrollment.email, enrollment)
      }
    })

    // Create a map of therapist users by email
    const userMap = new Map()
    therapistUsers?.forEach(user => {
      userMap.set(user.email, user)
    })

    // Transform the data to match the expected interface
    const transformedTherapists = (therapistUsers || []).map(user => {
      const enrollment = enrollmentMap.get(user.email)
      return {
        id: user.id,
        full_name: user.full_name || 'Unknown Therapist',
        email: user.email,
        phone: enrollment?.phone || null,
        mdcn_code: enrollment?.mdcn_code || 'N/A',
        specialization: Array.isArray(enrollment?.specialization) ? enrollment?.specialization : [],
        languages: Array.isArray(enrollment?.languages) ? enrollment?.languages : [],
        is_verified: user.is_verified || false,
        is_active: user.is_active || false,
        status: enrollment?.status || 'pending',
        rating: 0, // Will be calculated from sessions/ratings
        totalSessions: 0, // Will be calculated from sessions
        created_at: user.created_at,
        lastActivity: user.last_login_at || user.updated_at
      }
    }) || []

    // Add pending enrollments that don't have a user account yet
    // IMPORTANT: Deduplicate by email - only keep the most recent pending enrollment per email
    const pendingEnrollmentsWithoutUsers = therapistEnrollments?.filter(enrollment => {
      return enrollment.status === 'pending' && !userMap.has(enrollment.email)
    }) || []

    // Deduplicate by email - keep only the most recent enrollment per email
    const uniquePendingEnrollments = new Map<string, typeof pendingEnrollmentsWithoutUsers[0]>()
    pendingEnrollmentsWithoutUsers.forEach(enrollment => {
      const existing = uniquePendingEnrollments.get(enrollment.email)
      if (!existing || new Date(enrollment.created_at) > new Date(existing.created_at)) {
        uniquePendingEnrollments.set(enrollment.email, enrollment)
      }
    })

    const pendingTherapists = Array.from(uniquePendingEnrollments.values()).map(enrollment => ({
      id: enrollment.id, // Use enrollment ID for pending therapists
      full_name: enrollment.full_name || 'Unknown Therapist',
      email: enrollment.email,
      phone: enrollment.phone || null,
      mdcn_code: enrollment.mdcn_code || 'N/A',
      specialization: Array.isArray(enrollment.specialization) ? enrollment.specialization : [],
      languages: Array.isArray(enrollment.languages) ? enrollment.languages : [],
      is_verified: false,
      is_active: false,
      status: enrollment.status || 'pending',
      rating: 0,
      totalSessions: 0,
      created_at: enrollment.created_at,
      lastActivity: enrollment.created_at
    }))

    // Combine regular therapists with pending ones
    const allTherapists = [...transformedTherapists, ...pendingTherapists]

    console.log(`✅ Fetched ${allTherapists.length} therapists (${transformedTherapists.length} approved, ${pendingTherapists.length} pending)`)
    
    // Always return an array, even if empty
    if (!Array.isArray(allTherapists)) {
      console.error('❌ Unexpected: allTherapists is not an array:', allTherapists)
      return NextResponse.json([], {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    }

    return NextResponse.json(allTherapists, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error: any) {
    console.error('❌ Error fetching therapists:', error)
    const message = error?.message || 'Internal server error'
    // Return empty array on error instead of error object to prevent frontend issues
    console.error('⚠️ Returning empty array due to error:', message)
    return NextResponse.json([], {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Admin Therapists DELETE API called');

    // 1. SECURE Authentication Check - admin only
    const authResult = await requireApiAuth(['admin']);
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: 401 });
    }

    const body = await request.json();
    const { therapistId, therapistEmail, permanent = true } = body;

    // Support deletion by ID or email
    if (!therapistId && !therapistEmail) {
      return NextResponse.json(
        { error: 'Therapist ID or email is required' },
        { status: 400 }
      );
    }

    let therapist: any = null;
    let isPendingEnrollment = false;
    let deleteByEmail = false;

    // If email is provided, delete by email (handles duplicates)
    if (therapistEmail) {
      deleteByEmail = true;
      // Find all user accounts for this email
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name, user_type')
        .eq('email', therapistEmail)
        .eq('user_type', 'therapist');

      if (!usersError && users && users.length > 0) {
        // Use the first user account found
        therapist = users[0];
        console.log(`🔍 Found ${users.length} user account(s) for email: ${therapistEmail}`);
      } else {
        // Check if it's a pending enrollment
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('therapist_enrollments')
          .select('id, email, full_name, status')
          .eq('email', therapistEmail);

        if (!enrollmentsError && enrollments && enrollments.length > 0) {
          therapist = {
            id: enrollments[0].id,
            email: enrollments[0].email,
            full_name: enrollments[0].full_name || 'Unknown Therapist',
            user_type: 'therapist'
          };
          isPendingEnrollment = true;
          console.log(`🔍 Found ${enrollments.length} enrollment(s) for email: ${therapistEmail}`);
        }
      }
    } else if (therapistId) {
      // Delete by ID (original behavior)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(therapistId);
      
      if (isUUID) {
        // Try to find in users table first
        const { data: user, error: fetchError } = await supabase
          .from('users')
          .select('id, email, full_name, user_type')
          .eq('id', therapistId)
          .eq('user_type', 'therapist')
          .single();

        if (!fetchError && user) {
          therapist = user;
        }
      }

      // If not found in users, check if it's a pending enrollment
      if (!therapist) {
        const { data: enrollment, error: enrollmentError } = await supabase
          .from('therapist_enrollments')
          .select('id, email, full_name, status')
          .eq('id', therapistId)
          .single();

        if (!enrollmentError && enrollment) {
          therapist = {
            id: enrollment.id,
            email: enrollment.email,
            full_name: enrollment.full_name || 'Unknown Therapist',
            user_type: 'therapist'
          };
          isPendingEnrollment = true;
        }
      }
    }

    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      );
    }

    if (permanent) {
      // Permanent delete - delete from all related tables and Supabase Auth
      console.log('🗑️ Permanently deleting therapist:', therapist.email);
      console.log('   Is pending enrollment:', isPendingEnrollment);

      if (!isPendingEnrollment) {
        // Only delete from Supabase Auth if therapist has a user account
        // 1. Delete from Supabase Auth (delete ALL users with this email)
        try {
          const { data: authUsers } = await supabase.auth.admin.listUsers();
          const authUsersToDelete = authUsers?.users?.filter(u => u.email === therapist.email) || [];
          
          for (const authUser of authUsersToDelete) {
            const { error: authDeleteError } = await supabase.auth.admin.deleteUser(authUser.id);
            if (authDeleteError) {
              console.error(`⚠️ Error deleting ${authUser.email} from Supabase Auth:`, authDeleteError);
            } else {
              console.log(`✅ Deleted ${authUser.email} from Supabase Auth`);
            }
          }
        } catch (authError) {
          console.error('⚠️ Could not delete from Supabase Auth:', authError);
        }

        // 2. Delete sessions where therapist was involved
        // If deleting by email, delete all sessions for all user accounts with this email
        if (deleteByEmail) {
          // Get all user IDs for this email
          const { data: allUsers } = await supabase
            .from('users')
            .select('id')
            .eq('email', therapist.email)
            .eq('user_type', 'therapist');
          
          if (allUsers && allUsers.length > 0) {
            const userIds = allUsers.map(u => u.id);
            const { error: sessionsError } = await supabase
              .from('sessions')
              .delete()
              .in('therapist_id', userIds);

            if (sessionsError) {
              console.error('⚠️ Error deleting sessions:', sessionsError);
            } else {
              console.log(`✅ Deleted sessions for ${userIds.length} user account(s)`);
            }
          }
        } else {
          // Delete by ID (original behavior)
          const { error: sessionsError } = await supabase
            .from('sessions')
            .delete()
            .eq('therapist_id', therapist.id);

          if (sessionsError) {
            console.error('⚠️ Error deleting sessions:', sessionsError);
          } else {
            console.log('✅ Deleted therapist sessions');
          }
        }

        // 3. Delete therapist availability
        if (deleteByEmail) {
          const { data: allUsers } = await supabase
            .from('users')
            .select('id')
            .eq('email', therapist.email)
            .eq('user_type', 'therapist');
          
          if (allUsers && allUsers.length > 0) {
            const userIds = allUsers.map(u => u.id);
            const { error: availabilityError } = await supabase
              .from('availability_weekly_schedules')
              .delete()
              .in('therapist_id', userIds);

            if (availabilityError) {
              console.error('⚠️ Error deleting availability:', availabilityError);
            } else {
              console.log(`✅ Deleted availability for ${userIds.length} user account(s)`);
            }
          }
        } else {
          const { error: availabilityError } = await supabase
            .from('availability_weekly_schedules')
            .delete()
            .eq('therapist_id', therapist.id);

          if (availabilityError) {
            console.error('⚠️ Error deleting availability:', availabilityError);
          } else {
            console.log('✅ Deleted therapist availability');
          }
        }

        // 4. Delete therapist profiles (if table exists)
        if (deleteByEmail) {
          const { data: allUsers } = await supabase
            .from('users')
            .select('id')
            .eq('email', therapist.email)
            .eq('user_type', 'therapist');
          
          if (allUsers && allUsers.length > 0) {
            const userIds = allUsers.map(u => u.id);
            const { error: profilesError } = await supabase
              .from('therapist_profiles')
              .delete()
              .in('user_id', userIds);

            if (profilesError) {
              console.error('⚠️ Error deleting therapist profiles:', profilesError);
            } else {
              console.log(`✅ Deleted profiles for ${userIds.length} user account(s)`);
            }
          }
        } else {
          const { error: profilesError } = await supabase
            .from('therapist_profiles')
            .delete()
            .eq('user_id', therapist.id);

          if (profilesError) {
            console.error('⚠️ Error deleting therapist profiles:', profilesError);
          } else {
            console.log('✅ Deleted therapist profiles');
          }
        }

        // 5. Delete therapist credits (if any)
        if (deleteByEmail) {
          const { data: allUsers } = await supabase
            .from('users')
            .select('id')
            .eq('email', therapist.email)
            .eq('user_type', 'therapist');
          
          if (allUsers && allUsers.length > 0) {
            const userIds = allUsers.map(u => u.id);
            const { error: creditsError } = await supabase
              .from('user_credits')
              .delete()
              .in('user_id', userIds)
              .eq('user_type', 'therapist');

            if (creditsError) {
              console.error('⚠️ Error deleting therapist credits:', creditsError);
            } else {
              console.log(`✅ Deleted credits for ${userIds.length} user account(s)`);
            }
          }
        } else {
          const { error: creditsError } = await supabase
            .from('user_credits')
            .delete()
            .eq('user_id', therapist.id)
            .eq('user_type', 'therapist');

          if (creditsError) {
            console.error('⚠️ Error deleting therapist credits:', creditsError);
          } else {
            console.log('✅ Deleted therapist credits');
          }
        }

        // 6. Delete from users table (cascades will handle other related data)
        if (deleteByEmail) {
          // Delete ALL user accounts with this email
          const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .eq('email', therapist.email)
            .eq('user_type', 'therapist');

          if (deleteError) {
            console.error('❌ Error deleting therapist users:', deleteError);
            return NextResponse.json(
              { error: 'Failed to delete therapist' },
              { status: 500 }
            );
          } else {
            console.log(`✅ Deleted all user accounts for email: ${therapist.email}`);
          }
        } else {
          const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .eq('id', therapist.id);

          if (deleteError) {
            console.error('❌ Error deleting therapist user:', deleteError);
            return NextResponse.json(
              { error: 'Failed to delete therapist' },
              { status: 500 }
            );
          }
        }
      }

      // 7. Delete ALL therapist enrollments for this email (handles duplicates)
      const { error: enrollmentsError } = await supabase
        .from('therapist_enrollments')
        .delete()
        .eq('email', therapist.email);

      if (enrollmentsError) {
        console.error('⚠️ Error deleting therapist enrollments:', enrollmentsError);
      } else {
        console.log('✅ Deleted therapist enrollments');
      }

      console.log('✅ Therapist permanently deleted:', therapist.email);

      return NextResponse.json({
        success: true,
        message: `Therapist ${therapist.email} permanently deleted successfully`
      });
    } else {
      // Soft delete - deactivate therapist
      console.log('🔒 Deactivating therapist:', therapist.email);

      const { error: updateError } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', therapistId);

      if (updateError) {
        console.error('❌ Error deactivating therapist:', updateError);
        return NextResponse.json(
          { error: 'Failed to deactivate therapist' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Therapist ${therapist.email} deactivated successfully`
      });
    }

  } catch (error) {
    console.error('Admin Therapists DELETE API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
