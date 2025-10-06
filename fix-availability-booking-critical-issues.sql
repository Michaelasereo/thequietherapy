-- =============================================
-- CRITICAL FIXES FOR AVAILABILITY & BOOKING SYSTEM
-- =============================================
-- This script addresses the critical issues identified in the therapist availability and booking system

-- 1. STANDARDIZE THERAPIST AVAILABILITY TABLE SCHEMA
-- =============================================

-- First, check if therapist_email column exists and migrate data
DO $$
BEGIN
    -- Check if therapist_email column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'therapist_availability' 
        AND column_name = 'therapist_email'
    ) THEN
        -- Drop RLS policies that depend on therapist_email column
        DROP POLICY IF EXISTS "Therapists can manage their own availability" ON therapist_availability;
        DROP POLICY IF EXISTS "Therapists can view their own availability" ON therapist_availability;
        DROP POLICY IF EXISTS "Therapists can insert their own availability" ON therapist_availability;
        DROP POLICY IF EXISTS "Therapists can update their own availability" ON therapist_availability;
        DROP POLICY IF EXISTS "Therapists can delete their own availability" ON therapist_availability;
        
        -- Migrate data from therapist_email to therapist_id
        UPDATE therapist_availability 
        SET therapist_id = (
            SELECT u.id 
            FROM users u 
            WHERE u.email = therapist_availability.therapist_email 
            AND u.user_type = 'therapist'
        )
        WHERE therapist_id IS NULL 
        AND therapist_email IS NOT NULL;
        
        -- Drop the therapist_email column
        ALTER TABLE therapist_availability DROP COLUMN IF EXISTS therapist_email;
        
        -- Recreate RLS policies using therapist_id
        CREATE POLICY "Therapists can manage their own availability" ON therapist_availability
            FOR ALL USING (therapist_id = auth.uid());
        
        RAISE NOTICE 'Migrated therapist_email data to therapist_id, dropped therapist_email column, and recreated RLS policies';
    END IF;
END $$;

-- Ensure therapist_id is NOT NULL and has proper constraints
ALTER TABLE therapist_availability 
ALTER COLUMN therapist_id SET NOT NULL;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'therapist_availability_therapist_id_fkey'
        AND table_name = 'therapist_availability'
    ) THEN
        ALTER TABLE therapist_availability 
        ADD CONSTRAINT therapist_availability_therapist_id_fkey 
        FOREIGN KEY (therapist_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. ADD BOOKING CONFLICT PREVENTION
-- =============================================

-- Enable required extension for exclusion constraints on ranges
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Create a unique constraint to prevent double bookings
-- This will prevent the same therapist from having overlapping time slots
CREATE UNIQUE INDEX IF NOT EXISTS idx_therapist_availability_no_overlap 
ON therapist_availability (therapist_id, day_of_week, start_time, end_time);

-- Add a function to check for booking conflicts
CREATE OR REPLACE FUNCTION check_booking_conflict(
    p_therapist_id UUID,
    p_session_date DATE,
    p_start_time TIME,
    p_end_time TIME
) RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    -- Check for existing sessions that overlap
    SELECT COUNT(*) INTO conflict_count
    FROM sessions s
    WHERE s.therapist_id = p_therapist_id
    AND s.scheduled_date = p_session_date
    AND s.status IN ('scheduled', 'confirmed', 'in_progress')
    AND (
        (s.scheduled_time <= p_start_time AND s.end_time > p_start_time) OR
        (s.scheduled_time < p_end_time AND s.end_time >= p_end_time) OR
        (s.scheduled_time >= p_start_time AND s.end_time <= p_end_time)
    );
    
    RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql;

-- 3. FIX SESSIONS TABLE SCHEMA INCONSISTENCIES
-- =============================================

-- Ensure sessions table has proper columns for booking
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS scheduled_date DATE,
ADD COLUMN IF NOT EXISTS scheduled_time TIME,
ADD COLUMN IF NOT EXISTS session_date DATE,
ADD COLUMN IF NOT EXISTS session_time TIME;

-- Create function to populate missing date/time fields
CREATE OR REPLACE FUNCTION populate_session_datetime() RETURNS TRIGGER AS $$
BEGIN
    -- If scheduled_date/scheduled_time are provided, use them
    IF NEW.scheduled_date IS NOT NULL AND NEW.scheduled_time IS NOT NULL THEN
        NEW.session_date := NEW.scheduled_date;
        NEW.session_time := NEW.scheduled_time;
        NEW.start_time := (NEW.scheduled_date || ' ' || NEW.scheduled_time)::TIMESTAMP WITH TIME ZONE;
    -- If start_time is provided, extract date and time
    ELSIF NEW.start_time IS NOT NULL THEN
        NEW.session_date := NEW.start_time::DATE;
        NEW.session_time := NEW.start_time::TIME;
        NEW.scheduled_date := NEW.start_time::DATE;
        NEW.scheduled_time := NEW.start_time::TIME;
    END IF;
    
    -- Calculate end_time if not provided
    IF NEW.end_time IS NULL AND NEW.start_time IS NOT NULL AND NEW.duration_minutes IS NOT NULL THEN
        NEW.end_time := NEW.start_time + INTERVAL '1 minute' * NEW.duration_minutes;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically populate datetime fields
DROP TRIGGER IF EXISTS trigger_populate_session_datetime ON sessions;
CREATE TRIGGER trigger_populate_session_datetime
    BEFORE INSERT OR UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION populate_session_datetime();

-- Add robust overlap protection on sessions using exclusion constraint
-- Prevent overlapping sessions per therapist when status is active
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'sessions_no_overlap_per_therapist'
    ) THEN
        -- Ensure required columns exist (start_time/end_time)
        ALTER TABLE sessions 
            ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;

        -- Add exclusion constraint using gist on tstzrange
        ALTER TABLE sessions
        ADD CONSTRAINT sessions_no_overlap_per_therapist
        EXCLUDE USING gist (
            therapist_id WITH =,
            tstzrange(start_time, end_time, '[)') WITH &&
        ) WHERE (status IN ('scheduled','confirmed','in_progress'));
    END IF;
END $$;

-- 4. ADD PROPER CREDIT VALIDATION
-- =============================================

-- Ensure user_credits table exists with proper structure
CREATE TABLE IF NOT EXISTS user_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_type VARCHAR(50) DEFAULT 'user',
    credits_balance INTEGER DEFAULT 0,
    credits_purchased INTEGER DEFAULT 0,
    credits_used INTEGER DEFAULT 0,
    credits_expired INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, user_type)
);

-- Add function to validate and deduct credits
CREATE OR REPLACE FUNCTION validate_and_deduct_credits(
    p_user_id UUID,
    p_credits_needed INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
    current_balance INTEGER;
    updated_balance INTEGER;
BEGIN
    -- Get current credit balance
    SELECT credits_balance INTO current_balance
    FROM user_credits
    WHERE user_id = p_user_id
    AND user_type IN ('user', 'individual')
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Check if user has enough credits
    IF current_balance IS NULL OR current_balance < p_credits_needed THEN
        RETURN FALSE;
    END IF;
    
    -- Deduct credits atomically
    UPDATE user_credits
    SET 
        credits_balance = credits_balance - p_credits_needed,
        credits_used = credits_used + p_credits_needed,
        updated_at = NOW()
    WHERE user_id = p_user_id
    AND user_type IN ('user', 'individual')
    AND credits_balance >= p_credits_needed;
    
    -- Check if update was successful
    GET DIAGNOSTICS updated_balance = ROW_COUNT;
    RETURN updated_balance > 0;
END;
$$ LANGUAGE plpgsql;

-- 5. ADD BOOKING CONFLICT PREVENTION TRIGGER
-- =============================================

-- Create function to prevent double bookings
CREATE OR REPLACE FUNCTION prevent_booking_conflicts() RETURNS TRIGGER AS $$
BEGIN
    -- Check for conflicts using the conflict detection function
    IF check_booking_conflict(
        NEW.therapist_id,
        NEW.session_date,
        NEW.session_time,
        NEW.session_time + INTERVAL '1 minute' * COALESCE(NEW.duration_minutes, 60)
    ) THEN
        RAISE EXCEPTION 'Booking conflict: Time slot is already booked';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent booking conflicts
DROP TRIGGER IF EXISTS trigger_prevent_booking_conflicts ON sessions;
CREATE TRIGGER trigger_prevent_booking_conflicts
    BEFORE INSERT ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION prevent_booking_conflicts();

-- 6. ADD PROPER INDEXES FOR PERFORMANCE
-- =============================================

-- Index for therapist availability queries
CREATE INDEX IF NOT EXISTS idx_therapist_availability_lookup 
ON therapist_availability (therapist_id, day_of_week, is_available);

-- Index for session queries
CREATE INDEX IF NOT EXISTS idx_sessions_therapist_date 
ON sessions (therapist_id, session_date, status);

-- Index for user credits
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id 
ON user_credits (user_id, user_type);

-- 7. ADD AUDIT TRAIL FOR BOOKING CHANGES
-- =============================================

-- Create audit table for booking changes
CREATE TABLE IF NOT EXISTS booking_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'cancelled', 'completed'
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to log booking changes
CREATE OR REPLACE FUNCTION log_booking_changes() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO booking_audit_log (session_id, user_id, action, new_status, changes)
        VALUES (NEW.id, NEW.user_id, 'created', NEW.status, to_jsonb(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO booking_audit_log (session_id, user_id, action, old_status, new_status, changes)
        VALUES (NEW.id, NEW.user_id, 'updated', OLD.status, NEW.status, 
                jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)));
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create audit trigger
DROP TRIGGER IF EXISTS trigger_log_booking_changes ON sessions;
CREATE TRIGGER trigger_log_booking_changes
    AFTER INSERT OR UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION log_booking_changes();

-- 8. CLEAN UP INCONSISTENT DATA
-- =============================================

-- Remove any sessions with invalid therapist_id references
DELETE FROM sessions 
WHERE therapist_id NOT IN (
    SELECT id FROM users WHERE user_type = 'therapist'
);

-- Remove any availability records with invalid therapist_id references
DELETE FROM therapist_availability 
WHERE therapist_id NOT IN (
    SELECT id FROM users WHERE user_type = 'therapist'
);

-- 9. ADD COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE therapist_availability IS 'Standardized therapist availability with therapist_id only';
COMMENT ON TABLE sessions IS 'Session bookings with conflict prevention and proper datetime handling';
COMMENT ON TABLE user_credits IS 'User credit system with proper validation';
COMMENT ON FUNCTION check_booking_conflict IS 'Prevents double bookings by checking for time conflicts';
COMMENT ON FUNCTION validate_and_deduct_credits IS 'Atomically validates and deducts user credits';
COMMENT ON FUNCTION prevent_booking_conflicts IS 'Database-level trigger to prevent booking conflicts';

-- 10. VERIFICATION QUERIES
-- =============================================

-- Verify the fixes worked
DO $$
DECLARE
    therapist_count INTEGER;
    availability_count INTEGER;
    sessions_count INTEGER;
    credits_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO therapist_count FROM users WHERE user_type = 'therapist';
    SELECT COUNT(*) INTO availability_count FROM therapist_availability;
    SELECT COUNT(*) INTO sessions_count FROM sessions;
    SELECT COUNT(*) INTO credits_count FROM user_credits;
    
    RAISE NOTICE 'Verification Results:';
    RAISE NOTICE 'Therapists: %', therapist_count;
    RAISE NOTICE 'Availability records: %', availability_count;
    RAISE NOTICE 'Sessions: %', sessions_count;
    RAISE NOTICE 'User credits: %', credits_count;
    
    -- Check for any remaining therapist_email columns
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'therapist_availability' 
        AND column_name = 'therapist_email'
    ) THEN
        RAISE WARNING 'therapist_email column still exists - manual cleanup required';
    ELSE
        RAISE NOTICE '✅ therapist_email column successfully removed';
    END IF;
    
    RAISE NOTICE '🎉 Critical availability and booking system fixes applied successfully!';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Update API endpoints to use therapist_id consistently';
    RAISE NOTICE '2. Remove testing code from booking API';
    RAISE NOTICE '3. Test booking conflict prevention';
    RAISE NOTICE '4. Verify credit validation works properly';
END $$;
