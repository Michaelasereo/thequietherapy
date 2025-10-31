-- Add session_type column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sessions'
          AND column_name = 'session_type'
    ) THEN
        ALTER TABLE sessions 
        ADD COLUMN session_type VARCHAR(50) DEFAULT 'video' 
        CHECK (session_type IN ('video', 'audio', 'chat', 'in_person'));
        
        RAISE NOTICE '✅ Added session_type column to sessions table';
    ELSE
        RAISE NOTICE '✅ session_type column already exists';
    END IF;
END $$;

