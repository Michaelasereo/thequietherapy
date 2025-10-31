-- =============================================
-- EXCLUSION CONSTRAINT: PREVENT DOUBLE-BOOKING
-- =============================================

-- Enable required extension for GiST with equality operators
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Drop existing exclusion constraint if it exists (by name)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'exclude_sessions_therapist_time_overlap'
    ) THEN
        ALTER TABLE sessions DROP CONSTRAINT exclude_sessions_therapist_time_overlap;
        RAISE NOTICE 'Dropped existing exclusion constraint';
    END IF;
END $$;

-- Prevent overlapping sessions per therapist for active statuses
-- This uses EXCLUDE constraint (not UNIQUE INDEX) for proper exclusion semantics
ALTER TABLE sessions
ADD CONSTRAINT exclude_sessions_therapist_time_overlap
EXCLUDE USING gist (
    therapist_id WITH =,
    tstzrange(start_time, end_time) WITH &&
)
WHERE (status IN ('scheduled', 'confirmed', 'in_progress'));

-- Sanity check (optional): count any existing overlaps
-- SELECT count(*) FROM sessions s1
-- JOIN sessions s2 ON s1.therapist_id = s2.therapist_id 
--   AND s1.id != s2.id
--   AND tstzrange(s1.start_time, s1.end_time) && tstzrange(s2.start_time, s2.end_time)
-- WHERE s1.status IN ('scheduled', 'confirmed', 'in_progress')
--   AND s2.status IN ('scheduled', 'confirmed', 'in_progress');


