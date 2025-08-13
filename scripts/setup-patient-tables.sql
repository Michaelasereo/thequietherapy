-- =====================================================
-- PATIENT DATA SCHEMA SETUP
-- Copy and paste this entire file into your Supabase SQL editor
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PATIENT BIODATA TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_biodata (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES global_users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    age INTEGER,
    sex VARCHAR(50),
    religion VARCHAR(100),
    occupation VARCHAR(255),
    marital_status VARCHAR(50),
    tribe VARCHAR(100),
    level_of_education VARCHAR(100),
    complaints TEXT,
    therapist_preference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PATIENT FAMILY HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_family_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES global_users(id) ON DELETE CASCADE,
    mental_health_history TEXT,
    substance_abuse_history TEXT,
    other_medical_history TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PATIENT SOCIAL HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_social_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES global_users(id) ON DELETE CASCADE,
    living_situation TEXT,
    employment TEXT,
    relationships TEXT,
    hobbies_interests TEXT,
    smoking_history TEXT,
    alcohol_history TEXT,
    other_drugs_history TEXT,
    stressors TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PATIENT MEDICAL HISTORY TABLE (THERAPIST-MANAGED)
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_medical_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES global_users(id) ON DELETE CASCADE,
    therapist_id UUID NOT NULL REFERENCES global_users(id) ON DELETE CASCADE,
    condition VARCHAR(255) NOT NULL,
    diagnosis_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PATIENT DRUG HISTORY TABLE (THERAPIST-MANAGED)
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_drug_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES global_users(id) ON DELETE CASCADE,
    therapist_id UUID NOT NULL REFERENCES global_users(id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    prescribing_doctor VARCHAR(255),
    duration_of_usage VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SESSION NOTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS session_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES global_sessions(id) ON DELETE CASCADE,
    therapist_id UUID NOT NULL REFERENCES global_users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_patient_biodata_user_id ON patient_biodata(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_family_history_user_id ON patient_family_history(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_social_history_user_id ON patient_social_history(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_medical_history_user_id ON patient_medical_history(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_medical_history_therapist_id ON patient_medical_history(therapist_id);
CREATE INDEX IF NOT EXISTS idx_patient_drug_history_user_id ON patient_drug_history(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_drug_history_therapist_id ON patient_drug_history(therapist_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_session_id ON session_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_therapist_id ON session_notes(therapist_id);

-- =====================================================
-- DROP EXISTING POLICIES (if any)
-- =====================================================

-- Drop existing policies for patient_biodata
DROP POLICY IF EXISTS "Users can view their own biodata" ON patient_biodata;
DROP POLICY IF EXISTS "Users can insert their own biodata" ON patient_biodata;
DROP POLICY IF EXISTS "Users can update their own biodata" ON patient_biodata;
DROP POLICY IF EXISTS "Therapists can view their clients' biodata" ON patient_biodata;

-- Drop existing policies for patient_family_history
DROP POLICY IF EXISTS "Users can view their own family history" ON patient_family_history;
DROP POLICY IF EXISTS "Users can insert their own family history" ON patient_family_history;
DROP POLICY IF EXISTS "Users can update their own family history" ON patient_family_history;
DROP POLICY IF EXISTS "Therapists can view their clients' family history" ON patient_family_history;

-- Drop existing policies for patient_social_history
DROP POLICY IF EXISTS "Users can view their own social history" ON patient_social_history;
DROP POLICY IF EXISTS "Users can insert their own social history" ON patient_social_history;
DROP POLICY IF EXISTS "Users can update their own social history" ON patient_social_history;
DROP POLICY IF EXISTS "Therapists can view their clients' social history" ON patient_social_history;

-- Drop existing policies for patient_medical_history
DROP POLICY IF EXISTS "Users can view their own medical history" ON patient_medical_history;
DROP POLICY IF EXISTS "Therapists can view their clients' medical history" ON patient_medical_history;
DROP POLICY IF EXISTS "Therapists can insert medical history for their clients" ON patient_medical_history;
DROP POLICY IF EXISTS "Therapists can update medical history for their clients" ON patient_medical_history;

-- Drop existing policies for patient_drug_history
DROP POLICY IF EXISTS "Users can view their own drug history" ON patient_drug_history;
DROP POLICY IF EXISTS "Therapists can view their clients' drug history" ON patient_drug_history;
DROP POLICY IF EXISTS "Therapists can insert drug history for their clients" ON patient_drug_history;
DROP POLICY IF EXISTS "Therapists can update drug history for their clients" ON patient_drug_history;

-- Drop existing policies for session_notes
DROP POLICY IF EXISTS "Users can view their session notes" ON session_notes;
DROP POLICY IF EXISTS "Therapists can view their session notes" ON session_notes;
DROP POLICY IF EXISTS "Therapists can insert session notes" ON session_notes;
DROP POLICY IF EXISTS "Therapists can update their session notes" ON session_notes;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE patient_biodata ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_family_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_social_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_drug_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;

-- Patient Biodata Policies
CREATE POLICY "Users can view their own biodata" ON patient_biodata
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own biodata" ON patient_biodata
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own biodata" ON patient_biodata
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Therapists can view their clients' biodata" ON patient_biodata
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM global_sessions
            WHERE global_sessions.user_id = patient_biodata.user_id
            AND global_sessions.therapist_id = auth.uid()
        )
    );

-- Patient Family History Policies
CREATE POLICY "Users can view their own family history" ON patient_family_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own family history" ON patient_family_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family history" ON patient_family_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Therapists can view their clients' family history" ON patient_family_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM global_sessions
            WHERE global_sessions.user_id = patient_family_history.user_id
            AND global_sessions.therapist_id = auth.uid()
        )
    );

-- Patient Social History Policies
CREATE POLICY "Users can view their own social history" ON patient_social_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own social history" ON patient_social_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social history" ON patient_social_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Therapists can view their clients' social history" ON patient_social_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM global_sessions
            WHERE global_sessions.user_id = patient_social_history.user_id
            AND global_sessions.therapist_id = auth.uid()
        )
    );

-- Patient Medical History Policies (Therapist-managed)
CREATE POLICY "Users can view their own medical history" ON patient_medical_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Therapists can view their clients' medical history" ON patient_medical_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM global_sessions
            WHERE global_sessions.user_id = patient_medical_history.user_id
            AND global_sessions.therapist_id = auth.uid()
        )
    );

CREATE POLICY "Therapists can insert medical history for their clients" ON patient_medical_history
    FOR INSERT WITH CHECK (
        therapist_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM global_sessions
            WHERE global_sessions.user_id = patient_medical_history.user_id
            AND global_sessions.therapist_id = auth.uid()
        )
    );

CREATE POLICY "Therapists can update medical history for their clients" ON patient_medical_history
    FOR UPDATE USING (
        therapist_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM global_sessions
            WHERE global_sessions.user_id = patient_medical_history.user_id
            AND global_sessions.therapist_id = auth.uid()
        )
    );

-- Patient Drug History Policies (Therapist-managed)
CREATE POLICY "Users can view their own drug history" ON patient_drug_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Therapists can view their clients' drug history" ON patient_drug_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM global_sessions
            WHERE global_sessions.user_id = patient_drug_history.user_id
            AND global_sessions.therapist_id = auth.uid()
        )
    );

CREATE POLICY "Therapists can insert drug history for their clients" ON patient_drug_history
    FOR INSERT WITH CHECK (
        therapist_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM global_sessions
            WHERE global_sessions.user_id = patient_drug_history.user_id
            AND global_sessions.therapist_id = auth.uid()
        )
    );

CREATE POLICY "Therapists can update drug history for their clients" ON patient_drug_history
    FOR UPDATE USING (
        therapist_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM global_sessions
            WHERE global_sessions.user_id = patient_drug_history.user_id
            AND global_sessions.therapist_id = auth.uid()
        )
    );

-- Session Notes Policies
CREATE POLICY "Users can view their session notes" ON session_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM global_sessions
            WHERE global_sessions.id = session_notes.session_id
            AND global_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Therapists can view their session notes" ON session_notes
    FOR SELECT USING (therapist_id = auth.uid());

CREATE POLICY "Therapists can insert session notes" ON session_notes
    FOR INSERT WITH CHECK (therapist_id = auth.uid());

CREATE POLICY "Therapists can update their session notes" ON session_notes
    FOR UPDATE USING (therapist_id = auth.uid());

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Drop existing functions first (using CASCADE to handle all signatures)
DROP FUNCTION IF EXISTS upsert_patient_biodata CASCADE;
DROP FUNCTION IF EXISTS upsert_patient_family_history CASCADE;
DROP FUNCTION IF EXISTS upsert_patient_social_history CASCADE;
DROP FUNCTION IF EXISTS add_patient_medical_history CASCADE;
DROP FUNCTION IF EXISTS add_patient_drug_history CASCADE;
DROP FUNCTION IF EXISTS get_patient_profile CASCADE;

-- Function to upsert patient biodata
CREATE OR REPLACE FUNCTION upsert_patient_biodata(
    p_user_id UUID,
    p_name VARCHAR(255),
    p_age INTEGER,
    p_sex VARCHAR(50),
    p_religion VARCHAR(100),
    p_occupation VARCHAR(255),
    p_marital_status VARCHAR(50),
    p_tribe VARCHAR(100),
    p_level_of_education VARCHAR(100),
    p_complaints TEXT,
    p_therapist_preference TEXT
)
RETURNS patient_biodata AS $$
DECLARE
    result patient_biodata;
BEGIN
    INSERT INTO patient_biodata (
        user_id, name, age, sex, religion, occupation, 
        marital_status, tribe, level_of_education, complaints, therapist_preference
    ) VALUES (
        p_user_id, p_name, p_age, p_sex, p_religion, p_occupation,
        p_marital_status, p_tribe, p_level_of_education, p_complaints, p_therapist_preference
    )
    ON CONFLICT (user_id) DO UPDATE SET
        name = EXCLUDED.name,
        age = EXCLUDED.age,
        sex = EXCLUDED.sex,
        religion = EXCLUDED.religion,
        occupation = EXCLUDED.occupation,
        marital_status = EXCLUDED.marital_status,
        tribe = EXCLUDED.tribe,
        level_of_education = EXCLUDED.level_of_education,
        complaints = EXCLUDED.complaints,
        therapist_preference = EXCLUDED.therapist_preference,
        updated_at = NOW()
    RETURNING * INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upsert patient family history
CREATE OR REPLACE FUNCTION upsert_patient_family_history(
    p_user_id UUID,
    p_mental_health_history TEXT,
    p_substance_abuse_history TEXT,
    p_other_medical_history TEXT
)
RETURNS patient_family_history AS $$
DECLARE
    result patient_family_history;
BEGIN
    INSERT INTO patient_family_history (
        user_id, mental_health_history, substance_abuse_history, other_medical_history
    ) VALUES (
        p_user_id, p_mental_health_history, p_substance_abuse_history, p_other_medical_history
    )
    ON CONFLICT (user_id) DO UPDATE SET
        mental_health_history = EXCLUDED.mental_health_history,
        substance_abuse_history = EXCLUDED.substance_abuse_history,
        other_medical_history = EXCLUDED.other_medical_history,
        updated_at = NOW()
    RETURNING * INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upsert patient social history
CREATE OR REPLACE FUNCTION upsert_patient_social_history(
    p_user_id UUID,
    p_living_situation TEXT,
    p_employment TEXT,
    p_relationships TEXT,
    p_hobbies_interests TEXT,
    p_smoking_history TEXT,
    p_alcohol_history TEXT,
    p_other_drugs_history TEXT,
    p_stressors TEXT
)
RETURNS patient_social_history AS $$
DECLARE
    result patient_social_history;
BEGIN
    INSERT INTO patient_social_history (
        user_id, living_situation, employment, relationships, hobbies_interests,
        smoking_history, alcohol_history, other_drugs_history, stressors
    ) VALUES (
        p_user_id, p_living_situation, p_employment, p_relationships, p_hobbies_interests,
        p_smoking_history, p_alcohol_history, p_other_drugs_history, p_stressors
    )
    ON CONFLICT (user_id) DO UPDATE SET
        living_situation = EXCLUDED.living_situation,
        employment = EXCLUDED.employment,
        relationships = EXCLUDED.relationships,
        hobbies_interests = EXCLUDED.hobbies_interests,
        smoking_history = EXCLUDED.smoking_history,
        alcohol_history = EXCLUDED.alcohol_history,
        other_drugs_history = EXCLUDED.other_drugs_history,
        stressors = EXCLUDED.stressors,
        updated_at = NOW()
    RETURNING * INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add patient medical history
CREATE OR REPLACE FUNCTION add_patient_medical_history(
    p_user_id UUID,
    p_therapist_id UUID,
    p_condition VARCHAR(255),
    p_diagnosis_date DATE,
    p_notes TEXT
)
RETURNS patient_medical_history AS $$
DECLARE
    result patient_medical_history;
BEGIN
    INSERT INTO patient_medical_history (
        user_id, therapist_id, condition, diagnosis_date, notes
    ) VALUES (
        p_user_id, p_therapist_id, p_condition, p_diagnosis_date, p_notes
    )
    RETURNING * INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add patient drug history
CREATE OR REPLACE FUNCTION add_patient_drug_history(
    p_user_id UUID,
    p_therapist_id UUID,
    p_medication_name VARCHAR(255),
    p_dosage VARCHAR(100),
    p_start_date DATE,
    p_prescribing_doctor VARCHAR(255),
    p_duration_of_usage VARCHAR(100),
    p_notes TEXT
)
RETURNS patient_drug_history AS $$
DECLARE
    result patient_drug_history;
BEGIN
    INSERT INTO patient_drug_history (
        user_id, therapist_id, medication_name, dosage, start_date,
        prescribing_doctor, duration_of_usage, notes
    ) VALUES (
        p_user_id, p_therapist_id, p_medication_name, p_dosage, p_start_date,
        p_prescribing_doctor, p_duration_of_usage, p_notes
    )
    RETURNING * INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get complete patient profile
CREATE OR REPLACE FUNCTION get_patient_profile(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'biodata', (SELECT row_to_json(pb.*) FROM patient_biodata pb WHERE pb.user_id = p_user_id),
        'family_history', (SELECT row_to_json(pfh.*) FROM patient_family_history pfh WHERE pfh.user_id = p_user_id),
        'social_history', (SELECT row_to_json(psh.*) FROM patient_social_history psh WHERE psh.user_id = p_user_id),
        'medical_history', (SELECT jsonb_agg(row_to_json(pmh.*)) FROM patient_medical_history pmh WHERE pmh.user_id = p_user_id),
        'drug_history', (SELECT jsonb_agg(row_to_json(pdh.*)) FROM patient_drug_history pdh WHERE pdh.user_id = p_user_id)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers first
DROP TRIGGER IF EXISTS update_patient_biodata_updated_at ON patient_biodata;
DROP TRIGGER IF EXISTS update_patient_family_history_updated_at ON patient_family_history;
DROP TRIGGER IF EXISTS update_patient_social_history_updated_at ON patient_social_history;
DROP TRIGGER IF EXISTS update_patient_medical_history_updated_at ON patient_medical_history;
DROP TRIGGER IF EXISTS update_patient_drug_history_updated_at ON patient_drug_history;
DROP TRIGGER IF EXISTS update_session_notes_updated_at ON session_notes;

-- Create triggers for updated_at
CREATE TRIGGER update_patient_biodata_updated_at
    BEFORE UPDATE ON patient_biodata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_family_history_updated_at
    BEFORE UPDATE ON patient_family_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_social_history_updated_at
    BEFORE UPDATE ON patient_social_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_medical_history_updated_at
    BEFORE UPDATE ON patient_medical_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_drug_history_updated_at
    BEFORE UPDATE ON patient_drug_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_notes_updated_at
    BEFORE UPDATE ON session_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Patient data schema setup completed successfully!';
    RAISE NOTICE '📋 Tables created: patient_biodata, patient_family_history, patient_social_history, patient_medical_history, patient_drug_history, session_notes';
    RAISE NOTICE '🔒 RLS policies configured for proper access control';
    RAISE NOTICE '⚙️ Functions created for data management';
    RAISE NOTICE '🔄 Triggers set up for automatic timestamp updates';
END $$;
