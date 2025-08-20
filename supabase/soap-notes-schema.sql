-- SOAP Notes Schema
-- This file contains the database schema for SOAP-compliant session notes

-- Session SOAP Notes Table
CREATE TABLE IF NOT EXISTS session_soap_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES global_sessions(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES global_users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES global_users(id) ON DELETE CASCADE,
  
  -- SOAP Components (stored as JSONB for flexibility)
  subjective JSONB NOT NULL DEFAULT '{}',
  objective JSONB NOT NULL DEFAULT '{}',
  assessment JSONB NOT NULL DEFAULT '{}',
  plan JSONB NOT NULL DEFAULT '{}',
  
  -- Session Ratings
  session_rating INTEGER CHECK (session_rating >= 1 AND session_rating <= 10) DEFAULT 5,
  therapeutic_alliance_rating INTEGER CHECK (therapeutic_alliance_rating >= 1 AND therapeutic_alliance_rating <= 10) DEFAULT 5,
  patient_engagement INTEGER CHECK (patient_engagement >= 1 AND patient_engagement <= 10) DEFAULT 5,
  treatment_compliance INTEGER CHECK (treatment_compliance >= 1 AND treatment_compliance <= 10) DEFAULT 5,
  
  -- Additional fields
  notes TEXT,
  ai_generated BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(session_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_soap_notes_session_id ON session_soap_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_session_soap_notes_therapist_id ON session_soap_notes(therapist_id);
CREATE INDEX IF NOT EXISTS idx_session_soap_notes_patient_id ON session_soap_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_session_soap_notes_created_at ON session_soap_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_session_soap_notes_ai_generated ON session_soap_notes(ai_generated);

-- RLS Policies for session_soap_notes
ALTER TABLE session_soap_notes ENABLE ROW LEVEL SECURITY;

-- Therapists can view and edit their own SOAP notes
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'session_soap_notes' AND policyname = 'Therapists can manage their own SOAP notes') THEN
    CREATE POLICY "Therapists can manage their own SOAP notes" ON session_soap_notes
      FOR ALL USING (
        therapist_id = auth.uid() OR 
        patient_id = auth.uid()
      );
  END IF;
END $$;

-- Patients can view their own SOAP notes (read-only)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'session_soap_notes' AND policyname = 'Patients can view their own SOAP notes') THEN
    CREATE POLICY "Patients can view their own SOAP notes" ON session_soap_notes
      FOR SELECT USING (patient_id = auth.uid());
  END IF;
END $$;

-- Admins can view all SOAP notes
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'session_soap_notes' AND policyname = 'Admins can view all SOAP notes') THEN
    CREATE POLICY "Admins can view all SOAP notes" ON session_soap_notes
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM global_users 
          WHERE id = auth.uid() AND user_type = 'admin'
        )
      );
  END IF;
END $$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_session_soap_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_session_soap_notes_updated_at') THEN
    CREATE TRIGGER update_session_soap_notes_updated_at
      BEFORE UPDATE ON session_soap_notes
      FOR EACH ROW
      EXECUTE FUNCTION update_session_soap_notes_updated_at();
  END IF;
END $$;

-- Session Transcripts Table (for AI processing)
CREATE TABLE IF NOT EXISTS session_transcripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES global_sessions(id) ON DELETE CASCADE,
  transcript_text TEXT NOT NULL,
  audio_url TEXT,
  processing_status TEXT DEFAULT 'completed' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  word_count INTEGER,
  duration_seconds INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(session_id)
);

-- Indexes for session_transcripts
CREATE INDEX IF NOT EXISTS idx_session_transcripts_session_id ON session_transcripts(session_id);
CREATE INDEX IF NOT EXISTS idx_session_transcripts_processing_status ON session_transcripts(processing_status);

-- RLS Policies for session_transcripts
ALTER TABLE session_transcripts ENABLE ROW LEVEL SECURITY;

-- Users can view transcripts for their sessions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'session_transcripts' AND policyname = 'Users can view their session transcripts') THEN
    CREATE POLICY "Users can view their session transcripts" ON session_transcripts
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM global_sessions 
          WHERE id = session_transcripts.session_id 
          AND (user_id = auth.uid() OR therapist_id = auth.uid())
        )
      );
  END IF;
END $$;

-- Function to update updated_at timestamp for transcripts
CREATE OR REPLACE FUNCTION update_session_transcripts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at for transcripts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_session_transcripts_updated_at') THEN
    CREATE TRIGGER update_session_transcripts_updated_at
      BEFORE UPDATE ON session_transcripts
      FOR EACH ROW
      EXECUTE FUNCTION update_session_transcripts_updated_at();
  END IF;
END $$;

-- Partner Bulk Upload Logs Table
CREATE TABLE IF NOT EXISTS partner_bulk_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES global_users(id) ON DELETE CASCADE,
  upload_reference TEXT NOT NULL,
  file_name TEXT NOT NULL,
  total_records INTEGER NOT NULL,
  successful_uploads INTEGER DEFAULT 0,
  failed_uploads INTEGER DEFAULT 0,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  error_log JSONB DEFAULT '[]',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  UNIQUE(upload_reference)
);

-- Indexes for partner_bulk_uploads
CREATE INDEX IF NOT EXISTS idx_partner_bulk_uploads_partner_id ON partner_bulk_uploads(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_bulk_uploads_status ON partner_bulk_uploads(processing_status);
CREATE INDEX IF NOT EXISTS idx_partner_bulk_uploads_created_at ON partner_bulk_uploads(created_at);

-- RLS Policies for partner_bulk_uploads
ALTER TABLE partner_bulk_uploads ENABLE ROW LEVEL SECURITY;

-- Partners can view their own upload logs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'partner_bulk_uploads' AND policyname = 'Partners can view their upload logs') THEN
    CREATE POLICY "Partners can view their upload logs" ON partner_bulk_uploads
      FOR SELECT USING (partner_id = auth.uid());
  END IF;
END $$;

-- Partners can create upload logs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'partner_bulk_uploads' AND policyname = 'Partners can create upload logs') THEN
    CREATE POLICY "Partners can create upload logs" ON partner_bulk_uploads
      FOR INSERT WITH CHECK (partner_id = auth.uid());
  END IF;
END $$;

-- Partners can update their upload logs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'partner_bulk_uploads' AND policyname = 'Partners can update their upload logs') THEN
    CREATE POLICY "Partners can update their upload logs" ON partner_bulk_uploads
      FOR UPDATE USING (partner_id = auth.uid());
  END IF;
END $$;

-- Admins can view all upload logs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'partner_bulk_uploads' AND policyname = 'Admins can view all upload logs') THEN
    CREATE POLICY "Admins can view all upload logs" ON partner_bulk_uploads
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM global_users 
          WHERE id = auth.uid() AND user_type = 'admin'
        )
      );
  END IF;
END $$;

-- Views for reporting
CREATE OR REPLACE VIEW soap_notes_summary AS
SELECT 
  ssn.id,
  ssn.session_id,
  ssn.therapist_id,
  ssn.patient_id,
  gu_patient.full_name as patient_name,
  gu_therapist.full_name as therapist_name,
  gs.start_time as scheduled_date,
  ssn.session_rating,
  ssn.therapeutic_alliance_rating,
  ssn.patient_engagement,
  ssn.treatment_compliance,
  ssn.ai_generated,
  ssn.created_at,
  ssn.updated_at
FROM session_soap_notes ssn
JOIN global_sessions gs ON ssn.session_id = gs.id
JOIN global_users gu_patient ON ssn.patient_id = gu_patient.id
JOIN global_users gu_therapist ON ssn.therapist_id = gu_therapist.id;

-- Function to get SOAP notes statistics
CREATE OR REPLACE FUNCTION get_soap_notes_stats(
  p_therapist_id UUID DEFAULT NULL,
  p_patient_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_notes BIGINT,
  ai_generated_count BIGINT,
  avg_session_rating NUMERIC,
  avg_therapeutic_alliance NUMERIC,
  avg_patient_engagement NUMERIC,
  avg_treatment_compliance NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_notes,
    COUNT(*) FILTER (WHERE ai_generated = true) as ai_generated_count,
    AVG(session_rating) as avg_session_rating,
    AVG(therapeutic_alliance_rating) as avg_therapeutic_alliance,
    AVG(patient_engagement) as avg_patient_engagement,
    AVG(treatment_compliance) as avg_treatment_compliance
  FROM session_soap_notes ssn
  JOIN global_sessions gs ON ssn.session_id = gs.id
  WHERE (p_therapist_id IS NULL OR ssn.therapist_id = p_therapist_id)
    AND (p_patient_id IS NULL OR ssn.patient_id = p_patient_id)
    AND (p_start_date IS NULL OR gs.start_time::date >= p_start_date)
    AND (p_end_date IS NULL OR gs.start_time::date <= p_end_date);
END;
$$ LANGUAGE plpgsql;
