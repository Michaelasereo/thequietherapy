-- =============================================
-- CRITICAL PAYMENT WEBHOOK SECURITY FIX
-- =============================================
-- This script adds idempotency and transaction safety to payment processing

-- Create payment events table for idempotency
CREATE TABLE IF NOT EXISTS payment_events (
    id TEXT PRIMARY KEY, -- Paystack event ID
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for status checks
CREATE.index IF NOT EXISTS idx_payment_events_status ON payment_events (status, created_at);

-- Atomic function to process payment webhooks with idempotency
CREATE OR REPLACE FUNCTION process_payment_webhook(
    p_event_id TEXT,
    p_event_data JSONB
) RETURNS VOID AS $$
DECLARE
    event_type TEXT;
    processed_status TEXT;
BEGIN
    -- Extract event type
    event_type := p_event_data->>'event';
    
    -- Check if already processed (race condition protection)
    SELECT status INTO processed_status
    FROM payment_events
    WHERE id = p_event_id
    FOR UPDATE;
    
    -- If already processed, return early
    IF processed_status IS NOT NULL THEN
        RAISE NOTICE 'Event % already processed with status: %', p_event_id, processed_status;
        RETURN;
    END IF;
    
    -- Store event record immediately for idempotency
    INSERT INTO payment_events (id, event_type, event_data, status)
    VALUES (p_event_id, event_type, p_event_data, 'processing');
    
    -- Process based on event type
    CASE event_type
        WHEN 'charge.success' THEN
            PERFORM process_successful_payment(p_event_data->'data');
        WHEN 'charge.failed' THEN
            PERFORM process_failed_payment(p_event_data->'data');
        WHEN 'transfer.success' THEN
            RAISE NOTICE 'Transfer successful: %', p_event_data->'data'->>'reference';
        ELSE
            RAISE NOTICE 'Unhandled webhook event: %', event_type;
    END CASE;
    
    -- Mark as completed
    UPDATE payment_events SET status = 'completed' WHERE id = p_event_id;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Mark as failed and re-raise
        UPDATE payment_events SET status = 'failed' WHERE id = p_event_id;
        RAISE;
END;
$$ LANGUAGE plpgsql;

-- Helper function to process successful payments
CREATE OR REPLACE FUNCTION process_successful_payment(payment_data JSONB)
RETURNS VOID AS $$
DECLARE
    payment_ref TEXT;
    pending_payment RECORD;
    package_def RECORD;
BEGIN
    payment_ref := payment_data->>'reference';
    
    -- Get pending payment record
    SELECT * INTO pending_payment
    FROM pending_payments
    WHERE payment_reference = payment_ref
    FOR UPDATE;
    
    -- If already processed or not found, return
    IF NOT FOUND OR pending_payment.status = 'success' THEN
        RAISE NOTICE 'Payment % already processed or not found', payment_ref;
        RETURN;
    END IF;
    
    -- Update pending payment status
    UPDATE pending_payments
    SET status = 'success', verified_at = NOW(), paystack_data = payment_data
    WHERE payment_reference = payment_ref;
    
    -- Get package definition
    SELECT * INTO package_def
    FROM package_definitions
    WHERE package_type = pending_payment.package_type;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Package definition not found: %', pending_payment.package_type;
    END IF;
    
    -- Add credits to user account
    INSERT INTO user_credits (
        user_id, package_type, credits_purchased, amount_paid_kobo,
        payment_reference, status, expires_at, created_at
    ) VALUES (
        pending_payment.user_id, pending_payment.package_type,
        package_def.sessions_included, pending_payment.amount_kobo,
        payment_ref, 'active',
        (NOW() + INTERVAL '1 year')::TIMESTAMPTZ, NOW()
    );
    
    -- Create payment record
    INSERT INTO payments (
        user_id, package_type, amount_kobo, payment_reference,
        paystack_reference, status, payment_method, gateway_response, created_at
    ) VALUES (
        pending_payment.user_id, pending_payment.package_type,
        pending_payment.amount_kobo, payment_ref,
        payment_data->>'reference', 'success', payment_data->>'payment_method',
        payment_data, NOW()
    );
    
END;
$$ LANGUAGE plpgsql;

-- Helper function to process failed payments
CREATE OR REPLACE FUNCTION process_failed_payment(payment_data JSONB)
RETURNS VOID AS $$
DECLARE
    payment_ref TEXT;
BEGIN
    payment_ref := payment_data->>'reference';
    
    -- Update pending payment status to failed
    UPDATE pending_payments
    SET status = 'failed', verified_at = NOW(), paystack_data = payment_data
    WHERE payment_reference = payment_ref;
    
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION process_payment_webhook TO authenticated;
GRANT EXECUTE ON FUNCTION process_successful_payment TO authenticated;
GRANT EXECUTE ON FUNCTION process_failed_payment TO authenticated;

-- Comment for documentation
COMMENT ON FUNCTION process_payment_webhook IS 'Atomic payment webhook processing with idempotency';
COMMENT ON TABLE payment_events IS 'Paystack web<｜tool▁call▁begin｜>
