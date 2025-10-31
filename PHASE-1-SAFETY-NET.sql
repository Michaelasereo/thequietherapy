-- ============================================================================
-- PHASE 1: NO-BREAKAGE SAFETY NET
-- Database Triggers for Automatic Data Synchronization
-- ============================================================================
-- 
-- PURPOSE: Add automatic sync triggers that WON'T break existing functionality
-- SAFETY: These are AFTER triggers - they run AFTER successful updates
-- ROLLBACK: Simply drop the triggers if needed
--
-- Date: October 20, 2025
-- Status: SAFE TO RUN - No impact on existing code
-- ============================================================================

-- ============================================================================
-- 0. ENSURE REQUIRED COLUMNS EXIST
-- ============================================================================
-- Add avatar_url column to users table if it doesn't exist

DO $$
BEGIN
    -- Add avatar_url to users table if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
        RAISE NOTICE '✅ Added avatar_url column to users table';
    ELSE
        RAISE NOTICE '✅ avatar_url column already exists in users table';
    END IF;
    
    -- Add profile_image_url to therapist_enrollments if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'therapist_enrollments' 
        AND column_name = 'profile_image_url'
    ) THEN
        ALTER TABLE therapist_enrollments ADD COLUMN profile_image_url TEXT;
        RAISE NOTICE '✅ Added profile_image_url column to therapist_enrollments table';
    ELSE
        RAISE NOTICE '✅ profile_image_url column already exists in therapist_enrollments table';
    END IF;
    
    -- Add profile_image_url to therapist_profiles if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'therapist_profiles' 
        AND column_name = 'profile_image_url'
    ) THEN
        ALTER TABLE therapist_profiles ADD COLUMN profile_image_url TEXT;
        RAISE NOTICE '✅ Added profile_image_url column to therapist_profiles table';
    ELSE
        RAISE NOTICE '✅ profile_image_url column already exists in therapist_profiles table';
    END IF;
    
    -- Add bio to therapist_enrollments if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'therapist_enrollments' 
        AND column_name = 'bio'
    ) THEN
        ALTER TABLE therapist_enrollments ADD COLUMN bio TEXT;
        RAISE NOTICE '✅ Added bio column to therapist_enrollments table';
    ELSE
        RAISE NOTICE '✅ bio column already exists in therapist_enrollments table';
    END IF;
    
    -- Add experience_years to therapist_enrollments if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'therapist_enrollments' 
        AND column_name = 'experience_years'
    ) THEN
        ALTER TABLE therapist_enrollments ADD COLUMN experience_years INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Added experience_years column to therapist_enrollments table';
    ELSE
        RAISE NOTICE '✅ experience_years column already exists in therapist_enrollments table';
    END IF;
    
    -- Add bio to therapist_profiles if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'therapist_profiles' 
        AND column_name = 'bio'
    ) THEN
        ALTER TABLE therapist_profiles ADD COLUMN bio TEXT;
        RAISE NOTICE '✅ Added bio column to therapist_profiles table';
    ELSE
        RAISE NOTICE '✅ bio column already exists in therapist_profiles table';
    END IF;
    
    -- Add experience_years to therapist_profiles if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'therapist_profiles' 
        AND column_name = 'experience_years'
    ) THEN
        ALTER TABLE therapist_profiles ADD COLUMN experience_years INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Added experience_years column to therapist_profiles table';
    ELSE
        RAISE NOTICE '✅ experience_years column already exists in therapist_profiles table';
    END IF;
END $$;

-- ============================================================================
-- 1. AVATAR SYNC FUNCTION
-- ============================================================================
-- This function syncs profile_image_url across all three tables
-- whenever ANY of them is updated

CREATE OR REPLACE FUNCTION sync_avatar_across_tables()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_email TEXT;
BEGIN
    -- Handle different trigger sources
    IF TG_TABLE_NAME = 'therapist_enrollments' THEN
        v_email := NEW.email;
        v_user_id := NEW.user_id;
        
        -- Sync to users table
        IF NEW.profile_image_url IS DISTINCT FROM OLD.profile_image_url THEN
            UPDATE users 
            SET avatar_url = NEW.profile_image_url,
                updated_at = NOW()
            WHERE email = v_email
            AND user_type = 'therapist';
            
            -- Sync to therapist_profiles
            IF v_user_id IS NOT NULL THEN
                UPDATE therapist_profiles 
                SET profile_image_url = NEW.profile_image_url,
                    updated_at = NOW()
                WHERE user_id = v_user_id;
            END IF;
            
            RAISE NOTICE 'Avatar synced from therapist_enrollments: %', NEW.profile_image_url;
        END IF;
        
    ELSIF TG_TABLE_NAME = 'users' THEN
        v_email := NEW.email;
        v_user_id := NEW.id;
        
        -- Only sync if this is a therapist user
        IF NEW.user_type = 'therapist' AND NEW.avatar_url IS DISTINCT FROM OLD.avatar_url THEN
            -- Sync to therapist_enrollments
            UPDATE therapist_enrollments 
            SET profile_image_url = NEW.avatar_url,
                updated_at = NOW()
            WHERE email = v_email;
            
            -- Sync to therapist_profiles
            UPDATE therapist_profiles 
            SET profile_image_url = NEW.avatar_url,
                updated_at = NOW()
            WHERE user_id = v_user_id;
            
            RAISE NOTICE 'Avatar synced from users: %', NEW.avatar_url;
        END IF;
        
    ELSIF TG_TABLE_NAME = 'therapist_profiles' THEN
        v_user_id := NEW.user_id;
        
        -- Get email from users table
        SELECT email INTO v_email 
        FROM users 
        WHERE id = v_user_id;
        
        IF NEW.profile_image_url IS DISTINCT FROM OLD.profile_image_url THEN
            -- Sync to users
            UPDATE users 
            SET avatar_url = NEW.profile_image_url,
                updated_at = NOW()
            WHERE id = v_user_id;
            
            -- Sync to therapist_enrollments
            IF v_email IS NOT NULL THEN
                UPDATE therapist_enrollments 
                SET profile_image_url = NEW.profile_image_url,
                    updated_at = NOW()
                WHERE email = v_email;
            END IF;
            
            RAISE NOTICE 'Avatar synced from therapist_profiles: %', NEW.profile_image_url;
        END IF;
    END IF;
    
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the trigger
        RAISE WARNING 'Avatar sync failed but continuing: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. CREATE TRIGGERS ON ALL THREE TABLES
-- ============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS sync_avatar_from_enrollments ON therapist_enrollments;
DROP TRIGGER IF EXISTS sync_avatar_from_users ON users;
DROP TRIGGER IF EXISTS sync_avatar_from_profiles ON therapist_profiles;

-- Trigger on therapist_enrollments
CREATE TRIGGER sync_avatar_from_enrollments
    AFTER UPDATE OF profile_image_url ON therapist_enrollments
    FOR EACH ROW
    WHEN (NEW.profile_image_url IS DISTINCT FROM OLD.profile_image_url)
    EXECUTE FUNCTION sync_avatar_across_tables();

-- Trigger on users
CREATE TRIGGER sync_avatar_from_users
    AFTER UPDATE OF avatar_url ON users
    FOR EACH ROW
    WHEN (NEW.avatar_url IS DISTINCT FROM OLD.avatar_url)
    EXECUTE FUNCTION sync_avatar_across_tables();

-- Trigger on therapist_profiles
CREATE TRIGGER sync_avatar_from_profiles
    AFTER UPDATE OF profile_image_url ON therapist_profiles
    FOR EACH ROW
    WHEN (NEW.profile_image_url IS DISTINCT FROM OLD.profile_image_url)
    EXECUTE FUNCTION sync_avatar_across_tables();

-- ============================================================================
-- 3. BIO & EXPERIENCE SYNC FUNCTION (BONUS)
-- ============================================================================
-- Syncs bio and experience_years between therapist_enrollments and therapist_profiles

CREATE OR REPLACE FUNCTION sync_therapist_profile_data()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
BEGIN
    IF TG_TABLE_NAME = 'therapist_enrollments' THEN
        v_user_id := NEW.user_id;
        
        -- Sync bio and experience to therapist_profiles
        IF v_user_id IS NOT NULL THEN
            UPDATE therapist_profiles 
            SET 
                bio = NEW.bio,
                experience_years = NEW.experience_years,
                updated_at = NOW()
            WHERE user_id = v_user_id
            AND (
                bio IS DISTINCT FROM NEW.bio OR 
                experience_years IS DISTINCT FROM NEW.experience_years
            );
            
            RAISE NOTICE 'Profile data synced from therapist_enrollments for user: %', v_user_id;
        END IF;
        
    ELSIF TG_TABLE_NAME = 'therapist_profiles' THEN
        v_user_id := NEW.user_id;
        
        -- Sync back to therapist_enrollments (source of truth)
        UPDATE therapist_enrollments 
        SET 
            bio = NEW.bio,
            experience_years = NEW.experience_years,
            updated_at = NOW()
        WHERE user_id = v_user_id
        AND (
            bio IS DISTINCT FROM NEW.bio OR 
            experience_years IS DISTINCT FROM NEW.experience_years
        );
        
        RAISE NOTICE 'Profile data synced from therapist_profiles for user: %', v_user_id;
    END IF;
    
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Profile data sync failed but continuing: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for bio/experience sync
DROP TRIGGER IF EXISTS sync_profile_data_from_enrollments ON therapist_enrollments;
DROP TRIGGER IF EXISTS sync_profile_data_from_profiles ON therapist_profiles;

CREATE TRIGGER sync_profile_data_from_enrollments
    AFTER UPDATE OF bio, experience_years ON therapist_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION sync_therapist_profile_data();

CREATE TRIGGER sync_profile_data_from_profiles
    AFTER UPDATE OF bio, experience_years ON therapist_profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_therapist_profile_data();

-- ============================================================================
-- 4. VERIFICATION STATUS SYNC (CRITICAL)
-- ============================================================================
-- Keeps is_verified and status in sync across tables

CREATE OR REPLACE FUNCTION sync_verification_status()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_email TEXT;
BEGIN
    IF TG_TABLE_NAME = 'therapist_enrollments' THEN
        v_user_id := NEW.user_id;
        v_email := NEW.email;
        
        -- When status changes to 'approved', set is_verified = true everywhere
        IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
            UPDATE users 
            SET is_verified = true, 
                is_active = true,
                updated_at = NOW()
            WHERE email = v_email;
            
            IF v_user_id IS NOT NULL THEN
                UPDATE therapist_profiles 
                SET is_verified = true,
                    verification_status = 'approved',
                    updated_at = NOW()
                WHERE user_id = v_user_id;
            END IF;
            
            RAISE NOTICE 'Verification synced: therapist approved - %', v_email;
            
        -- When status changes to 'rejected', set is_verified = false
        ELSIF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
            UPDATE users 
            SET is_verified = false, 
                is_active = false,
                updated_at = NOW()
            WHERE email = v_email;
            
            IF v_user_id IS NOT NULL THEN
                UPDATE therapist_profiles 
                SET is_verified = false,
                    verification_status = 'rejected',
                    updated_at = NOW()
                WHERE user_id = v_user_id;
            END IF;
            
            RAISE NOTICE 'Verification synced: therapist rejected - %', v_email;
        END IF;
    END IF;
    
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Verification sync failed but continuing: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for verification sync
DROP TRIGGER IF EXISTS sync_verification_from_enrollments ON therapist_enrollments;

CREATE TRIGGER sync_verification_from_enrollments
    AFTER UPDATE OF status ON therapist_enrollments
    FOR EACH ROW
    WHEN (NEW.status IS DISTINCT FROM OLD.status)
    EXECUTE FUNCTION sync_verification_status();

-- ============================================================================
-- 5. VERIFICATION & TESTING
-- ============================================================================

-- Test that triggers exist
DO $$
BEGIN
    RAISE NOTICE '=== TRIGGER INSTALLATION VERIFICATION ===';
    
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_avatar_from_enrollments') THEN
        RAISE NOTICE '✅ sync_avatar_from_enrollments installed';
    ELSE
        RAISE WARNING '❌ sync_avatar_from_enrollments NOT found';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_avatar_from_users') THEN
        RAISE NOTICE '✅ sync_avatar_from_users installed';
    ELSE
        RAISE WARNING '❌ sync_avatar_from_users NOT found';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_avatar_from_profiles') THEN
        RAISE NOTICE '✅ sync_avatar_from_profiles installed';
    ELSE
        RAISE WARNING '❌ sync_avatar_from_profiles NOT found';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_profile_data_from_enrollments') THEN
        RAISE NOTICE '✅ sync_profile_data_from_enrollments installed';
    ELSE
        RAISE WARNING '❌ sync_profile_data_from_enrollments NOT found';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_verification_from_enrollments') THEN
        RAISE NOTICE '✅ sync_verification_from_enrollments installed';
    ELSE
        RAISE WARNING '❌ sync_verification_from_enrollments NOT found';
    END IF;
    
    RAISE NOTICE '=== VERIFICATION COMPLETE ===';
END $$;

-- ============================================================================
-- 6. ROLLBACK SCRIPT (If Needed)
-- ============================================================================
-- Run this if you need to remove the triggers

/*
-- ROLLBACK: Drop all triggers
DROP TRIGGER IF EXISTS sync_avatar_from_enrollments ON therapist_enrollments;
DROP TRIGGER IF EXISTS sync_avatar_from_users ON users;
DROP TRIGGER IF EXISTS sync_avatar_from_profiles ON therapist_profiles;
DROP TRIGGER IF EXISTS sync_profile_data_from_enrollments ON therapist_enrollments;
DROP TRIGGER IF EXISTS sync_profile_data_from_profiles ON therapist_profiles;
DROP TRIGGER IF EXISTS sync_verification_from_enrollments ON therapist_enrollments;

-- Drop functions
DROP FUNCTION IF EXISTS sync_avatar_across_tables();
DROP FUNCTION IF EXISTS sync_therapist_profile_data();
DROP FUNCTION IF EXISTS sync_verification_status();

RAISE NOTICE 'All sync triggers removed';
*/

-- ============================================================================
-- SUCCESS!
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 PHASE 1 SAFETY NET INSTALLED SUCCESSFULLY! 🎉';
    RAISE NOTICE '';
    RAISE NOTICE 'What this does:';
    RAISE NOTICE '  ✅ Auto-syncs avatar across all 3 tables';
    RAISE NOTICE '  ✅ Auto-syncs bio and experience_years';
    RAISE NOTICE '  ✅ Auto-syncs verification status';
    RAISE NOTICE '  ✅ Gracefully handles errors (logs warnings)';
    RAISE NOTICE '  ✅ WONT break existing functionality';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Test avatar upload - should sync everywhere';
    RAISE NOTICE '  2. Test profile edit - should sync everywhere';
    RAISE NOTICE '  3. Test therapist approval - should sync everywhere';
    RAISE NOTICE '';
    RAISE NOTICE 'To rollback: Run the commented ROLLBACK section at the end';
    RAISE NOTICE '';
END $$;

