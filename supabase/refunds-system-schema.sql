-- =====================================================
-- REFUND SYSTEM SCHEMA
-- Comprehensive refund tracking and processing
-- =====================================================

-- =====================================================
-- 1. REFUNDS TABLE
-- Tracks all refund requests and their status
-- =====================================================
CREATE TABLE IF NOT EXISTS refunds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    payment_id UUID, -- Reference to original payment
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    payment_reference TEXT NOT NULL,
    
    -- Refund details
    refund_type TEXT NOT NULL CHECK (refund_type IN (
        'full_refund',           -- Full payment refund
        'partial_refund',        -- Partial refund
        'credit_reversal',       -- Credit back to account
        'cancellation_refund'    -- Session cancellation refund
    )),
    
    -- Amounts
    original_amount_kobo INTEGER NOT NULL,
    refund_amount_kobo INTEGER NOT NULL,
    refund_fee_kobo INTEGER DEFAULT 0, -- Transaction fees
    net_refund_kobo INTEGER NOT NULL, -- Amount actually refunded
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',      -- Awaiting review
        'approved',     -- Approved, processing
        'processing',   -- Being processed
        'completed',    -- Successfully refunded
        'rejected',     -- Refund rejected
        'cancelled',    -- Request cancelled
        'failed'        -- Refund failed
    )),
    
    -- Reason and notes
    reason TEXT NOT NULL CHECK (reason IN (
        'session_cancelled',
        'service_issue',
        'technical_problem',
        'duplicate_payment',
        'unauthorized_charge',
        'customer_request',
        'admin_adjustment',
        'other'
    )),
    reason_details TEXT,
    rejection_reason TEXT,
    
    -- Processing information
    requested_by UUID REFERENCES users(id) NOT NULL, -- Who requested refund
    approved_by UUID REFERENCES users(id), -- Admin who approved
    processed_by UUID REFERENCES users(id), -- Admin who processed
    
    -- Payment gateway information
    paystack_refund_id TEXT,
    paystack_refund_reference TEXT,
    gateway_response JSONB,
    
    -- Timestamps
    requested_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    approved_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- 2. REFUND HISTORY TABLE
-- Audit trail for refund status changes
-- =====================================================
CREATE TABLE IF NOT EXISTS refund_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    refund_id UUID REFERENCES refunds(id) ON DELETE CASCADE NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES users(id),
    change_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- 3. INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_session_id ON refunds(session_id);
CREATE INDEX IF NOT EXISTS idx_refunds_payment_reference ON refunds(payment_reference);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_requested_at ON refunds(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_refund_history_refund_id ON refund_history(refund_id);

-- =====================================================
-- 4. FUNCTIONS FOR REFUND MANAGEMENT
-- =====================================================

-- Function to create a refund request
CREATE OR REPLACE FUNCTION create_refund_request(
    p_user_id UUID,
    p_payment_reference TEXT,
    p_refund_type TEXT,
    p_refund_amount_kobo INTEGER,
    p_reason TEXT,
    p_reason_details TEXT DEFAULT NULL,
    p_session_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_refund_id UUID;
    v_payment_id UUID;
    v_original_amount INTEGER;
    v_refund_fee INTEGER;
    v_net_refund INTEGER;
BEGIN
    -- Get payment details
    SELECT id, amount_kobo INTO v_payment_id, v_original_amount
    FROM payments
    WHERE payment_reference = p_payment_reference
    AND user_id = p_user_id;

    IF v_payment_id IS NULL THEN
        RAISE EXCEPTION 'Payment not found';
    END IF;

    -- Calculate refund fee (e.g., 2% processing fee)
    v_refund_fee := CEIL(p_refund_amount_kobo * 0.02);
    v_net_refund := p_refund_amount_kobo - v_refund_fee;

    -- Create refund request
    INSERT INTO refunds (
        user_id,
        payment_id,
        session_id,
        payment_reference,
        refund_type,
        original_amount_kobo,
        refund_amount_kobo,
        refund_fee_kobo,
        net_refund_kobo,
        status,
        reason,
        reason_details,
        requested_by,
        requested_at
    ) VALUES (
        p_user_id,
        v_payment_id,
        p_session_id,
        p_payment_reference,
        p_refund_type,
        v_original_amount,
        p_refund_amount_kobo,
        v_refund_fee,
        v_net_refund,
        'pending',
        p_reason,
        p_reason_details,
        p_user_id,
        NOW()
    ) RETURNING id INTO v_refund_id;

    -- Create history entry
    INSERT INTO refund_history (refund_id, new_status, changed_by, change_reason)
    VALUES (v_refund_id, 'pending', p_user_id, 'Refund request created');

    RETURN v_refund_id;
END;
$$ LANGUAGE plpgsql;

-- Function to approve refund
CREATE OR REPLACE FUNCTION approve_refund(
    p_refund_id UUID,
    p_admin_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_old_status TEXT;
BEGIN
    SELECT status INTO v_old_status FROM refunds WHERE id = p_refund_id;

    IF v_old_status != 'pending' THEN
        RAISE EXCEPTION 'Only pending refunds can be approved';
    END IF;

    UPDATE refunds
    SET 
        status = 'approved',
        approved_by = p_admin_id,
        approved_at = NOW(),
        updated_at = NOW()
    WHERE id = p_refund_id;

    -- Add to history
    INSERT INTO refund_history (refund_id, old_status, new_status, changed_by, change_reason)
    VALUES (p_refund_id, v_old_status, 'approved', p_admin_id, 'Refund approved by admin');

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to reject refund
CREATE OR REPLACE FUNCTION reject_refund(
    p_refund_id UUID,
    p_admin_id UUID,
    p_rejection_reason TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_old_status TEXT;
BEGIN
    SELECT status INTO v_old_status FROM refunds WHERE id = p_refund_id;

    IF v_old_status != 'pending' THEN
        RAISE EXCEPTION 'Only pending refunds can be rejected';
    END IF;

    UPDATE refunds
    SET 
        status = 'rejected',
        approved_by = p_admin_id,
        rejection_reason = p_rejection_reason,
        approved_at = NOW(),
        updated_at = NOW()
    WHERE id = p_refund_id;

    -- Add to history
    INSERT INTO refund_history (refund_id, old_status, new_status, changed_by, change_reason)
    VALUES (p_refund_id, v_old_status, 'rejected', p_admin_id, p_rejection_reason);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to process refund
CREATE OR REPLACE FUNCTION process_refund(
    p_refund_id UUID,
    p_admin_id UUID,
    p_paystack_refund_id TEXT,
    p_paystack_reference TEXT,
    p_gateway_response JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    v_old_status TEXT;
    v_user_id UUID;
    v_refund_amount INTEGER;
BEGIN
    SELECT status, user_id, refund_amount_kobo 
    INTO v_old_status, v_user_id, v_refund_amount 
    FROM refunds 
    WHERE id = p_refund_id;

    IF v_old_status NOT IN ('approved', 'processing') THEN
        RAISE EXCEPTION 'Only approved refunds can be processed';
    END IF;

    UPDATE refunds
    SET 
        status = 'completed',
        processed_by = p_admin_id,
        paystack_refund_id = p_paystack_refund_id,
        paystack_refund_reference = p_paystack_reference,
        gateway_response = p_gateway_response,
        processed_at = NOW(),
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_refund_id;

    -- Add to history
    INSERT INTO refund_history (refund_id, old_status, new_status, changed_by, change_reason)
    VALUES (p_refund_id, v_old_status, 'completed', p_admin_id, 'Refund processed successfully');

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's refund history
CREATE OR REPLACE FUNCTION get_user_refunds(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    refund_id UUID,
    payment_reference TEXT,
    refund_amount_kobo INTEGER,
    net_refund_kobo INTEGER,
    status TEXT,
    reason TEXT,
    requested_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.payment_reference,
        r.refund_amount_kobo,
        r.net_refund_kobo,
        r.status,
        r.reason,
        r.requested_at,
        r.completed_at
    FROM refunds r
    WHERE r.user_id = p_user_id
    ORDER BY r.requested_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. VIEWS FOR EASY QUERYING
-- =====================================================

-- View for pending refunds (admin dashboard)
CREATE OR REPLACE VIEW pending_refunds_view AS
SELECT 
    r.id,
    r.user_id,
    u.full_name as user_name,
    u.email as user_email,
    r.payment_reference,
    r.refund_type,
    r.refund_amount_kobo,
    r.net_refund_kobo,
    r.reason,
    r.reason_details,
    r.requested_at,
    EXTRACT(EPOCH FROM (NOW() - r.requested_at))/3600 as hours_pending
FROM refunds r
JOIN users u ON r.user_id = u.id
WHERE r.status = 'pending'
ORDER BY r.requested_at ASC;

-- View for refund statistics
CREATE OR REPLACE VIEW refund_statistics AS
SELECT 
    COUNT(*) as total_refunds,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_refunds,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_refunds,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_refunds,
    SUM(CASE WHEN status = 'completed' THEN refund_amount_kobo ELSE 0 END) as total_refunded_kobo,
    AVG(CASE WHEN status = 'completed' THEN 
        EXTRACT(EPOCH FROM (completed_at - requested_at))/3600 
    END) as avg_processing_hours
FROM refunds;

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Trigger to update timestamp
CREATE OR REPLACE FUNCTION update_refund_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_refund_timestamp
    BEFORE UPDATE ON refunds
    FOR EACH ROW
    EXECUTE FUNCTION update_refund_timestamp();

-- =====================================================
-- 7. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own refunds
CREATE POLICY refunds_user_select ON refunds
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create refund requests
CREATE POLICY refunds_user_insert ON refunds
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins can view all refunds
CREATE POLICY refunds_admin_all ON refunds
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Users can view history of their refunds
CREATE POLICY refund_history_user_select ON refund_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM refunds 
            WHERE refunds.id = refund_history.refund_id 
            AND refunds.user_id = auth.uid()
        )
    );

-- Admins can view all refund history
CREATE POLICY refund_history_admin_select ON refund_history
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE refunds IS 'Tracks all refund requests and processing status';
COMMENT ON TABLE refund_history IS 'Audit trail for refund status changes';
COMMENT ON FUNCTION create_refund_request IS 'Creates a new refund request with automatic fee calculation';
COMMENT ON FUNCTION approve_refund IS 'Approves a pending refund request';
COMMENT ON FUNCTION reject_refund IS 'Rejects a pending refund request with reason';
COMMENT ON FUNCTION process_refund IS 'Marks refund as completed after gateway processing';

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'Refund system schema created successfully!' as status;
SELECT COUNT(*) as refund_table_count FROM pg_tables WHERE tablename IN ('refunds', 'refund_history');

