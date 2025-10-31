# ✅ DEPLOYMENT CHECKLIST

**Status**: Ready for Production Deployment  
**Date**: October 21, 2025  
**Phases Complete**: 1, 2, 3, 4

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### Step 1: Run All Tests ⏱️ 2 minutes

```bash
# Run master test script
./run-all-stabilization-tests.sh

# Expected output: All tests PASS ✅
```

- [ ] All tests pass (0 failures)
- [ ] No linter errors
- [ ] No TypeScript errors
- [ ] Build succeeds

---

### Step 2: Database Setup ⏱️ 5 minutes

**Run in Supabase SQL Editor:**

- [ ] **Create error_logs table**
  - Copy/paste: `create-error-logs-table.sql`
  - Verify: `SELECT COUNT(*) FROM error_logs;`

- [ ] **Create consistency_check_logs table**
  - Copy/paste: `create-consistency-check-logs-table.sql`
  - Verify: `SELECT COUNT(*) FROM consistency_check_logs;`

- [ ] **Optional: Standardize specialization**
  - Copy/paste: `migrations/standardize-specialization.sql`
  - Verify migration before dropping old column

- [ ] **Check existing avatar consistency**
  - Copy/paste: `verify-avatar-consistency.sql`
  - Note any inconsistencies to fix

---

### Step 3: Code Integration ⏱️ 3 minutes

- [ ] **Add Error Boundary to Root Layout**

```typescript
// app/layout.tsx
import { CombinedErrorBoundary } from '@/components/providers/global-error-boundary'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CombinedErrorBoundary>
          {/* Your existing code */}
          {children}
        </CombinedErrorBoundary>
      </body>
    </html>
  )
}
```

- [ ] Verify file imports work
- [ ] No compilation errors

---

### Step 4: Environment Variables ⏱️ 2 minutes

**Add to `.env.local` (development) and Netlify (production):**

```env
# Cron Job Authentication
CRON_SECRET=your-secure-random-string-here

# Auto-fix Consistency (optional, recommended for production)
AUTO_FIX_CONSISTENCY=true

# Enable Error Logging (production only)
NEXT_PUBLIC_ENABLE_ERROR_LOGGING=true
```

- [ ] `CRON_SECRET` set (generate secure random string)
- [ ] `AUTO_FIX_CONSISTENCY` set to `true`
- [ ] `NEXT_PUBLIC_ENABLE_ERROR_LOGGING` set to `true` for production
- [ ] All existing environment variables still present

**Generate CRON_SECRET:**
```bash
# Generate secure random string
openssl rand -hex 32
```

---

### Step 5: Final Verification ⏱️ 3 minutes

- [ ] Review git status
- [ ] All new files added
- [ ] No unintended changes
- [ ] Commit message ready

```bash
# Check status
git status

# Review changes
git diff

# Stage all files
git add .

# Commit
git commit -m "feat: complete stabilization phases 1-4

- Phase 1: Fixed avatar 3-way sync
- Phase 2: Added error boundaries and monitoring
- Phase 3: Implemented regression test suite
- Phase 4: Created data consistency tools

Closes #stabilization"
```

---

## 🚀 DEPLOYMENT

### Step 6: Deploy to Production ⏱️ 5 minutes

```bash
# Push to main branch
git push origin main

# Netlify will auto-deploy
# Monitor at: https://app.netlify.com/
```

- [ ] Push succeeds
- [ ] Netlify build starts
- [ ] Build completes successfully
- [ ] Deployment published

---

## ✅ POST-DEPLOYMENT VERIFICATION

### Step 7: Smoke Tests ⏱️ 10 minutes

#### Test 1: Avatar Upload
- [ ] Login as therapist
- [ ] Go to Settings → Profile
- [ ] Upload new avatar
- [ ] Verify avatar visible in:
  - [ ] Therapist dashboard
  - [ ] Public therapist listing
  - [ ] Admin panel (if admin)
  - [ ] Booking page

#### Test 2: Error Logging
- [ ] Intentionally trigger an error (e.g., invalid API call)
- [ ] Check browser console for error caught message
- [ ] Verify error logged to database:
  ```sql
  SELECT * FROM error_logs ORDER BY created_at DESC LIMIT 10;
  ```
- [ ] Verify user sees graceful error UI (not crash)

#### Test 3: Consistency Check
- [ ] Manually trigger consistency check:
  ```bash
  curl -X POST https://yourdomain.com/api/cron/consistency-check
  ```
- [ ] Check response (should return audit results)
- [ ] Verify logged to database:
  ```sql
  SELECT * FROM consistency_check_logs ORDER BY created_at DESC LIMIT 5;
  ```

#### Test 4: Avatar Consistency
- [ ] Run verification query:
  ```sql
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN status = '✅ CONSISTENT' THEN 1 END) as consistent
  FROM (
    SELECT 
      u.email,
      CASE 
        WHEN u.avatar_url = te.profile_image_url 
          AND te.profile_image_url = tp.profile_image_url 
        THEN '✅ CONSISTENT'
        ELSE '❌ INCONSISTENT'
      END as status
    FROM users u
    LEFT JOIN therapist_enrollments te ON u.email = te.email
    LEFT JOIN therapist_profiles tp ON u.id = tp.user_id
    WHERE u.user_type = 'therapist'
  ) AS check_results;
  ```
- [ ] Verify 100% consistency (or note inconsistencies)

---

### Step 8: Fix Existing Inconsistencies ⏱️ 5-10 minutes

If avatar consistency check shows issues:

```sql
-- Run auto-fix (uncomment the fix section in verify-avatar-consistency.sql)
-- OR manually fix using EnhancedTherapistConsistency

-- After fixing, re-verify:
SELECT * FROM get_avatar_consistency_summary();
```

- [ ] All inconsistencies fixed
- [ ] Consistency at 100%

---

### Step 9: Setup Cron Job ⏱️ 5 minutes

**Option A: Vercel Cron (Recommended)**

Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/consistency-check",
    "schedule": "0 2 * * *"
  }]
}
```

- [ ] `vercel.json` created
- [ ] Committed and pushed
- [ ] Verify cron appears in Vercel dashboard

**Option B: External Cron Service**

Use cron-job.org or similar:
- URL: `https://yourdomain.com/api/cron/consistency-check`
- Method: GET
- Schedule: Daily at 2 AM
- Header: `Authorization: Bearer YOUR_CRON_SECRET`

- [ ] Cron job created
- [ ] Test run successful
- [ ] Scheduled correctly

---

### Step 10: Monitor for 24-48 Hours ⏱️ Ongoing

#### Check Every 6 Hours:

**Error Logs:**
```sql
SELECT 
  error_type,
  COUNT(*) as count,
  MAX(created_at) as last_seen
FROM error_logs
WHERE created_at >= NOW() - INTERVAL '6 hours'
GROUP BY error_type;
```
- [ ] No critical errors
- [ ] Expected error patterns only

**Consistency Logs:**
```sql
SELECT * FROM consistency_check_logs
ORDER BY created_at DESC
LIMIT 10;
```
- [ ] Cron job running daily
- [ ] Consistency at 100%
- [ ] Auto-fixes working (if needed)

**Performance:**
- [ ] Response times normal
- [ ] No timeouts
- [ ] Build times normal
- [ ] No memory issues

---

## 📊 SUCCESS CRITERIA

After 48 hours, verify:

- [ ] **Zero avatar inconsistencies**
- [ ] **Zero unhandled errors** (all caught and logged)
- [ ] **100% consistency rate**
- [ ] **Cron job running successfully**
- [ ] **No user complaints**
- [ ] **All tests still passing**

---

## 🔄 ROLLBACK PLAN

If critical issues occur:

### Quick Rollback (5 minutes):

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Netlify will auto-deploy previous version
```

### Partial Rollback (10 minutes):

**Remove only error boundary:**
```typescript
// app/layout.tsx
// Remove CombinedErrorBoundary wrapper
// Keep children as-is
```

**Disable consistency checks:**
```bash
# Temporarily disable cron job
# Set AUTO_FIX_CONSISTENCY=false
```

### Database Rollback:

If database issues:
```sql
-- Drop new tables (if needed)
DROP TABLE IF EXISTS error_logs;
DROP TABLE IF EXISTS consistency_check_logs;

-- Rollback specialization migration
-- See migrations/standardize-specialization.sql ROLLBACK section
```

---

## 📞 SUPPORT

### Common Issues:

**Build Fails:**
- Check TypeScript errors: `tsc --noEmit`
- Check linter: `npm run lint`
- Verify imports correct

**Cron Job Not Running:**
- Verify CRON_SECRET in environment
- Check authorization header
- View cron logs in Netlify/Vercel

**Errors Not Logging:**
- Verify error_logs table exists
- Check NEXT_PUBLIC_ENABLE_ERROR_LOGGING=true
- Check API route accessible

**Consistency Issues:**
- Run manual fix: DataConsistencyChecker.autoFixAll()
- Check database connections
- Review consistency logs

---

## 📚 Documentation Reference

- **Quick Start**: `FINAL-IMPLEMENTATION-SUMMARY.md`
- **Complete Overview**: `PROJECT_OVERVIEW.md`
- **Phase Details**: `PHASES-2-3-4-COMPLETE.md`
- **Troubleshooting**: Check error logs and consistency reports

---

## ✅ COMPLETION SIGN-OFF

Deployment complete when all items checked:

### Pre-Deployment:
- [ ] All tests pass
- [ ] Database tables created
- [ ] Error boundary integrated
- [ ] Environment variables set
- [ ] Code committed and pushed

### Deployment:
- [ ] Deployed to production
- [ ] Build successful
- [ ] Site accessible

### Post-Deployment:
- [ ] Avatar upload works
- [ ] Error logging works
- [ ] Consistency check works
- [ ] Avatar consistency verified
- [ ] Cron job setup
- [ ] 24-48 hour monitoring complete

### Final:
- [ ] No critical issues
- [ ] All success criteria met
- [ ] Team notified
- [ ] Documentation updated

---

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Verified By**: _______________  
**Status**: ✅ **PRODUCTION READY**

---

**🎉 Congratulations! Platform stabilization deployment complete!**

