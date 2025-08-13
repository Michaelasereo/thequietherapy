-- Patient Data Schema for User Dashboard
-- Tables for storing patient information that can be filled by patients themselves

-- 1. Patient Biodata Table
CREATE TABLE IF NOT EXISTS patient_biodata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    age INTEGER,
    sex TEXT CHECK (sex IN ('male', 'female', 'other')),
    religion TEXT,
    occupation TEXT,
    marital_status TEXT CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed', 'separated')),
    tribe TEXT,
    level_of_education TEXT CHECK (level_of_education IN ('primary', 'secondary', 'diploma', 'bachelor', 'master', 'phd', 'other')),
    complaints TEXT,
    therapist_preference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Patient Family History Table
CREATE TABLE IF NOT EXISTS patient_family_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mental_health_history TEXT,
    substance_abuse_history TEXT,
    other_medical_history TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. Patient Social History Table
CREATE TABLE IF NOT EXISTS patient_social_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    living_situation TEXT,
    employment TEXT,
    relationships TEXT,
    hobbies_interests TEXT,
    smoking_history TEXT,
    alcohol_history TEXT,
    other_drugs_history TEXT,
    stressors TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 4. Patient Medical History Table (for therapist use only)
CREATE TABLE IF NOT EXISTS patient_medical_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    therapist_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    condition TEXT NOT NULL,
    diagnosis_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Patient Drug History Table (for therapist use only)
CREATE TABLE IF NOT EXISTS patient_drug_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    therapist_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    medication_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    start_date DATE NOT NULL,
    prescribing_doctor TEXT,
    notes TEXT,
    duration_of_usage TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_biodata_user_id ON patient_biodata(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_family_history_user_id ON patient_family_history(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_social_history_user_id ON patient_social_history(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_medical_history_user_id ON patient_medical_history(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_medical_history_therapist_id ON patient_medical_history(therapist_id);
CREATE INDEX IF NOT EXISTS idx_patient_drug_history_user_id ON patient_drug_history(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_drug_history_therapist_id ON patient_drug_history(therapist_id);

-- Row Level Security (RLS) Policies

-- Patient Biodata RLS
ALTER TABLE patient_biodata ENABLE ROW LEVEL SECURITY;

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

-- Patient Family History RLS
ALTER TABLE patient_family_history ENABLE ROW LEVEL SECURITY;

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

-- Patient Social History RLS
ALTER TABLE patient_social_history ENABLE ROW LEVEL SECURITY;

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

-- Patient Medical History RLS (Therapist only)
ALTER TABLE patient_medical_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own medical history" ON patient_medical_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Therapists can insert medical history for their clients" ON patient_medical_history
    FOR INSERT WITH CHECK (
        auth.uid() = therapist_id AND
        EXISTS (
            SELECT 1 FROM global_sessions 
            WHERE global_sessions.user_id = patient_medical_history.user_id 
            AND global_sessions.therapist_id = auth.uid()
        )
    );

CREATE POLICY "Therapists can update medical history for their clients" ON patient_medical_history
    FOR UPDATE USING (
        auth.uid() = therapist_id AND
        EXISTS (
            SELECT 1 FROM global_sessions 
            WHERE global_sessions.user_id = patient_medical_history.user_id 
            AND global_sessions.therapist_id = auth.uid()
        )
    );

-- Patient Drug History RLS (Therapist only)
ALTER TABLE patient_drug_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own drug history" ON patient_drug_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Therapists can insert drug history for their clients" ON patient_drug_history
    FOR INSERT WITH CHECK (
        auth.uid() = therapist_id AND
        EXISTS (
            SELECT 1 FROM global_sessions 
            WHERE global_sessions.user_id = patient_drug_history.user_id 
            AND global_sessions.therapist_id = auth.uid()
        )
    );

CREATE POLICY "Therapists can update drug history for their clients" ON patient_drug_history
    FOR UPDATE USING (
        auth.uid() = therapist_id AND
        EXISTS (
            SELECT 1 FROM global_sessions 
            WHERE global_sessions.user_id = patient_drug_history.user_id 
            AND global_sessions.therapist_id = auth.uid()
        )
    );

-- Functions for managing patient data

-- Function to upsert patient biodata
CREATE OR REPLACE FUNCTION upsert_patient_biodata(
    p_user_id UUID,
    p_name TEXT DEFAULT NULL,
    p_age INTEGER DEFAULT NULL,
    p_sex TEXT DEFAULT NULL,
    p_religion TEXT DEFAULT NULL,
    p_occupation TEXT DEFAULT NULL,
    p_marital_status TEXT DEFAULT NULL,
    p_tribe TEXT DEFAULT NULL,
    p_level_of_education TEXT DEFAULT NULL,
    p_complaints TEXT DEFAULT NULL,
    p_therapist_preference TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_biodata_id UUID;
BEGIN
    INSERT INTO patient_biodata (
        user_id,
        name,
        age,
        sex,
        religion,
        occupation,
        marital_status,
        tribe,
        level_of_education,
        complaints,
        therapist_preference
    ) VALUES (
        p_user_id,
        p_name,
        p_age,
        p_sex,
        p_religion,
        p_occupation,
        p_marital_status,
        p_tribe,
        p_level_of_education,
        p_complaints,
        p_therapist_preference
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
    RETURNING id INTO v_biodata_id;
    
    RETURN v_biodata_id;
END;
$$ LANGUAGE plpgsql;

-- Function to upsert patient family history
CREATE OR REPLACE FUNCTION upsert_patient_family_history(
    p_user_id UUID,
    p_mental_health_history TEXT DEFAULT NULL,
    p_substance_abuse_history TEXT DEFAULT NULL,
    p_other_medical_history TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_family_history_id UUID;
BEGIN
    INSERT INTO patient_family_history (
        user_id,
        mental_health_history,
        substance_abuse_history,
        other_medical_history
    ) VALUES (
        p_user_id,
        p_mental_health_history,
        p_substance_abuse_history,
        p_other_medical_history
    )
    ON CONFLICT (user_id) DO UPDATE SET
        mental_health_history = EXCLUDED.mental_health_history,
        substance_abuse_history = EXCLUDED.substance_abuse_history,
        other_medical_history = EXCLUDED.other_medical_history,
        updated_at = NOW()
    RETURNING id INTO v_family_history_id;
    
    RETURN v_family_history_id;
END;
$$ LANGUAGE plpgsql;

-- Function to upsert patient social history
CREATE OR REPLACE FUNCTION upsert_patient_social_history(
    p_user_id UUID,
    p_living_situation TEXT DEFAULT NULL,
    p_employment TEXT DEFAULT NULL,
    p_relationships TEXT DEFAULT NULL,
    p_hobbies_interests TEXT DEFAULT NULL,
    p_smoking_history TEXT DEFAULT NULL,
    p_alcohol_history TEXT DEFAULT NULL,
    p_other_drugs_history TEXT DEFAULT NULL,
    p_stressors TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_social_history_id UUID;
BEGIN
    INSERT INTO patient_social_history (
        user_id,
        living_situation,
        employment,
        relationships,
        hobbies_interests,
        smoking_history,
        alcohol_history,
        other_drugs_history,
        stressors
    ) VALUES (
        p_user_id,
        p_living_situation,
        p_employment,
        p_relationships,
        p_hobbies_interests,
        p_smoking_history,
        p_alcohol_history,
        p_other_drugs_history,
        p_stressors
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
    RETURNING id INTO v_social_history_id;
    
    RETURN v_social_history_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add medical history (therapist only)
CREATE OR REPLACE FUNCTION add_patient_medical_history(
    p_user_id UUID,
    p_therapist_id UUID,
    p_condition TEXT,
    p_diagnosis_date DATE,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_medical_history_id UUID;
BEGIN
    INSERT INTO patient_medical_history (
        user_id,
        therapist_id,
        condition,
        diagnosis_date,
        notes
    ) VALUES (
        p_user_id,
        p_therapist_id,
        p_condition,
        p_diagnosis_date,
        p_notes
    ) RETURNING id INTO v_medical_history_id;
    
    RETURN v_medical_history_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add drug history (therapist only)
CREATE OR REPLACE FUNCTION add_patient_drug_history(
    p_user_id UUID,
    p_therapist_id UUID,
    p_medication_name TEXT,
    p_dosage TEXT,
    p_start_date DATE,
    p_prescribing_doctor TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_duration_of_usage TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_drug_history_id UUID;
BEGIN
    INSERT INTO patient_drug_history (
        user_id,
        therapist_id,
        medication_name,
        dosage,
        start_date,
        prescribing_doctor,
        notes,
        duration_of_usage
    ) VALUES (
        p_user_id,
        p_therapist_id,
        p_medication_name,
        p_dosage,
        p_start_date,
        p_prescribing_doctor,
        p_notes,
        p_duration_of_usage
    ) RETURNING id INTO v_drug_history_id;
    
    RETURN v_drug_history_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get complete patient profile
CREATE OR REPLACE FUNCTION get_patient_profile(p_user_id UUID)
RETURNS TABLE (
    biodata JSONB,
    family_history JSONB,
    social_history JSONB,
    medical_history JSONB,
    drug_history JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(
            (SELECT to_jsonb(pb.*) FROM patient_biodata pb WHERE pb.user_id = p_user_id),
            '{}'::jsonb
        ) as biodata,
        COALESCE(
            (SELECT to_jsonb(pfh.*) FROM patient_family_history pfh WHERE pfh.user_id = p_user_id),
            '{}'::jsonb
        ) as family_history,
        COALESCE(
            (SELECT to_jsonb(psh.*) FROM patient_social_history psh WHERE psh.user_id = p_user_id),
            '{}'::jsonb
        ) as social_history,
        COALESCE(
            (SELECT jsonb_agg(to_jsonb(pmh.*)) FROM patient_medical_history pmh WHERE pmh.user_id = p_user_id),
            '[]'::jsonb
        ) as medical_history,
        COALESCE(
            (SELECT jsonb_agg(to_jsonb(pdh.*)) FROM patient_drug_history pdh WHERE pdh.user_id = p_user_id),
            '[]'::jsonb
        ) as drug_history;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic updates

-- Trigger to update updated_at timestamp for patient tables
CREATE TRIGGER update_patient_biodata_updated_at
    BEFORE UPDATE ON patient_biodata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_family_history_updated_at
    BEFORE UPDATE ON patient_family_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_social_history_updated_at
    BEFORE UPDATE ON patient_social_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_medical_history_updated_at
    BEFORE UPDATE ON patient_medical_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_drug_history_updated_at
    BEFORE UPDATE ON patient_drug_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE patient_biodata IS 'Stores patient personal information that can be filled by patients themselves';
COMMENT ON TABLE patient_family_history IS 'Stores patient family medical history that can be filled by patients themselves';
COMMENT ON TABLE patient_social_history IS 'Stores patient social history that can be filled by patients themselves';
COMMENT ON TABLE patient_medical_history IS 'Stores patient medical diagnoses that are filled by therapists only';
COMMENT ON TABLE patient_drug_history IS 'Stores patient medication history that is filled by therapists only';

COMMENT ON FUNCTION upsert_patient_biodata IS 'Upserts patient biodata - creates new record or updates existing one';
COMMENT ON FUNCTION upsert_patient_family_history IS 'Upserts patient family history - creates new record or updates existing one';
COMMENT ON FUNCTION upsert_patient_social_history IS 'Upserts patient social history - creates new record or updates existing one';
COMMENT ON FUNCTION add_patient_medical_history IS 'Adds medical history record (therapist only)';
COMMENT ON FUNCTION add_patient_drug_history IS 'Adds drug history record (therapist only)';
COMMENT ON FUNCTION get_patient_profile IS 'Gets complete patient profile including all history data';
