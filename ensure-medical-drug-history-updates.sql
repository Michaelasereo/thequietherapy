-- =====================================================
-- ENSURE MEDICAL & DRUG HISTORY UPDATE FUNCTIONALITY
-- Run this script to verify and fix database setup
-- =====================================================

-- =====================================================
-- 1. VERIFY TABLES EXIST AND HAVE CORRECT STRUCTURE
-- =====================================================

-- Ensure patient_medical_history table exists with correct columns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patient_medical_history' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE patient_medical_history 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Ensure patient_drug_history table exists with correct columns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patient_drug_history' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE patient_drug_history 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- =====================================================
-- 2. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE patient_medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_drug_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. DROP EXISTING POLICIES (IF THEY EXIST) AND RECREATE
-- =====================================================

-- Drop existing medical history update policies
DROP POLICY IF EXISTS "Therapists can update medical history for their clients" ON patient_medical_history;
DROP POLICY IF EXISTS "Users can update their own medical history" ON patient_medical_history;

-- Drop existing drug history update policies
DROP POLICY IF EXISTS "Therapists can update drug history for their clients" ON patient_drug_history;
DROP POLICY IF EXISTS "Users can update their own drug history" ON patient_drug_history;

-- =====================================================
-- 4. CREATE UPDATE POLICIES FOR MEDICAL HISTORY
-- =====================================================

-- Policy: Therapists can update medical history records they created
-- Simplifies to: if therapist_id matches, allow update (therapist created it)
CREATE POLICY "Therapists can update medical history for their clients" ON patient_medical_history
    FOR UPDATE USING (
        -- Therapist must be the creator of the record
        therapist_id = auth.uid()
    )
    WITH CHECK (
        -- Ensure the therapist_id doesn't change during update
        therapist_id = auth.uid()
    );

-- Policy: Users can view their own medical history
DROP POLICY IF EXISTS "Users can view their own medical history" ON patient_medical_history;
CREATE POLICY "Users can view their own medical history" ON patient_medical_history
    FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- 5. CREATE UPDATE POLICIES FOR DRUG HISTORY
-- =====================================================

-- Policy: Therapists can update drug history records they created
-- Simplifies to: if therapist_id matches, allow update (therapist created it)
CREATE POLICY "Therapists can update drug history for their clients" ON patient_drug_history
    FOR UPDATE USING (
        -- Therapist must be the creator of the record
        therapist_id = auth.uid()
    )
    WITH CHECK (
        -- Ensure the therapist_id doesn't change during update
        therapist_id = auth.uid()
    );

-- Policy: Users can view their own drug history
DROP POLICY IF EXISTS "Users can view their own drug history" ON patient_drug_history;
CREATE POLICY "Users can view their own drug history" ON patient_drug_history
    FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- 6. ENSURE TRIGGERS FOR UPDATED_AT ARE IN PLACE
-- =====================================================

-- Create or replace the function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_patient_medical_history_updated_at ON patient_medical_history;
DROP TRIGGER IF EXISTS update_patient_drug_history_updated_at ON patient_drug_history;

-- Create triggers for automatic updated_at updates
CREATE TRIGGER update_patient_medical_history_updated_at
    BEFORE UPDATE ON patient_medical_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_drug_history_updated_at
    BEFORE UPDATE ON patient_drug_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. VERIFY INDEXES EXIST FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_patient_medical_history_user_id ON patient_medical_history(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_medical_history_therapist_id ON patient_medical_history(therapist_id);
CREATE INDEX IF NOT EXISTS idx_patient_drug_history_user_id ON patient_drug_history(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_drug_history_therapist_id ON patient_drug_history(therapist_id);

-- =====================================================
-- 8. VERIFICATION QUERIES (for testing)
-- =====================================================

-- Uncomment these to verify setup:
-- SELECT tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('patient_medical_history', 'patient_drug_history');

-- SELECT trigger_name, event_manipulation, event_object_table 
-- FROM information_schema.triggers 
-- WHERE event_object_table IN ('patient_medical_history', 'patient_drug_history');

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Medical and Drug History Update Setup Complete!';
    RAISE NOTICE '📋 RLS policies configured for therapist updates';
    RAISE NOTICE '🔄 Triggers set up for automatic timestamp updates';
    RAISE NOTICE '📊 Indexes verified for optimal performance';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Therapists can now update medical and drug history records they created';
END $$;

