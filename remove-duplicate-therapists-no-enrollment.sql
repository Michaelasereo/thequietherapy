-- =====================================================
-- REMOVE DUPLICATE THERAPISTS WITH NO ENROLLMENT
-- =====================================================
-- This script finds and removes duplicate therapists that:
-- 1. Have no enrollment in therapist_enrollments table
-- 2. Are duplicates (same email) of therapists that may have enrollments
-- =====================================================

-- Step 1: Find all therapists in users table with no enrollment
SELECT 
    '🔍 Therapists with NO Enrollment:' as check_type,
    u.id,
    u.email,
    u.full_name,
    u.is_active,
    u.is_verified,
    u.created_at,
    CASE 
        WHEN te.id IS NULL THEN '❌ No Enrollment'
        ELSE '✅ Has Enrollment'
    END as enrollment_status
FROM users u
LEFT JOIN therapist_enrollments te ON u.email = te.email
WHERE u.user_type = 'therapist'
  AND te.id IS NULL
ORDER BY u.email, u.created_at;

-- Step 2: Find duplicate therapists (same email) and identify which have enrollments
SELECT 
    '🔍 Duplicate Therapists Analysis:' as check_type,
    u.email,
    COUNT(DISTINCT u.id) as user_count,
    COUNT(DISTINCT te.id) as enrollment_count,
    STRING_AGG(DISTINCT u.id::text, ', ') as user_ids,
    STRING_AGG(DISTINCT u.full_name, ' | ') as names,
    STRING_AGG(DISTINCT CASE WHEN te.id IS NOT NULL THEN u.id::text END, ', ') as users_with_enrollment,
    STRING_AGG(DISTINCT CASE WHEN te.id IS NULL THEN u.id::text END, ', ') as users_without_enrollment
FROM users u
LEFT JOIN therapist_enrollments te ON u.email = te.email
WHERE u.user_type = 'therapist'
GROUP BY u.email
HAVING COUNT(DISTINCT u.id) > 1
ORDER BY user_count DESC;

-- Step 3: Find the specific therapist from the error (376d605e-4b2e-478d-a866-47b17f5b3720)
SELECT 
    '🔍 Specific Therapist from Error:' as check_type,
    u.id,
    u.email,
    u.full_name,
    u.is_active,
    u.is_verified,
    u.created_at,
    te.id as enrollment_id,
    te.status as enrollment_status,
    CASE 
        WHEN te.id IS NULL THEN '❌ No Enrollment - WILL BE DELETED'
        ELSE '✅ Has Enrollment - KEEP'
    END as action
FROM users u
LEFT JOIN therapist_enrollments te ON u.email = te.email
WHERE u.id = '376d605e-4b2e-478d-a866-47b17f5b3720'
   OR u.email IN (
       SELECT email FROM users WHERE id = '376d605e-4b2e-478d-a866-47b17f5b3720'
   );

-- Step 4: DELETE duplicate therapists with no enrollment
-- This will:
-- 1. Keep therapists that have enrollments
-- 2. If multiple therapists have the same email and none have enrollment, keep the oldest one
-- 3. Delete all others

DO $$
DECLARE
    therapist_record RECORD;
    user_ids_to_delete UUID[];
    deleted_count INTEGER := 0;
    total_deleted INTEGER := 0;
BEGIN
    -- Loop through each email that has duplicate therapists
    FOR therapist_record IN 
        SELECT 
            u.email,
            ARRAY_AGG(u.id ORDER BY u.created_at) as all_user_ids,
            ARRAY_AGG(CASE WHEN te.id IS NOT NULL THEN u.id END) as users_with_enrollment,
            COUNT(DISTINCT u.id) as user_count
        FROM users u
        LEFT JOIN therapist_enrollments te ON u.email = te.email
        WHERE u.user_type = 'therapist'
        GROUP BY u.email
        HAVING COUNT(DISTINCT u.id) > 1
    LOOP
        -- If any therapist has enrollment, delete only those without enrollment
        IF array_length(therapist_record.users_with_enrollment, 1) > 0 THEN
            -- Keep those with enrollment, delete those without
            SELECT ARRAY_AGG(id) INTO user_ids_to_delete
            FROM users
            WHERE email = therapist_record.email
              AND user_type = 'therapist'
              AND id != ALL(therapist_record.users_with_enrollment)
              AND id NOT IN (
                  SELECT user_id FROM therapist_enrollments 
                  WHERE email = therapist_record.email AND user_id IS NOT NULL
              );
        ELSE
            -- No one has enrollment, keep the oldest one, delete the rest
            SELECT ARRAY_AGG(id) INTO user_ids_to_delete
            FROM users
            WHERE email = therapist_record.email
              AND user_type = 'therapist'
              AND id != (
                  SELECT id FROM users 
                  WHERE email = therapist_record.email 
                    AND user_type = 'therapist'
                  ORDER BY created_at ASC 
                  LIMIT 1
              );
        END IF;

        -- Delete related data for these user IDs
        IF user_ids_to_delete IS NOT NULL AND array_length(user_ids_to_delete, 1) > 0 THEN
            RAISE NOTICE '🔍 Processing email: % - Deleting % duplicate(s)', 
                therapist_record.email, array_length(user_ids_to_delete, 1);

            -- Delete sessions
            DELETE FROM sessions
            WHERE therapist_id = ANY(user_ids_to_delete)
               OR user_id = ANY(user_ids_to_delete);
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            IF deleted_count > 0 THEN
                RAISE NOTICE '  ✅ Deleted % sessions', deleted_count;
            END IF;

            -- Delete availability
            DELETE FROM availability_weekly_schedules
            WHERE therapist_id = ANY(user_ids_to_delete);
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            IF deleted_count > 0 THEN
                RAISE NOTICE '  ✅ Deleted % availability records', deleted_count;
            END IF;

            -- Delete therapist profiles
            DELETE FROM therapist_profiles
            WHERE user_id = ANY(user_ids_to_delete);
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            IF deleted_count > 0 THEN
                RAISE NOTICE '  ✅ Deleted % therapist profiles', deleted_count;
            END IF;

            -- Delete user credits
            DELETE FROM user_credits
            WHERE user_id = ANY(user_ids_to_delete);
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            IF deleted_count > 0 THEN
                RAISE NOTICE '  ✅ Deleted % credit records', deleted_count;
            END IF;

            -- Delete from users table
            DELETE FROM users
            WHERE id = ANY(user_ids_to_delete);
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            total_deleted := total_deleted + deleted_count;
            RAISE NOTICE '  ✅ Deleted % user account(s)', deleted_count;
        END IF;
    END LOOP;

    -- Also delete therapists with no enrollment that are not duplicates
    -- (single therapists with no enrollment)
    FOR therapist_record IN
        SELECT u.id, u.email, u.full_name
        FROM users u
        LEFT JOIN therapist_enrollments te ON u.email = te.email
        WHERE u.user_type = 'therapist'
          AND te.id IS NULL
          AND NOT EXISTS (
              SELECT 1 FROM users u2 
              WHERE u2.email = u.email 
                AND u2.user_type = 'therapist' 
                AND u2.id != u.id
          )
    LOOP
        RAISE NOTICE '🔍 Deleting single therapist with no enrollment: % (%)', 
            therapist_record.email, therapist_record.id;

        -- Delete sessions
        DELETE FROM sessions
        WHERE therapist_id = therapist_record.id
           OR user_id = therapist_record.id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        IF deleted_count > 0 THEN
            RAISE NOTICE '  ✅ Deleted % sessions', deleted_count;
        END IF;

        -- Delete availability
        DELETE FROM availability_weekly_schedules
        WHERE therapist_id = therapist_record.id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        IF deleted_count > 0 THEN
            RAISE NOTICE '  ✅ Deleted % availability records', deleted_count;
        END IF;

        -- Delete therapist profiles
        DELETE FROM therapist_profiles
        WHERE user_id = therapist_record.id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        IF deleted_count > 0 THEN
            RAISE NOTICE '  ✅ Deleted % therapist profiles', deleted_count;
        END IF;

        -- Delete user credits
        DELETE FROM user_credits
        WHERE user_id = therapist_record.id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        IF deleted_count > 0 THEN
            RAISE NOTICE '  ✅ Deleted % credit records', deleted_count;
        END IF;

        -- Delete from users table
        DELETE FROM users
        WHERE id = therapist_record.id;
        total_deleted := total_deleted + 1;
        RAISE NOTICE '  ✅ Deleted user account';
    END LOOP;

    RAISE NOTICE '✅ Total therapists deleted: %', total_deleted;
    RAISE NOTICE '⚠️  Remember to delete from Supabase Auth (auth.users) via Dashboard if needed';
END $$;

-- Step 5: Verify cleanup - Show remaining therapists with no enrollment
SELECT 
    '✅ Verification - Remaining Therapists with NO Enrollment:' as check_type,
    u.id,
    u.email,
    u.full_name,
    u.is_active,
    u.is_verified,
    u.created_at
FROM users u
LEFT JOIN therapist_enrollments te ON u.email = te.email
WHERE u.user_type = 'therapist'
  AND te.id IS NULL
ORDER BY u.email, u.created_at;

-- Step 6: Verify no duplicates remain
SELECT 
    '✅ Verification - Remaining Duplicates:' as check_type,
    u.email,
    COUNT(DISTINCT u.id) as user_count,
    COUNT(DISTINCT te.id) as enrollment_count
FROM users u
LEFT JOIN therapist_enrollments te ON u.email = te.email
WHERE u.user_type = 'therapist'
GROUP BY u.email
HAVING COUNT(DISTINCT u.id) > 1
ORDER BY user_count DESC;

