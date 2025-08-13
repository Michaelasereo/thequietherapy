-- Enhanced Database Schema for Cross-Dashboard State Management
-- This script adds tables and functions needed for real-time updates and cross-dashboard communication

-- 1. Global Users Table (for real-time user status tracking)
CREATE TABLE IF NOT EXISTS global_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('user', 'therapist', 'partner', 'admin')),
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    online_status TEXT DEFAULT 'offline' CHECK (online_status IN ('online', 'offline', 'away', 'busy')),
    current_session_id UUID,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Global Sessions Table (for real-time session tracking)
CREATE TABLE IF NOT EXISTS global_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    therapist_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    partner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled', 'no-show')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER NOT NULL, -- in minutes
    cost DECIMAL(10,2) NOT NULL,
    room_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Global Notifications Table (for cross-dashboard notifications)
CREATE TABLE IF NOT EXISTS global_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('system', 'session', 'payment', 'security', 'performance')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    target_user_types TEXT[] NOT NULL,
    target_user_ids UUID[],
    read_by UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    requires_action BOOLEAN DEFAULT false,
    action_taken TEXT
);

-- 4. Cross-Dashboard Events Table (for event broadcasting)
CREATE TABLE IF NOT EXISTS cross_dashboard_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('user_status_change', 'session_status_change', 'notification', 'system_alert', 'data_sync')),
    source_dashboard TEXT NOT NULL CHECK (source_dashboard IN ('user', 'therapist', 'partner', 'admin')),
    target_dashboards TEXT[] NOT NULL,
    data JSONB NOT NULL,
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_by TEXT[] DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- 5. System Metrics Table (for real-time system monitoring)
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_active_users INTEGER NOT NULL DEFAULT 0,
    total_active_sessions INTEGER NOT NULL DEFAULT 0,
    system_load NUMERIC(3,2) NOT NULL DEFAULT 0.0,
    response_time INTEGER NOT NULL DEFAULT 0, -- in milliseconds
    error_rate NUMERIC(5,4) NOT NULL DEFAULT 0.0,
    uptime NUMERIC(5,2) NOT NULL DEFAULT 100.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Dashboard Connections Table (for tracking active dashboard connections)
CREATE TABLE IF NOT EXISTS dashboard_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_type TEXT NOT NULL CHECK (dashboard_type IN ('user', 'therapist', 'partner', 'admin')),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    connection_id TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Data Sync Log Table (for tracking data synchronization)
CREATE TABLE IF NOT EXISTS data_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_type TEXT NOT NULL CHECK (dashboard_type IN ('user', 'therapist', 'partner', 'admin')),
    sync_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    records_processed INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_global_users_user_type ON global_users(user_type);
CREATE INDEX IF NOT EXISTS idx_global_users_online_status ON global_users(online_status);
CREATE INDEX IF NOT EXISTS idx_global_users_last_activity ON global_users(last_activity);
CREATE INDEX IF NOT EXISTS idx_global_sessions_status ON global_sessions(status);
CREATE INDEX IF NOT EXISTS idx_global_sessions_start_time ON global_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_global_notifications_target_types ON global_notifications USING GIN(target_user_types);
CREATE INDEX IF NOT EXISTS idx_global_notifications_created_at ON global_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_cross_dashboard_events_type ON cross_dashboard_events(type);
CREATE INDEX IF NOT EXISTS idx_cross_dashboard_events_timestamp ON cross_dashboard_events(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_cross_dashboard_events_target_dashboards ON cross_dashboard_events USING GIN(target_dashboards);
CREATE INDEX IF NOT EXISTS idx_dashboard_connections_dashboard_type ON dashboard_connections(dashboard_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_connections_is_active ON dashboard_connections(is_active);

-- Functions for real-time updates

-- Function to update user online status
CREATE OR REPLACE FUNCTION update_user_online_status(
    p_user_id UUID,
    p_status TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE global_users 
    SET online_status = p_status, 
        last_activity = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Insert cross-dashboard event
    INSERT INTO cross_dashboard_events (
        type, 
        source_dashboard, 
        target_dashboards, 
        data
    ) VALUES (
        'user_status_change',
        'system',
        ARRAY['user', 'therapist', 'partner', 'admin'],
        jsonb_build_object('userId', p_user_id, 'status', p_status)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to update session status
CREATE OR REPLACE FUNCTION update_session_status(
    p_session_id UUID,
    p_status TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE global_sessions 
    SET status = p_status, 
        updated_at = NOW()
    WHERE id = p_session_id;
    
    -- Insert cross-dashboard event
    INSERT INTO cross_dashboard_events (
        type, 
        source_dashboard, 
        target_dashboards, 
        data
    ) VALUES (
        'session_status_change',
        'system',
        ARRAY['user', 'therapist', 'partner', 'admin'],
        jsonb_build_object('sessionId', p_session_id, 'status', p_status)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to add global notification
CREATE OR REPLACE FUNCTION add_global_notification(
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_target_user_types TEXT[],
    p_severity TEXT DEFAULT 'medium',
    p_target_user_ids UUID[] DEFAULT NULL,
    p_requires_action BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO global_notifications (
        type,
        title,
        message,
        severity,
        target_user_types,
        target_user_ids,
        requires_action
    ) VALUES (
        p_type,
        p_title,
        p_message,
        p_severity,
        p_target_user_types,
        p_target_user_ids,
        p_requires_action
    ) RETURNING id INTO v_notification_id;
    
    -- Insert cross-dashboard event
    INSERT INTO cross_dashboard_events (
        type, 
        source_dashboard, 
        target_dashboards, 
        data
    ) VALUES (
        'notification',
        'system',
        p_target_user_types,
        jsonb_build_object(
            'notificationId', v_notification_id,
            'type', p_type,
            'title', p_title,
            'message', p_message,
            'severity', p_severity
        )
    );
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(
    p_notification_id UUID,
    p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE global_notifications 
    SET read_by = array_append(read_by, p_user_id)
    WHERE id = p_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get unprocessed events for a dashboard
CREATE OR REPLACE FUNCTION get_unprocessed_events(
    p_dashboard_type TEXT
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    source_dashboard TEXT,
    data JSONB,
    event_timestamp TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cde.id,
        cde.type,
        cde.source_dashboard,
        cde.data,
        cde.event_timestamp
    FROM cross_dashboard_events cde
    WHERE p_dashboard_type = ANY(cde.target_dashboards)
    AND NOT (p_dashboard_type = ANY(cde.processed_by))
    AND (cde.expires_at IS NULL OR cde.expires_at > NOW())
    ORDER BY cde.event_timestamp ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to mark event as processed
CREATE OR REPLACE FUNCTION mark_event_processed(
    p_event_id UUID,
    p_dashboard_type TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE cross_dashboard_events 
    SET processed_by = array_append(processed_by, p_dashboard_type)
    WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update system metrics
CREATE OR REPLACE FUNCTION update_system_metrics(
    p_total_active_users INTEGER,
    p_total_active_sessions INTEGER,
    p_system_load NUMERIC,
    p_response_time INTEGER,
    p_error_rate NUMERIC,
    p_uptime NUMERIC
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO system_metrics (
        total_active_users,
        total_active_sessions,
        system_load,
        response_time,
        error_rate,
        uptime
    ) VALUES (
        p_total_active_users,
        p_total_active_sessions,
        p_system_load,
        p_response_time,
        p_error_rate,
        p_uptime
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get latest system metrics
CREATE OR REPLACE FUNCTION get_latest_system_metrics()
RETURNS TABLE (
    total_active_users INTEGER,
    total_active_sessions INTEGER,
    system_load NUMERIC,
    response_time INTEGER,
    error_rate NUMERIC,
    uptime NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sm.total_active_users,
        sm.total_active_sessions,
        sm.system_load,
        sm.response_time,
        sm.error_rate,
        sm.uptime,
        sm.created_at
    FROM system_metrics sm
    ORDER BY sm.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to register dashboard connection
CREATE OR REPLACE FUNCTION register_dashboard_connection(
    p_dashboard_type TEXT,
    p_user_id UUID,
    p_connection_id TEXT
)
RETURNS UUID AS $$
DECLARE
    v_connection_id UUID;
BEGIN
    -- Deactivate existing connections for this user and dashboard type
    UPDATE dashboard_connections 
    SET is_active = false 
    WHERE dashboard_type = p_dashboard_type AND user_id = p_user_id;
    
    -- Insert new connection
    INSERT INTO dashboard_connections (
        dashboard_type,
        user_id,
        connection_id,
        is_active
    ) VALUES (
        p_dashboard_type,
        p_user_id,
        p_connection_id,
        true
    ) RETURNING id INTO v_connection_id;
    
    RETURN v_connection_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update dashboard connection heartbeat
CREATE OR REPLACE FUNCTION update_dashboard_heartbeat(
    p_connection_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE dashboard_connections 
    SET last_heartbeat = NOW()
    WHERE id = p_connection_id;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired connections
CREATE OR REPLACE FUNCTION cleanup_expired_connections()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE dashboard_connections 
    SET is_active = false 
    WHERE last_heartbeat < (NOW() - INTERVAL '5 minutes');
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired events
CREATE OR REPLACE FUNCTION cleanup_expired_events()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM cross_dashboard_events 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) Policies

-- Global Users RLS
ALTER TABLE global_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own global user data" ON global_users
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own global user data" ON global_users
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all global user data" ON global_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'user_type' = 'admin'
        )
    );

-- Global Sessions RLS
ALTER TABLE global_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON global_sessions
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = therapist_id);

CREATE POLICY "Therapists can view their client sessions" ON global_sessions
    FOR SELECT USING (auth.uid() = therapist_id);

CREATE POLICY "Partners can view their member sessions" ON global_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'partner'
        )
    );

CREATE POLICY "Admins can view all sessions" ON global_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'user_type' = 'admin'
        )
    );

-- Global Notifications RLS
ALTER TABLE global_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notifications for their type" ON global_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'user_type' = ANY(target_user_types)
        )
    );

CREATE POLICY "Admins can manage all notifications" ON global_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'user_type' = 'admin'
        )
    );

-- Cross Dashboard Events RLS
ALTER TABLE cross_dashboard_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events for their dashboard type" ON cross_dashboard_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'user_type' = ANY(target_dashboards)
        )
    );

-- System Metrics RLS
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system metrics" ON system_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'user_type' = 'admin'
        )
    );

-- Dashboard Connections RLS
ALTER TABLE dashboard_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own connections" ON dashboard_connections
    FOR ALL USING (auth.uid() = user_id);

-- Data Sync Log RLS
ALTER TABLE data_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sync logs" ON data_sync_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'user_type' = 'admin'
        )
    );

-- Triggers for automatic updates

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_global_users_updated_at
    BEFORE UPDATE ON global_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_global_sessions_updated_at
    BEFORE UPDATE ON global_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically create global user record when user is created
CREATE OR REPLACE FUNCTION create_global_user_record()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO global_users (
        user_id,
        full_name,
        email,
        user_type
    ) VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'user_type', 'user')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_global_user_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_global_user_record();

-- Scheduled cleanup jobs (using pg_cron if available)
-- Note: These need to be set up manually in Supabase dashboard

-- Cleanup expired connections every 5 minutes
-- SELECT cron.schedule('cleanup-connections', '*/5 * * * *', 'SELECT cleanup_expired_connections();');

-- Cleanup expired events every hour
-- SELECT cron.schedule('cleanup-events', '0 * * * *', 'SELECT cleanup_expired_events();');

-- Update system metrics every 5 minutes
-- SELECT cron.schedule('update-metrics', '*/5 * * * *', 'SELECT update_system_metrics(0, 0, 0.0, 0, 0.0, 100.0);');

-- Comments for manual setup
COMMENT ON TABLE global_users IS 'Stores real-time user status and activity information';
COMMENT ON TABLE global_sessions IS 'Stores real-time session information across all dashboards';
COMMENT ON TABLE global_notifications IS 'Stores cross-dashboard notifications and alerts';
COMMENT ON TABLE cross_dashboard_events IS 'Stores events for cross-dashboard communication';
COMMENT ON TABLE system_metrics IS 'Stores real-time system performance metrics';
COMMENT ON TABLE dashboard_connections IS 'Tracks active dashboard connections for real-time updates';
COMMENT ON TABLE data_sync_log IS 'Logs data synchronization activities';

COMMENT ON FUNCTION update_user_online_status IS 'Updates user online status and broadcasts event to all dashboards';
COMMENT ON FUNCTION update_session_status IS 'Updates session status and broadcasts event to all dashboards';
COMMENT ON FUNCTION add_global_notification IS 'Adds global notification and broadcasts to target dashboards';
COMMENT ON FUNCTION get_unprocessed_events IS 'Gets unprocessed events for a specific dashboard type';
COMMENT ON FUNCTION register_dashboard_connection IS 'Registers a new dashboard connection for real-time updates';
