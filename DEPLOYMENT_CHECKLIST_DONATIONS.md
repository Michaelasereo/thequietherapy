# 🚀 Donation System Deployment Checklist

**Date:** October 8, 2025  
**Features:** Debug Console, Stats API Fix, Webhook Enhancement

---

## ✅ Pre-Deployment Checklist

### 1. Code Changes
- [x] Committed to GitHub
- [x] Pushed to main branch
- [x] All files included

### 2. Environment Variables (Production)

Verify these are set in your hosting platform (Vercel/Netlify/etc):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# Paystack
PAYSTACK_SECRET_KEY=your_production_paystack_secret_key

# App URL (IMPORTANT for webhooks)
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

### 3. Paystack Webhook Configuration

**CRITICAL:** Update your Paystack webhook URL

1. Go to: https://dashboard.paystack.com/#/settings/webhooks
2. Set webhook URL to:
   ```
   https://your-production-domain.com/api/donations/webhook
   ```
3. Make sure it's using your **LIVE** Paystack keys (not test)
4. Test the webhook using Paystack's test button

### 4. Database Check

Ensure production Supabase has the `donations` table:
```sql
-- Run this in Supabase SQL Editor
SELECT * FROM donations LIMIT 1;
```

If table doesn't exist, run:
```sql
-- From: create-donations-table.sql
CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    donor_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    amount_kobo INTEGER NOT NULL,
    paystack_reference VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    donation_type VARCHAR(50) DEFAULT 'seed_funding',
    anonymous BOOLEAN DEFAULT FALSE,
    payment_method VARCHAR(50),
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_email ON donations(email);
CREATE INDEX IF NOT EXISTS idx_donations_reference ON donations(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC);
```

---

## 🚀 Deployment Steps

### Option A: Vercel (Recommended)

```bash
# If you have Vercel CLI installed
vercel --prod

# Or push will auto-deploy if connected to GitHub
# (Already done with git push)
```

**Verify deployment:**
1. Check Vercel dashboard for successful build
2. Visit your production URL

### Option B: Netlify

```bash
# If you have Netlify CLI
netlify deploy --prod

# Or commit will auto-deploy if connected
```

### Option C: Manual Push

Already done! Your hosting should auto-deploy from GitHub main branch.

---

## 🧪 Post-Deployment Testing

### 1. Check Debug Console
Visit: `https://your-domain.com/admin/donations-debug`

**Should show:**
- Live data from production database
- Auto-refresh working (5 seconds)
- All donation statuses

### 2. Check Stats API
Visit: `https://your-domain.com/api/donations/stats`

**Should return:**
```json
{
  "success": true,
  "data": {
    "raised": 0,  // or current amount
    "donors": 0,  // or current count
    "target": 120000000,
    ...
  }
}
```

### 3. Test Payment Flow

**IMPORTANT:** Use Paystack TEST mode first!

1. Go to: `https://your-domain.com/support`
2. Click "Donate"
3. Use test card:
   - Card: 4084 0840 8408 4081
   - CVV: 408
   - PIN: 0000
4. Complete payment
5. Check debug console - should update within 5-10 seconds

### 4. Verify Webhook

After test payment:

1. Check Paystack dashboard → Webhooks → Logs
2. Should show successful webhook delivery
3. Check debug console → Donation should be "success"
4. Check server logs (Vercel/Netlify logs)

**Look for:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔔 DONATION WEBHOOK RECEIVED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Event Type: charge.success
✅ DONATION VERIFIED & UPDATED TO SUCCESS
```

---

## 🔐 Security (Post-Deployment)

### 1. Protect Debug Console

**Add authentication to production:**

Edit `app/admin/donations-debug/page.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { ServerSessionManager } from '@/lib/server-session-manager'

export default async function DonationsDebugPage() {
  // Add this at the top
  const session = await ServerSessionManager.getSession()
  
  if (!session || session.user_type !== 'admin') {
    redirect('/login')
  }
  
  // ... rest of code
}
```

### 2. Monitor Webhook Activity

Check regularly:
- Paystack webhook logs
- Server logs for webhook errors
- Debug console for stuck "pending" donations

---

## 📊 Monitoring

### Daily Checks

1. **Debug Console**: `https://your-domain.com/admin/donations-debug`
   - Check for stuck pending donations
   - Monitor webhook status
   - Verify totals match Paystack dashboard

2. **Paystack Dashboard**: https://dashboard.paystack.com
   - Compare totals with your stats API
   - Check webhook success rate
   - Review failed payments

3. **Server Logs**
   - Check for webhook errors
   - Monitor API response times

### Weekly Reconciliation

Run this query in Supabase:
```sql
-- Total successful donations
SELECT 
  COUNT(*) as total_donations,
  COUNT(DISTINCT email) as unique_donors,
  SUM(amount) as total_raised
FROM donations 
WHERE status = 'success';

-- Compare with Paystack dashboard totals
```

---

## 🐛 Troubleshooting Production Issues

### Issue 1: Donations Stuck in "Pending"

**Check:**
1. Paystack webhook URL is correct
2. Webhook is receiving events (check Paystack logs)
3. Server logs for errors
4. Environment variables are set correctly

**Fix:**
- Update Paystack webhook URL
- Verify `PAYSTACK_SECRET_KEY` matches
- Check server isn't blocking Paystack IPs

### Issue 2: Stats Showing ₦0

**Check:**
1. Are there any successful donations? (not just pending)
2. Database connection working?
3. Check debug console - shows all statuses

**Fix:**
- Complete a test payment
- Check Supabase connection
- Verify table exists

### Issue 3: Debug Console Not Loading

**Check:**
1. Build logs for errors
2. API route `/api/donations/debug` accessible
3. Database permissions

**Fix:**
- Rebuild and redeploy
- Check console for errors
- Verify Supabase credentials

---

## 📈 Success Metrics

After deployment, you should see:

✅ **Debug Console**
- Loads in < 2 seconds
- Auto-refreshes every 5 seconds
- Shows accurate data

✅ **Stats API**
- Response time < 2 seconds
- Only counts successful donations
- Matches Paystack totals

✅ **Webhooks**
- 100% delivery rate
- Updates within 5-10 seconds
- No errors in logs

✅ **Public Stats**
- Support page shows accurate totals
- Updates every 30 seconds
- Progress bar animates smoothly

---

## 🔄 Rollback Plan

If issues arise:

```bash
# Rollback to previous commit
git revert HEAD
git push origin main

# Or go to specific commit
git reset --hard 66307d2  # Previous commit
git push origin main --force
```

**Note:** `--force` push should only be used in emergencies!

---

## 📞 Post-Deployment Contacts

### Paystack Support
- Dashboard: https://dashboard.paystack.com
- Email: support@paystack.com
- Docs: https://paystack.com/docs

### Supabase Support
- Dashboard: https://supabase.com/dashboard
- Docs: https://supabase.com/docs

### Hosting Support
- Vercel: https://vercel.com/support
- Netlify: https://www.netlify.com/support

---

## ✅ Final Checklist

Before going live:

- [ ] Environment variables set in production
- [ ] Paystack webhook configured
- [ ] Database table exists
- [ ] Test payment completed successfully
- [ ] Webhook verified working
- [ ] Debug console accessible
- [ ] Stats API returning correct data
- [ ] Public support page showing stats
- [ ] Server logs looking good
- [ ] No errors in browser console

---

## 🎉 You're Live!

Once all checks pass:

1. **Monitor for first 24 hours**
   - Check debug console hourly
   - Watch webhook logs
   - Monitor for errors

2. **Announce to users**
   - Test with real small donation first
   - Then promote fundraising campaign

3. **Regular monitoring**
   - Daily: Check debug console
   - Weekly: Reconcile with Paystack
   - Monthly: Review and optimize

---

## 📚 Resources

- **Debug Console Guide**: `DONATIONS_DEBUG_CONSOLE_GUIDE.md`
- **Implementation Summary**: `DONATION_DEBUG_IMPLEMENTATION_SUMMARY.md`
- **Architecture**: `DONATION_SYSTEM_ARCHITECTURE.md`

---

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Verification Status:** _____________  
**Issues Found:** _____________  
**Resolution:** _____________

---

🚀 **Good luck with your deployment!**

