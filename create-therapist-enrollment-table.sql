-- Create therapist enrollment table
CREATE TABLE IF NOT EXISTS therapist_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  mdcn_code TEXT,
  specialization TEXT[],
  languages TEXT[],
  bio TEXT,
  hourly_rate DECIMAL(10,2),
  id_document_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_therapist_enrollments_email ON therapist_enrollments(email);
CREATE INDEX IF NOT EXISTS idx_therapist_enrollments_status ON therapist_enrollments(status);

-- Create therapist documents table for file uploads
CREATE TABLE IF NOT EXISTS therapist_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  therapist_id UUID REFERENCES therapist_enrollments(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for documents
CREATE INDEX IF NOT EXISTS idx_therapist_documents_therapist_id ON therapist_documents(therapist_id);

-- Add RLS policies
ALTER TABLE therapist_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_documents ENABLE ROW LEVEL SECURITY;

-- Policy for therapist enrollments (only admins can view all, users can only see their own)
CREATE POLICY "Admins can view all therapist enrollments" ON therapist_enrollments
  FOR SELECT USING (auth.role() = 'admin');

CREATE POLICY "Users can insert their own enrollment" ON therapist_enrollments
  FOR INSERT WITH CHECK (auth.email() = email);

-- Policy for therapist documents
CREATE POLICY "Admins can view all therapist documents" ON therapist_documents
  FOR SELECT USING (auth.role() = 'admin');

CREATE POLICY "Users can insert their own documents" ON therapist_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM therapist_enrollments 
      WHERE id = therapist_id AND email = auth.email()
    )
  );
