#!/bin/bash

# Script to create performance indexes safely
# Usage: ./create-indexes.sh [database_url]
# Example: ./create-indexes.sh "postgresql://user:pass@localhost:5432/trpi_db"

set -e  # Exit on any error

# Database connection
DB_URL=${1:-$DATABASE_URL}

if [ -z "$DB_URL" ]; then
    echo "Error: Please provide database URL as argument or set DATABASE_URL environment variable"
    echo "Usage: $0 'postgresql://user:pass@localhost:5432/database'"
    exit 1
fi

echo "🚀 Creating performance indexes for TRPI database..."
echo "Database: $DB_URL"
echo ""

# Function to run a single index command
run_index() {
    local name=$1
    local command=$2
    echo "Creating $name..."
    if psql "$DB_URL" -c "$command"; then
        echo "✅ $name created successfully"
    else
        echo "❌ Failed to create $name"
    fi
    echo ""
}

# Critical indexes (run these first)
echo "🔥 Creating CRITICAL indexes..."

run_index "Authentication index" \
    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_token ON user_sessions (session_token) WHERE expires_at > NOW();"

run_index "Therapist session index" \
    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_therapist_status_time ON sessions (therapist_id, status, start_time DESC);"

run_index "User session index" \
    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_status_time ON sessions (user_id, status, start_time DESC);"

run_index "Availability checking index" \
    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_therapist_time_range ON sessions (therapist_id, start_time, end_time) WHERE status IN ('scheduled', 'confirmed', 'in_progress');"

echo "⚡ Creating PERFORMANCE indexes..."

run_index "User type filtering index" \
    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_type_status ON users (user_type, is_active, is_verified);"

run_index "Magic link index" \
    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_magic_links_token_auth_type ON magic_links (token, auth_type) WHERE used_at IS NULL AND expires_at > NOW();"

run_index "Therapist availability index" \
    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_therapist_availability_schedule ON therapist_availability (therapist_id, day_of_week, start_time, end_time) WHERE is_available = true;"

run_index "User upcoming sessions index" \
    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_upcoming ON sessions (user_id, start_time) WHERE status = 'scheduled';"

# Update statistics
echo "📊 Updating table statistics..."
psql "$DB_URL" -c "ANALYZE users; ANALYZE sessions; ANALYZE user_sessions; ANALYZE magic_links;"

# Verification
echo "🔍 Verifying created indexes..."
psql "$DB_URL" -c "SELECT indexname, indexdef FROM pg_indexes WHERE indexname LIKE 'idx_%' ORDER BY indexname;"

echo ""
echo "🎉 Index creation completed!"
echo "✅ Your database is now optimized for better performance!"
