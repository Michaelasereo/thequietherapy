#!/bin/bash

# =====================================================
# CLEAR ALL USERS AND THERAPISTS - COMPLETE SCRIPT
# =====================================================
# ⚠️  WARNING: This will DELETE ALL users and therapists
# ⚠️  This action is IRREVERSIBLE
# =====================================================

set -e  # Exit on error

echo "⚠️  WARNING: This will delete ALL users and therapists!"
echo "⚠️  This action is IRREVERSIBLE!"
echo ""
read -p "Type 'YES' to continue: " confirmation

if [ "$confirmation" != "YES" ]; then
    echo "❌ Cancelled - deletion aborted"
    exit 0
fi

echo ""
echo "🧹 Starting complete cleanup..."
echo ""

# Step 1: Clear database tables
echo "📊 Step 1: Clearing database tables..."
echo "   Run this SQL script in Supabase SQL Editor:"
echo "   File: clear-all-users-therapists-complete.sql"
echo ""
read -p "Press Enter after you've run the SQL script in Supabase..."

# Step 2: Clear Supabase Auth users
echo ""
echo "📊 Step 2: Clearing Supabase Auth users..."
node scripts/clear-all-auth-users.js

echo ""
echo "✅ Complete cleanup finished!"
echo ""

