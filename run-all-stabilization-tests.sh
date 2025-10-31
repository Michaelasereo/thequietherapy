#!/bin/bash

# ============================================
# MASTER TEST SCRIPT - Stabilization Phase
# ============================================
# Tests all phases of the stabilization implementation
# Run this before deployment to ensure everything works
# ============================================

echo "=================================================="
echo "🚀 TRPI Stabilization - Master Test Suite"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test
run_test() {
  local test_name=$1
  local test_command=$2
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🧪 TEST: $test_name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  if eval $test_command; then
    echo -e "${GREEN}✅ PASS${NC}: $test_name"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}❌ FAIL${NC}: $test_name"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  
  echo ""
}

# ============================================
# PHASE 0: Pre-Flight Checks
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 PHASE 0: Pre-Flight Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

run_test "Node.js version >= 18" "node -v | grep -E 'v(18|19|20|21)'"
run_test "npm installed" "npm -v"
run_test "Environment variables set" "test -f .env.local || test -f .env"
run_test "node_modules exists" "test -d node_modules"

echo ""

# ============================================
# PHASE 1: Build & Lint Tests
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔨 PHASE 1: Build & Lint Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

run_test "TypeScript compilation" "npx tsc --noEmit"
run_test "Next.js linter" "npm run lint"
run_test "Build succeeds" "npm run build"

echo ""

# ============================================
# PHASE 2: File Existence Tests
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 PHASE 2: File Existence Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

run_test "Avatar Service exists" "test -f lib/services/avatar-service.ts"
run_test "Error Boundary exists" "test -f components/providers/global-error-boundary.tsx"
run_test "Error Log API exists" "test -f app/api/error-log/route.ts"
run_test "Consistency Checker exists" "test -f lib/services/data-consistency-checker.ts"
run_test "Critical Path Tests exist" "test -f tests/critical-paths.test.ts"
run_test "Cron Job exists" "test -f app/api/cron/consistency-check/route.ts"

echo ""

# ============================================
# PHASE 3: Database Migration Tests
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  PHASE 3: Database Migration Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

run_test "Error logs table SQL exists" "test -f create-error-logs-table.sql"
run_test "Consistency logs table SQL exists" "test -f create-consistency-check-logs-table.sql"
run_test "Specialization migration SQL exists" "test -f migrations/standardize-specialization.sql"
run_test "Avatar consistency SQL exists" "test -f verify-avatar-consistency.sql"

echo ""

# ============================================
# PHASE 4: Critical Path Tests
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 PHASE 4: Critical Path Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f ".env.local" ] || [ -f ".env" ]; then
  echo "⚠️  Running critical path tests (requires database connection)..."
  echo "   If this fails, check your DATABASE_URL environment variable"
  echo ""
  
  run_test "Critical Path Tests" "node tests/critical-paths.test.ts"
else
  echo -e "${YELLOW}⚠️  SKIPPED${NC}: Critical path tests (no .env file found)"
  echo "   To run these tests, create .env.local with database credentials"
  echo ""
fi

# ============================================
# PHASE 5: Documentation Tests
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 PHASE 5: Documentation Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

run_test "Project Overview exists" "test -f PROJECT_OVERVIEW.md"
run_test "Stabilization Roadmap exists" "test -f STABILIZATION-ROADMAP.md"
run_test "Phase 1 Documentation exists" "test -f PHASE-1-AVATAR-FIX-COMPLETE.md"
run_test "Implementation Complete README exists" "test -f IMPLEMENTATION-COMPLETE-README.md"

echo ""

# ============================================
# PHASE 6: Integration Tests (Optional)
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 PHASE 6: Integration Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${YELLOW}⚠️  SKIPPED${NC}: Integration tests (require running server)"
echo "   To run integration tests:"
echo "   1. Start dev server: npm run dev"
echo "   2. Run: curl http://localhost:3000/api/health"
echo ""

# ============================================
# TEST SUMMARY
# ============================================
echo "=================================================="
echo "📊 TEST SUMMARY"
echo "=================================================="
echo ""
echo "Total Tests:  $TOTAL_TESTS"
echo -e "${GREEN}Passed:       $PASSED_TESTS${NC}"
echo -e "${RED}Failed:       $FAILED_TESTS${NC}"
echo ""

# Calculate pass rate
if [ $TOTAL_TESTS -gt 0 ]; then
  PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
  echo "Pass Rate:    $PASS_RATE%"
else
  echo "Pass Rate:    N/A"
fi

echo ""
echo "=================================================="

# Exit with appropriate code
if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✅ ALL TESTS PASSED - READY FOR DEPLOYMENT${NC}"
  echo "=================================================="
  exit 0
else
  echo -e "${RED}❌ SOME TESTS FAILED - FIX BEFORE DEPLOYMENT${NC}"
  echo "=================================================="
  exit 1
fi

