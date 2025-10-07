-- Cleanup script for donations table
-- Run this first if you're getting errors about existing objects

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_donations_updated_at ON donations;

-- Drop function if it exists
DROP FUNCTION IF EXISTS update_donations_updated_at();

-- Drop indexes if they exist (optional - you can skip this)
-- DROP INDEX IF EXISTS idx_donations_email;
-- DROP INDEX IF EXISTS idx_donations_status;
-- DROP INDEX IF EXISTS idx_donations_created_at;
-- DROP INDEX IF EXISTS idx_donations_paystack_reference;
-- DROP INDEX IF EXISTS idx_donations_status_type;

-- Drop table if it exists (CAREFUL: This will delete all donation data!)
-- DROP TABLE IF EXISTS donations CASCADE;

SELECT 'Cleanup completed. You can now run create-donations-table-safe.sql' as status;
