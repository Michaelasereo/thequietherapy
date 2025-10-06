-- Fix missing soap_notes column in session_notes table
-- This addresses the error: column session_notes_1.soap_notes does not exist

-- Check if the column exists first
DO $$ 
BEGIN
    -- Add soap_notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'session_notes' 
        AND column_name = 'soap_notes'
    ) THEN
        ALTER TABLE session_notes ADD COLUMN soap_notes TEXT;
        RAISE NOTICE 'Added soap_notes column to session_notes table';
    ELSE
        RAISE NOTICE 'soap_notes column already exists in session_notes table';
    END IF;
END $$;

-- Add other potentially missing columns
DO $$ 
BEGIN
    -- Add ai_notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'session_notes' 
        AND column_name = 'ai_notes'
    ) THEN
        ALTER TABLE session_notes ADD COLUMN ai_notes TEXT;
        RAISE NOTICE 'Added ai_notes column to session_notes table';
    ELSE
        RAISE NOTICE 'ai_notes column already exists in session_notes table';
    END IF;
END $$;

-- Add summary column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'session_notes' 
        AND column_name = 'summary'
    ) THEN
        ALTER TABLE session_notes ADD COLUMN summary TEXT;
        RAISE NOTICE 'Added summary column to session_notes table';
    ELSE
        RAISE NOTICE 'summary column already exists in session_notes table';
    END IF;
END $$;

-- Add created_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'session_notes' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE session_notes ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to session_notes table';
    ELSE
        RAISE NOTICE 'created_at column already exists in session_notes table';
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'session_notes' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE session_notes ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to session_notes table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in session_notes table';
    END IF;
END $$;
