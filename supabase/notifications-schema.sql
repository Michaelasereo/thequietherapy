-- Notifications Schema for Real-time Notifications
-- Run this in your Supabase SQL Editor

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('individual', 'therapist', 'partner', 'admin')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  category VARCHAR(100) NOT NULL DEFAULT 'general' CHECK (category IN (
    'session_booking', 
    'session_reminder', 
    'session_cancelled', 
    'payment_received', 
    'payment_failed', 
    'therapist_approved', 
    'therapist_rejected', 
    'new_client', 
    'credits_low', 
    'credits_added',
    'general'
  )),
  is_read BOOLEAN DEFAULT false,
  action_url TEXT, -- URL to navigate to when notification is clicked
  metadata JSONB, -- Additional data like session_id, payment_amount, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications(user_type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid() OR user_id IN (
    SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid() OR user_id IN (
    SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

CREATE POLICY "Service role can manage all notifications" ON notifications
  FOR ALL USING (auth.role() = 'service_role');

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_user_type VARCHAR(50),
  p_title VARCHAR(255),
  p_message TEXT,
  p_type VARCHAR(50) DEFAULT 'info',
  p_category VARCHAR(100) DEFAULT 'general',
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id, 
    user_type, 
    title, 
    message, 
    type, 
    category, 
    action_url, 
    metadata
  ) VALUES (
    p_user_id, 
    p_user_type, 
    p_title, 
    p_message, 
    p_type, 
    p_category, 
    p_action_url, 
    p_metadata
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications 
  SET is_read = true, read_at = NOW()
  WHERE id = p_notification_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications 
  SET is_read = true, read_at = NOW()
  WHERE user_id = p_user_id AND is_read = false;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count
  FROM notifications
  WHERE user_id = p_user_id AND is_read = false;
  
  RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some sample notifications for testing
INSERT INTO notifications (user_id, user_type, title, message, type, category, action_url, metadata)
SELECT 
  u.id,
  u.user_type,
  'Welcome to Trpi!',
  'Thank you for joining our platform. We''re excited to help you on your therapy journey.',
  'success',
  'general',
  '/dashboard',
  '{"welcome": true}'
FROM users u
WHERE u.email = 'asereopeyemimichael@gmail.com'
ON CONFLICT DO NOTHING;

-- Verify the table was created
SELECT 'notifications' as table_name, COUNT(*) as row_count FROM notifications;
