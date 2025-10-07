-- Create donations table for seed funding campaign
CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    donor_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    amount_kobo INTEGER NOT NULL,
    paystack_reference VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
    donation_type VARCHAR(50) DEFAULT 'seed_funding',
    anonymous BOOLEAN DEFAULT FALSE,
    payment_method VARCHAR(50),
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_donations_email ON donations(email);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at);
CREATE INDEX IF NOT EXISTS idx_donations_paystack_reference ON donations(paystack_reference);

-- Add comments
COMMENT ON TABLE donations IS 'Donations for seed funding campaign';
COMMENT ON COLUMN donations.amount IS 'Donation amount in Naira';
COMMENT ON COLUMN donations.amount_kobo IS 'Donation amount in kobo (for Paystack)';
COMMENT ON COLUMN donations.paystack_reference IS 'Paystack transaction reference';
COMMENT ON COLUMN donations.status IS 'Donation status: pending, success, failed, cancelled';
COMMENT ON COLUMN donations.donation_type IS 'Type of donation (seed_funding, etc.)';
COMMENT ON COLUMN donations.gateway_response IS 'Full response from payment gateway';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_donations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_donations_updated_at
    BEFORE UPDATE ON donations
    FOR EACH ROW
    EXECUTE FUNCTION update_donations_updated_at();

-- Insert sample data for testing (optional)
-- INSERT INTO donations (email, donor_name, amount, amount_kobo, paystack_reference, status, donation_type)
-- VALUES 
--     ('test@example.com', 'Test Donor', 5000.00, 500000, 'DONATION_TEST_001', 'success', 'seed_funding'),
--     ('donor@example.com', 'John Doe', 10000.00, 1000000, 'DONATION_TEST_002', 'success', 'seed_funding');
