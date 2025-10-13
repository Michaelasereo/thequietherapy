-- Setup Package Definitions Table and Data
-- Run this SQL in your Supabase SQL editor

-- Create package_definitions table if it doesn't exist
CREATE TABLE IF NOT EXISTS package_definitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    package_type TEXT NOT NULL UNIQUE CHECK (package_type IN ('signup_free', 'single', 'bronze', 'silver', 'gold')),
    name TEXT NOT NULL,
    description TEXT,
    sessions_included INTEGER NOT NULL,
    price_kobo INTEGER NOT NULL, -- Price in kobo (₦5000 = 500000)
    session_duration_minutes INTEGER NOT NULL,
    savings_kobo INTEGER DEFAULT 0, -- How much user saves vs single sessions
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert package definitions if they don't exist
INSERT INTO package_definitions (package_type, name, description, sessions_included, price_kobo, session_duration_minutes, savings_kobo, sort_order) 
VALUES
('signup_free', 'Welcome Session', 'Your first session is completely free', 1, 0, 25, 0, 1),
('single', 'Pay-As-You-Go', 'Single therapy session', 1, 500000, 35, 0, 2),
('bronze', 'Bronze Pack', 'Perfect for getting started', 3, 1350000, 35, 150000, 3),
('silver', 'Silver Pack', 'Great value for regular therapy', 5, 2000000, 35, 500000, 4),
('gold', 'Gold Pack', 'Best value for committed healing', 8, 2800000, 35, 1200000, 5)
ON CONFLICT (package_type) DO NOTHING;

-- Create pending_payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS pending_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    package_type TEXT NOT NULL,
    amount_kobo INTEGER NOT NULL CHECK (amount_kobo > 0),
    payment_reference TEXT NOT NULL UNIQUE,
    paystack_reference TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
    verified_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pending_payments_user ON pending_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_payments_reference ON pending_payments(payment_reference);
CREATE INDEX IF NOT EXISTS idx_pending_payments_status ON pending_payments(status);

-- Grant necessary permissions (adjust as needed for your setup)
-- ALTER TABLE package_definitions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pending_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (if using RLS)
-- CREATE POLICY "Users can read package definitions" ON package_definitions FOR SELECT USING (true);
-- CREATE POLICY "Users can manage their own pending payments" ON pending_payments FOR ALL USING (auth.uid() = user_id);
