-- Create therapists table
CREATE TABLE IF NOT EXISTS therapists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  mdcn_code VARCHAR(100),
  specialization TEXT,
  languages TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT FALSE,
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  total_clients INTEGER DEFAULT 0,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_therapists_email ON therapists(email);
CREATE INDEX IF NOT EXISTS idx_therapists_verified ON therapists(is_verified);
CREATE INDEX IF NOT EXISTS idx_therapists_active ON therapists(is_active);
CREATE INDEX IF NOT EXISTS idx_therapists_mdcn ON therapists(mdcn_code);
