-- Scalable Availability Management Schema
-- This script creates the new template-based availability system
-- Run this to implement the enterprise-grade availability architecture

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- NEW TABLES FOR SCALABLE AVAILABILITY MANAGEMENT
-- =============================================

-- Table for defining recurring availability patterns (templates)
CREATE TABLE IF NOT EXISTS availability_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Recurring Rule Core Data
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL, -- Start time for this day's availability block
    end_time TIME NOT NULL,   -- End time for this day's availability block
    
    -- Session Configuration (can be set per day)
    session_duration INTEGER NOT NULL DEFAULT 45, -- minutes
    session_type VARCHAR(20) DEFAULT 'individual' CHECK (session_type IN ('individual', 'group')),
    max_sessions INTEGER DEFAULT 1,
    
    -- Management
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- A therapist can only have one template per day of the week
    UNIQUE(therapist_id, day_of_week)
);

-- Table for overriding the template on specific dates
CREATE TABLE IF NOT EXISTS availability_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- The specific date being overridden
    override_date DATE NOT NULL,
    
    -- The override action: completely unavailable OR custom hours?
    is_available BOOLEAN DEFAULT FALSE, -- FALSE for a day off, TRUE for custom hours
    start_time TIME, -- NULL if is_available = FALSE
    end_time TIME,   -- NULL if is_available = FALSE
    
    -- Session configuration for overrides (optional)
    session_duration INTEGER DEFAULT 45, -- minutes
    session_type VARCHAR(20) DEFAULT 'individual' CHECK (session_type IN ('individual', 'group')),
    max_sessions INTEGER DEFAULT 1,
    
    -- Reason (optional, for admin insight)
    reason VARCHAR(100), -- e.g., 'Vacation', 'Sick Day', 'Training'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- A therapist can only have one override per date
    UNIQUE(therapist_id, override_date)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Availability templates indexes
CREATE INDEX IF NOT EXISTS idx_availability_templates_therapist_id ON availability_templates(therapist_id);
CREATE INDEX IF NOT EXISTS idx_availability_templates_day_of_week ON availability_templates(day_of_week);
CREATE INDEX IF NOT EXISTS idx_availability_templates_is_active ON availability_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_availability_templates_therapist_day ON availability_templates(therapist_id, day_of_week);

-- Availability overrides indexes
CREATE INDEX IF NOT EXISTS idx_availability_overrides_therapist_id ON availability_overrides(therapist_id);
CREATE INDEX IF NOT EXISTS idx_availability_overrides_date ON availability_overrides(override_date);
CREATE INDEX IF NOT EXISTS idx_availability_overrides_is_available ON availability_overrides(is_available);
CREATE INDEX IF NOT EXISTS idx_availability_overrides_therapist_date ON availability_overrides(therapist_id, override_date);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on new tables
ALTER TABLE availability_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_overrides ENABLE ROW LEVEL SECURITY;

-- Availability templates policies
CREATE POLICY "Therapists can view their own templates" ON availability_templates
    FOR SELECT USING (auth.uid() = therapist_id);

CREATE POLICY "Therapists can manage their own templates" ON availability_templates
    FOR ALL USING (auth.uid() = therapist_id);

CREATE POLICY "Admins can view all templates" ON availability_templates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Availability overrides policies
CREATE POLICY "Therapists can view their own overrides" ON availability_overrides
    FOR SELECT USING (auth.uid() = therapist_id);

CREATE POLICY "Therapists can manage their own overrides" ON availability_overrides
    FOR ALL USING (auth.uid() = therapist_id);

CREATE POLICY "Admins can view all overrides" ON availability_overrides
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

-- Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to new tables
CREATE TRIGGER update_availability_templates_updated_at 
    BEFORE UPDATE ON availability_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_overrides_updated_at 
    BEFORE UPDATE ON availability_overrides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Function to generate availability slots for a date range
CREATE OR REPLACE FUNCTION generate_availability_slots(
    p_therapist_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    date DATE,
    day_of_week INTEGER,
    start_time TIME,
    end_time TIME,
    session_duration INTEGER,
    session_type VARCHAR(20),
    max_sessions INTEGER,
    is_override BOOLEAN,
    reason VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date as date
    ),
    daily_data AS (
        SELECT 
            ds.date,
            EXTRACT(dow FROM ds.date)::integer as day_of_week
        FROM date_series ds
    ),
    template_data AS (
        SELECT 
            dd.date,
            dd.day_of_week,
            at.start_time,
            at.end_time,
            at.session_duration,
            at.session_type,
            at.max_sessions,
            false as is_override,
            NULL::varchar(100) as reason
        FROM daily_data dd
        LEFT JOIN availability_templates at ON dd.day_of_week = at.day_of_week 
            AND at.therapist_id = p_therapist_id 
            AND at.is_active = true
    ),
    override_data AS (
        SELECT 
            dd.date,
            dd.day_of_week,
            ao.start_time,
            ao.end_time,
            ao.session_duration,
            ao.session_type,
            ao.max_sessions,
            true as is_override,
            ao.reason,
            ao.is_available
        FROM daily_data dd
        LEFT JOIN availability_overrides ao ON dd.date = ao.override_date 
            AND ao.therapist_id = p_therapist_id
    )
    SELECT 
        COALESCE(od.date, td.date) as date,
        COALESCE(od.day_of_week, td.day_of_week) as day_of_week,
        COALESCE(od.start_time, td.start_time) as start_time,
        COALESCE(od.end_time, td.end_time) as end_time,
        COALESCE(od.session_duration, td.session_duration) as session_duration,
        COALESCE(od.session_type, td.session_type) as session_type,
        COALESCE(od.max_sessions, td.max_sessions) as max_sessions,
        COALESCE(od.is_override, false) as is_override,
        od.reason
    FROM template_data td
    FULL OUTER JOIN override_data od ON td.date = od.date
    WHERE 
        -- Only return slots where therapist is available
        (od.is_available IS NULL AND td.start_time IS NOT NULL) OR 
        (od.is_available = true AND od.start_time IS NOT NULL)
    ORDER BY date, start_time;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE availability_templates IS 'Recurring weekly availability patterns for therapists';
COMMENT ON TABLE availability_overrides IS 'Specific date overrides to availability templates';
COMMENT ON FUNCTION generate_availability_slots IS 'Generates available time slots for a therapist within a date range';

-- =============================================
-- SAMPLE DATA (for development/testing)
-- =============================================

-- Insert sample templates for existing therapists
INSERT INTO availability_templates (therapist_id, day_of_week, start_time, end_time, session_duration, session_type, max_sessions)
SELECT 
    u.id,
    ta.day_of_week,
    ta.start_time,
    ta.end_time,
    60 as session_duration,
    'individual' as session_type,
    8 as max_sessions
FROM users u
JOIN therapist_availability ta ON u.id = ta.therapist_id
WHERE u.user_type = 'therapist' 
    AND u.is_active = true
    AND ta.is_available = true
ON CONFLICT (therapist_id, day_of_week) DO NOTHING;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

SELECT 'Scalable availability schema created successfully!' as status,
       'New tables: availability_templates, availability_overrides' as tables_created,
       'Migration from old therapist_availability table completed' as migration_status;
