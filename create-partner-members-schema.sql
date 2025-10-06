-- Partner Members and CSV Upload Schema for TRPI
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Partner Members Table (tracks organization members)
CREATE TABLE IF NOT EXISTS public.partner_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    department VARCHAR(100),
    position VARCHAR(100),
    credits_assigned INTEGER NOT NULL DEFAULT 0,
    credits_used INTEGER NOT NULL DEFAULT 0,
    package_type VARCHAR(50) DEFAULT 'Standard',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'removed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(partner_id, user_id)
);

-- 2. CSV Upload Tracking Table
CREATE TABLE IF NOT EXISTS public.csv_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    total_records INTEGER NOT NULL DEFAULT 0,
    successful_records INTEGER NOT NULL DEFAULT 0,
    failed_records INTEGER NOT NULL DEFAULT 0,
    errors JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 3. Partner Organization Details Table (extends users table)
CREATE TABLE IF NOT EXISTS public.partner_organizations (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    organization_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    size VARCHAR(50), -- 'small', 'medium', 'large', 'enterprise'
    contact_person VARCHAR(255),
    contact_phone VARCHAR(50),
    billing_address TEXT,
    total_credits_purchased INTEGER NOT NULL DEFAULT 0,
    credits_used INTEGER NOT NULL DEFAULT 0,
    subscription_type VARCHAR(50) DEFAULT 'pay_as_go', -- 'pay_as_go', 'monthly', 'annual'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_partner_members_partner_id ON public.partner_members(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_members_user_id ON public.partner_members(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_members_email ON public.partner_members(email);
CREATE INDEX IF NOT EXISTS idx_partner_members_status ON public.partner_members(status);
CREATE INDEX IF NOT EXISTS idx_csv_uploads_partner_id ON public.csv_uploads(partner_id);
CREATE INDEX IF NOT EXISTS idx_csv_uploads_status ON public.csv_uploads(status);
CREATE INDEX IF NOT EXISTS idx_csv_uploads_uploaded_at ON public.csv_uploads(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_partner_organizations_active ON public.partner_organizations(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE public.partner_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csv_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Partners can manage their members" ON public.partner_members;
DROP POLICY IF EXISTS "Members can view their own data" ON public.partner_members;
DROP POLICY IF EXISTS "Partners can view their uploads" ON public.csv_uploads;
DROP POLICY IF EXISTS "Partners can manage their organization" ON public.partner_organizations;
DROP POLICY IF EXISTS "Service role can manage all" ON public.partner_members;
DROP POLICY IF EXISTS "Service role can manage uploads" ON public.csv_uploads;
DROP POLICY IF EXISTS "Service role can manage organizations" ON public.partner_organizations;

-- Create RLS policies for partner_members
CREATE POLICY "Partners can manage their members" ON public.partner_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = partner_id 
            AND user_type = 'partner'
        )
    );

CREATE POLICY "Members can view their own data" ON public.partner_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = user_id
        )
    );

CREATE POLICY "Service role can manage all" ON public.partner_members
    FOR ALL USING (auth.role() = 'service_role');

-- Create policies for csv_uploads
CREATE POLICY "Partners can view their uploads" ON public.csv_uploads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = partner_id 
            AND user_type = 'partner'
        )
    );

CREATE POLICY "Service role can manage uploads" ON public.csv_uploads
    FOR ALL USING (auth.role() = 'service_role');

-- Create policies for partner_organizations
CREATE POLICY "Partners can manage their organization" ON public.partner_organizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = user_id 
            AND user_type = 'partner'
        )
    );

CREATE POLICY "Service role can manage organizations" ON public.partner_organizations
    FOR ALL USING (auth.role() = 'service_role');

-- Create function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_partner_members_updated_at ON public.partner_members;
CREATE TRIGGER update_partner_members_updated_at 
    BEFORE UPDATE ON public.partner_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_partner_organizations_updated_at ON public.partner_organizations;
CREATE TRIGGER update_partner_organizations_updated_at 
    BEFORE UPDATE ON public.partner_organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get partner member statistics
CREATE OR REPLACE FUNCTION get_partner_member_stats(p_partner_id UUID)
RETURNS TABLE (
    total_members INTEGER,
    active_members INTEGER,
    total_credits_assigned INTEGER,
    total_credits_used INTEGER,
    recent_uploads INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_members,
        COUNT(CASE WHEN status = 'active' THEN 1 END)::INTEGER as active_members,
        COALESCE(SUM(credits_assigned), 0)::INTEGER as total_credits_assigned,
        COALESCE(SUM(credits_used), 0)::INTEGER as total_credits_used,
        (
            SELECT COUNT(*)::INTEGER 
            FROM public.csv_uploads 
            WHERE partner_id = p_partner_id 
            AND uploaded_at > NOW() - INTERVAL '30 days'
        ) as recent_uploads
    FROM public.partner_members
    WHERE partner_id = p_partner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate and create partner member
CREATE OR REPLACE FUNCTION create_partner_member(
    p_partner_id UUID,
    p_name VARCHAR(255),
    p_email VARCHAR(255),
    p_phone VARCHAR(50) DEFAULT NULL,
    p_department VARCHAR(100) DEFAULT NULL,
    p_position VARCHAR(100) DEFAULT NULL,
    p_credits_assigned INTEGER DEFAULT 5,
    p_package_type VARCHAR(50) DEFAULT 'Standard'
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_member_id UUID;
BEGIN
    -- Check if user already exists
    SELECT id INTO v_user_id 
    FROM public.users 
    WHERE email = LOWER(p_email);
    
    -- If user doesn't exist, create new user
    IF v_user_id IS NULL THEN
        INSERT INTO public.users (
            id, email, full_name, user_type, partner_id, 
            credits, is_verified, is_active
        ) VALUES (
            uuid_generate_v4(), LOWER(p_email), p_name, 'individual', p_partner_id,
            p_credits_assigned, false, true
        ) RETURNING id INTO v_user_id;
    ELSE
        -- Update existing user to be part of this partner
        UPDATE public.users 
        SET partner_id = p_partner_id, credits = credits + p_credits_assigned
        WHERE id = v_user_id;
    END IF;
    
    -- Create partner member record
    INSERT INTO public.partner_members (
        id, partner_id, user_id, name, email, phone, 
        department, position, credits_assigned, package_type
    ) VALUES (
        uuid_generate_v4(), p_partner_id, v_user_id, p_name, LOWER(p_email), 
        p_phone, p_department, p_position, p_credits_assigned, p_package_type
    ) RETURNING id INTO v_member_id;
    
    RETURN v_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample data for testing (optional)
-- Uncomment the following lines if you want sample data

/*
-- Create a sample partner organization
INSERT INTO public.users (id, email, full_name, user_type, credits, is_verified, is_active) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'partner@testcompany.com',
    'Test Company Partner',
    'partner',
    1000,
    true,
    true
) ON CONFLICT (email) DO NOTHING;

INSERT INTO public.partner_organizations (
    user_id, organization_name, industry, size, contact_person, 
    total_credits_purchased, subscription_type
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Test Company Inc.',
    'Technology',
    'medium',
    'John Smith',
    1000,
    'annual'
) ON CONFLICT (user_id) DO NOTHING;
*/

-- Verify the tables were created
SELECT 
    'partner_members' as table_name, 
    COUNT(*) as row_count 
FROM public.partner_members
UNION ALL
SELECT 
    'csv_uploads' as table_name, 
    COUNT(*) as row_count 
FROM public.csv_uploads
UNION ALL
SELECT 
    'partner_organizations' as table_name, 
    COUNT(*) as row_count 
FROM public.partner_organizations;

-- Show the schema structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('partner_members', 'csv_uploads', 'partner_organizations')
ORDER BY table_name, ordinal_position;
