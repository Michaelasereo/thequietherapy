-- Fix Therapist Database Schema
-- This script ensures all necessary tables and columns exist for therapist profiles and document storage

-- 1. Ensure therapist_profiles table exists with all required columns
CREATE TABLE IF NOT EXISTS therapist_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mdcn_code VARCHAR(50),
    specialization TEXT,
    specializations TEXT[], -- Array version for compatibility
    languages TEXT,
    languages_array TEXT[], -- Array version for compatibility
    phone VARCHAR(20),
    bio TEXT,
    experience_years INTEGER DEFAULT 0,
    hourly_rate DECIMAL(10,2) DEFAULT 0.00,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    is_verified BOOLEAN DEFAULT FALSE,
    profile_image_url TEXT,
    education TEXT,
    certifications TEXT,
    availability_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Ensure therapist_enrollments table exists with document storage columns
CREATE TABLE IF NOT EXISTS therapist_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    mdcn_code VARCHAR(50),
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
    
    -- Document storage columns
    license_document TEXT,
    license_uploaded_at TIMESTAMP WITH TIME ZONE,
    license_verified BOOLEAN DEFAULT FALSE,
    id_document TEXT,
    id_uploaded_at TIMESTAMP WITH TIME ZONE,
    id_verified BOOLEAN DEFAULT FALSE,
    rejection_reason TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id),
    UNIQUE(email)
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_user_id ON therapist_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_verification_status ON therapist_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_mdcn_code ON therapist_profiles(mdcn_code);

CREATE INDEX IF NOT EXISTS idx_therapist_enrollments_user_id ON therapist_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_therapist_enrollments_email ON therapist_enrollments(email);
CREATE INDEX IF NOT EXISTS idx_therapist_enrollments_status ON therapist_enrollments(status);

-- 4. Enable Row Level Security
ALTER TABLE therapist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_enrollments ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for therapist_profiles
DROP POLICY IF EXISTS "Therapists can view their own profile" ON therapist_profiles;
CREATE POLICY "Therapists can view their own profile" ON therapist_profiles
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Therapists can update their own profile" ON therapist_profiles;
CREATE POLICY "Therapists can update their own profile" ON therapist_profiles
    FOR UPDATE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Therapists can insert their own profile" ON therapist_profiles;
CREATE POLICY "Therapists can insert their own profile" ON therapist_profiles
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Admins can view all therapist profiles" ON therapist_profiles;
CREATE POLICY "Admins can view all therapist profiles" ON therapist_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND user_type = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can update all therapist profiles" ON therapist_profiles;
CREATE POLICY "Admins can update all therapist profiles" ON therapist_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND user_type = 'admin'
        )
    );

-- 6. Create RLS policies for therapist_enrollments
DROP POLICY IF EXISTS "Users can view their own enrollment" ON therapist_enrollments;
CREATE POLICY "Users can view their own enrollment" ON therapist_enrollments
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update their own enrollment" ON therapist_enrollments;
CREATE POLICY "Users can update their own enrollment" ON therapist_enrollments
    FOR UPDATE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert their own enrollment" ON therapist_enrollments;
CREATE POLICY "Users can insert their own enrollment" ON therapist_enrollments
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Admins can view all enrollments" ON therapist_enrollments;
CREATE POLICY "Admins can view all enrollments" ON therapist_enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND user_type = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can update all enrollments" ON therapist_enrollments;
CREATE POLICY "Admins can update all enrollments" ON therapist_enrollments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND user_type = 'admin'
        )
    );

-- 7. Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_therapist_profiles_updated_at ON therapist_profiles;
CREATE TRIGGER update_therapist_profiles_updated_at 
    BEFORE UPDATE ON therapist_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_therapist_enrollments_updated_at ON therapist_enrollments;
CREATE TRIGGER update_therapist_enrollments_updated_at 
    BEFORE UPDATE ON therapist_enrollments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Add missing columns to existing tables (if they don't exist)
DO $$ 
BEGIN
    -- Add columns to therapist_profiles if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_profiles' AND column_name = 'bio') THEN
        ALTER TABLE therapist_profiles ADD COLUMN bio TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_profiles' AND column_name = 'phone') THEN
        ALTER TABLE therapist_profiles ADD COLUMN phone VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_profiles' AND column_name = 'mdcn_code') THEN
        ALTER TABLE therapist_profiles ADD COLUMN mdcn_code VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_profiles' AND column_name = 'specialization') THEN
        ALTER TABLE therapist_profiles ADD COLUMN specialization TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_profiles' AND column_name = 'languages') THEN
        ALTER TABLE therapist_profiles ADD COLUMN languages TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_profiles' AND column_name = 'hourly_rate') THEN
        ALTER TABLE therapist_profiles ADD COLUMN hourly_rate DECIMAL(10,2) DEFAULT 0.00;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_profiles' AND column_name = 'is_verified') THEN
        ALTER TABLE therapist_profiles ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add columns to therapist_enrollments if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'user_id') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'bio') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN bio TEXT;
    END IF;
    
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
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'rejection_reason') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN rejection_reason TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapist_enrollments' AND column_name = 'approved_at') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 10. Create unique constraints if they don't exist
DO $$
BEGIN
    -- Add unique constraint on user_id for therapist_profiles if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'therapist_profiles' AND constraint_name = 'therapist_profiles_user_id_key') THEN
        ALTER TABLE therapist_profiles ADD CONSTRAINT therapist_profiles_user_id_key UNIQUE (user_id);
    END IF;
    
    -- Add unique constraint on user_id for therapist_enrollments if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'therapist_enrollments' AND constraint_name = 'therapist_enrollments_user_id_key') THEN
        ALTER TABLE therapist_enrollments ADD CONSTRAINT therapist_enrollments_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 11. Verify tables exist and show structure
SELECT 'therapist_profiles' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'therapist_profiles' 
ORDER BY ordinal_position;

SELECT 'therapist_enrollments' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'therapist_enrollments' 
ORDER BY ordinal_position;

-- 12. Show success message
SELECT 'Therapist database schema has been fixed and verified!' as status;
