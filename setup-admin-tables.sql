-- Setup Admin Tables for TRPI App
-- This script creates all the database tables needed for admin functionality

-- 1. Therapist Enrollments Table
CREATE TABLE IF NOT EXISTS therapist_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    mdcn_code VARCHAR(50),
    specialization TEXT[],
    languages TEXT[],
    experience_years INTEGER,
    education TEXT,
    license_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. FAQ Management Table
CREATE TABLE IF NOT EXISTS faqs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'draft',
    published_at TIMESTAMP WITH TIME ZONE,
    featured_image_url TEXT,
    tags TEXT[],
    meta_description TEXT,
    slug VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. System Metrics Table - Check existing structure and add missing columns
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Credit Transactions Table (if not exists)
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    credits_before INTEGER,
    credits_after INTEGER,
    description TEXT,
    reference_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Admin Auth Table (if not exists)
CREATE TABLE IF NOT EXISTS admin_auth (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    is_admin BOOLEAN DEFAULT FALSE,
    permissions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Admin Sessions Table (if not exists)
CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES users(id),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Add missing columns to existing tables if needed

-- Add is_active column to users table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active') THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Add is_verified column to users table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_verified') THEN
        ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add user_type column to users table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'user_type') THEN
        ALTER TABLE users ADD COLUMN user_type VARCHAR(50) DEFAULT 'individual';
    END IF;
END $$;

-- Add amount_paid column to sessions table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'amount_paid') THEN
        ALTER TABLE sessions ADD COLUMN amount_paid DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Add session_type column to sessions table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'session_type') THEN
        ALTER TABLE sessions ADD COLUMN session_type VARCHAR(100) DEFAULT 'video';
    END IF;
END $$;

-- Add session_summary column to sessions table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'session_summary') THEN
        ALTER TABLE sessions ADD COLUMN session_summary TEXT;
    END IF;
END $$;

-- Add reschedule_reason column to sessions table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'reschedule_reason') THEN
        ALTER TABLE sessions ADD COLUMN reschedule_reason TEXT;
    END IF;
END $$;

-- Add cancellation_reason column to sessions table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'cancellation_reason') THEN
        ALTER TABLE sessions ADD COLUMN cancellation_reason TEXT;
    END IF;
END $$;

-- Add client_name and therapist_name columns to sessions table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'client_name') THEN
        ALTER TABLE sessions ADD COLUMN client_name VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'therapist_name') THEN
        ALTER TABLE sessions ADD COLUMN therapist_name VARCHAR(255);
    END IF;
END $$;

-- Add missing columns to faqs table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'faqs' AND column_name = 'sort_order') THEN
        ALTER TABLE faqs ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'faqs' AND column_name = 'is_active') THEN
        ALTER TABLE faqs ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'faqs' AND column_name = 'category') THEN
        ALTER TABLE faqs ADD COLUMN category VARCHAR(100);
    END IF;
END $$;

-- Add missing columns to blog_posts table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'excerpt') THEN
        ALTER TABLE blog_posts ADD COLUMN excerpt TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'status') THEN
        ALTER TABLE blog_posts ADD COLUMN status VARCHAR(50) DEFAULT 'draft';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'published_at') THEN
        ALTER TABLE blog_posts ADD COLUMN published_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'featured_image_url') THEN
        ALTER TABLE blog_posts ADD COLUMN featured_image_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'tags') THEN
        ALTER TABLE blog_posts ADD COLUMN tags TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'meta_description') THEN
        ALTER TABLE blog_posts ADD COLUMN meta_description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'slug') THEN
        ALTER TABLE blog_posts ADD COLUMN slug VARCHAR(255) UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'author_id') THEN
        ALTER TABLE blog_posts ADD COLUMN author_id UUID REFERENCES users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'category') THEN
        ALTER TABLE blog_posts ADD COLUMN category VARCHAR(100);
    END IF;
END $$;

-- Add missing columns to system_metrics table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_metrics' AND column_name = 'metric_name') THEN
        ALTER TABLE system_metrics ADD COLUMN metric_name VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_metrics' AND column_name = 'metric_value') THEN
        ALTER TABLE system_metrics ADD COLUMN metric_value JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_metrics' AND column_name = 'recorded_at') THEN
        ALTER TABLE system_metrics ADD COLUMN recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Handle existing blog_posts table structure - make required columns nullable if they exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'author') THEN
        -- If author column exists, make it nullable to avoid constraint issues
        ALTER TABLE blog_posts ALTER COLUMN author DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'category') THEN
        -- If category column exists, make it nullable to avoid constraint issues
        ALTER TABLE blog_posts ALTER COLUMN category DROP NOT NULL;
    END IF;
END $$;

-- Insert sample data for testing

-- Sample FAQs
INSERT INTO faqs (question, answer, category, sort_order) VALUES
('How do I book a session?', 'You can book a session by logging into your account and clicking on the "Book Session" button in your dashboard.', 'Booking', 1),
('What payment methods do you accept?', 'We accept all major credit cards and bank transfers through our secure payment system.', 'Payment', 2),
('How long are therapy sessions?', 'Standard therapy sessions are 50 minutes long, but we also offer 30-minute and 90-minute sessions.', 'Sessions', 3)
ON CONFLICT DO NOTHING;

-- Sample blog posts - handle all possible table structures
DO $$
DECLARE
    blog_posts_has_author BOOLEAN;
    blog_posts_has_author_id BOOLEAN;
    blog_posts_has_category BOOLEAN;
BEGIN
    -- Check table structure
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'author'
    ) INTO blog_posts_has_author;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'author_id'
    ) INTO blog_posts_has_author_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'category'
    ) INTO blog_posts_has_category;
    
    -- Insert based on table structure
    IF blog_posts_has_author AND blog_posts_has_category AND NOT blog_posts_has_author_id THEN
        -- Old structure with 'author' and 'category' columns
        INSERT INTO blog_posts (title, content, excerpt, status, slug, author, category) VALUES
        ('Welcome to The Quiet Therapy', 'Welcome to our platform where mental health meets technology...', 'An introduction to our therapy platform', 'published', 'welcome-to-the-quiet-therapy', 'Admin', 'General'),
        ('Understanding Anxiety', 'Anxiety is a common mental health condition that affects millions of people...', 'Learn about anxiety and how to manage it', 'published', 'understanding-anxiety', 'Admin', 'Mental Health')
        ON CONFLICT DO NOTHING;
    ELSIF blog_posts_has_author_id AND blog_posts_has_category THEN
        -- New structure with 'author_id' and 'category' columns
        INSERT INTO blog_posts (title, content, excerpt, status, slug, category) VALUES
        ('Welcome to The Quiet Therapy', 'Welcome to our platform where mental health meets technology...', 'An introduction to our therapy platform', 'published', 'welcome-to-the-quiet-therapy', 'General'),
        ('Understanding Anxiety', 'Anxiety is a common mental health condition that affects millions of people...', 'Learn about anxiety and how to manage it', 'published', 'understanding-anxiety', 'Mental Health')
        ON CONFLICT DO NOTHING;
    ELSIF blog_posts_has_author AND NOT blog_posts_has_category AND NOT blog_posts_has_author_id THEN
        -- Structure with 'author' but no 'category'
        INSERT INTO blog_posts (title, content, excerpt, status, slug, author) VALUES
        ('Welcome to The Quiet Therapy', 'Welcome to our platform where mental health meets technology...', 'An introduction to our therapy platform', 'published', 'welcome-to-the-quiet-therapy', 'Admin'),
        ('Understanding Anxiety', 'Anxiety is a common mental health condition that affects millions of people...', 'Learn about anxiety and how to manage it', 'published', 'understanding-anxiety', 'Admin')
        ON CONFLICT DO NOTHING;
    ELSIF blog_posts_has_author_id AND NOT blog_posts_has_category THEN
        -- Structure with 'author_id' but no 'category'
        INSERT INTO blog_posts (title, content, excerpt, status, slug) VALUES
        ('Welcome to The Quiet Therapy', 'Welcome to our platform where mental health meets technology...', 'An introduction to our therapy platform', 'published', 'welcome-to-the-quiet-therapy'),
        ('Understanding Anxiety', 'Anxiety is a common mental health condition that affects millions of people...', 'Learn about anxiety and how to manage it', 'published', 'understanding-anxiety')
        ON CONFLICT DO NOTHING;
    ELSE
        -- No author or category columns, insert without them
        INSERT INTO blog_posts (title, content, excerpt, status, slug) VALUES
        ('Welcome to The Quiet Therapy', 'Welcome to our platform where mental health meets technology...', 'An introduction to our therapy platform', 'published', 'welcome-to-the-quiet-therapy'),
        ('Understanding Anxiety', 'Anxiety is a common mental health condition that affects millions of people...', 'Learn about anxiety and how to manage it', 'published', 'understanding-anxiety')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Sample system metrics - handle existing table structure
DO $$
DECLARE
    system_metrics_has_metric_name BOOLEAN;
    system_metrics_has_metric_value BOOLEAN;
    system_metrics_has_recorded_at BOOLEAN;
BEGIN
    -- Check table structure
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'system_metrics' AND column_name = 'metric_name'
    ) INTO system_metrics_has_metric_name;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'system_metrics' AND column_name = 'metric_value'
    ) INTO system_metrics_has_metric_value;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'system_metrics' AND column_name = 'recorded_at'
    ) INTO system_metrics_has_recorded_at;
    
    -- Insert based on table structure
    IF system_metrics_has_metric_name AND system_metrics_has_metric_value THEN
        -- Standard structure
        INSERT INTO system_metrics (metric_name, metric_value) VALUES
        ('platform_uptime', '{"value": 99.9, "unit": "percent"}'),
        ('average_response_time', '{"value": 245, "unit": "ms"}'),
        ('error_rate', '{"value": 0.1, "unit": "percent"}')
        ON CONFLICT DO NOTHING;
    ELSE
        -- Different structure, skip insert for now
        RAISE NOTICE 'System metrics table has different structure, skipping sample data insert';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_therapist_enrollments_status ON therapist_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_therapist_enrollments_created_at ON therapist_enrollments(created_at);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_active ON faqs(is_active);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);

-- Enable Row Level Security (RLS) for new tables
ALTER TABLE therapist_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic policies - you may want to customize these)
CREATE POLICY "Enable read access for all users" ON faqs FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Enable admin access for therapist enrollments" ON therapist_enrollments FOR ALL USING (true);
CREATE POLICY "Enable admin access for system metrics" ON system_metrics FOR ALL USING (true);
CREATE POLICY "Enable admin access for credit transactions" ON credit_transactions FOR ALL USING (true);
CREATE POLICY "Enable admin access for admin auth" ON admin_auth FOR ALL USING (true);
CREATE POLICY "Enable admin access for admin sessions" ON admin_sessions FOR ALL USING (true);

COMMIT;
