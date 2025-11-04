-- Ensure Therapist Enrollments Table Has All Required Columns
-- Run this in your Supabase SQL Editor to fix enrollment issues

-- 1. Ensure therapist_enrollments table exists with core columns
CREATE TABLE IF NOT EXISTS therapist_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    mdcn_code VARCHAR(50),
    licensed_qualification VARCHAR(255), -- Alternative column name
    specialization TEXT,
    specializations TEXT[],
    languages TEXT,
    languages_array TEXT[],
    bio TEXT,
    experience_years INTEGER DEFAULT 0,
    education TEXT,
    license_number VARCHAR(100),
    hourly_rate DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Profile image
    profile_image_url TEXT,
    
    -- Personal information fields (for enrollment)
    gender VARCHAR(20),
    age INTEGER,
    marital_status VARCHAR(20),
    
    -- Document storage columns
    license_document TEXT,
    license_uploaded_at TIMESTAMP WITH TIME ZONE,
    license_verified BOOLEAN DEFAULT FALSE,
    id_document TEXT,
    id_uploaded_at TIMESTAMP WITH TIME ZONE,
    id_verified BOOLEAN DEFAULT FALSE,
    rejection_reason TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Edit tracking
    edited_fields TEXT[] DEFAULT '{}',
    original_enrollment_data JSONB,
    profile_updated_at TIMESTAMP WITH TIME ZONE,
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(email)
    -- Note: user_id is NULL during enrollment, so we don't use UNIQUE(user_id) constraint
    -- user_id will be set after user account is created via magic link
);

-- 2. Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Core enrollment fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'user_id') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'mdcn_code') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN mdcn_code VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'licensed_qualification') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN licensed_qualification VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'specialization') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN specialization TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'specializations') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN specializations TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'languages') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN languages TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'languages_array') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN languages_array TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'bio') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN bio TEXT;
    END IF;
    
    -- Personal information fields (NEW - for enrollment form)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'gender') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN gender VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'age') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN age INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'marital_status') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN marital_status VARCHAR(20);
    END IF;
    
    -- Profile image
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'profile_image_url') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN profile_image_url TEXT;
    END IF;
    
    -- Document storage
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'license_document') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN license_document TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'license_uploaded_at') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN license_uploaded_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'license_verified') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN license_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'id_document') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN id_document TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'id_uploaded_at') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN id_uploaded_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'id_verified') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN id_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Status and tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'is_verified') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'is_active') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'rejection_reason') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN rejection_reason TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'approved_at') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Edit tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'edited_fields') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN edited_fields TEXT[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'original_enrollment_data') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN original_enrollment_data JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'profile_updated_at') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN profile_updated_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'enrollment_date') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_therapist_enrollments_user_id ON therapist_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_therapist_enrollments_email ON therapist_enrollments(email);
CREATE INDEX IF NOT EXISTS idx_therapist_enrollments_status ON therapist_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_therapist_enrollments_is_verified ON therapist_enrollments(is_verified);
CREATE INDEX IF NOT EXISTS idx_therapist_enrollments_is_active ON therapist_enrollments(is_active);

-- 4. Create unique constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'therapist_enrollments' 
                   AND constraint_name = 'therapist_enrollments_user_id_key') THEN
        ALTER TABLE therapist_enrollments ADD CONSTRAINT therapist_enrollments_user_id_key UNIQUE (user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'therapist_enrollments' 
                   AND constraint_name = 'therapist_enrollments_email_key') THEN
        ALTER TABLE therapist_enrollments ADD CONSTRAINT therapist_enrollments_email_key UNIQUE (email);
    END IF;
END $$;

-- 5. Verify table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'therapist_enrollments' 
ORDER BY ordinal_position;

-- 6. Success message
SELECT '✅ therapist_enrollments table is now complete with all required columns!' as status;
