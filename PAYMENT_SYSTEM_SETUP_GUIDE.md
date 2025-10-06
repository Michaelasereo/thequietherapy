# Payment & Credits System - Quick Setup Guide

## 🚀 Quick Start (5 Minutes)

This guide will help you get the complete payment and credits system up and running.

---

## Step 1: Database Setup

Run these SQL files in your Supabase SQL editor **in this exact order**:

### 1.1 Create Pricing System
```bash
# File: create-pricing-system-schema.sql
# This creates the core credit and package tables
```

### 1.2 Add Payment Tables
```bash
# File: add-payment-tables-clean.sql
# This adds pending_payments and payment tracking
```

### 1.3 Add Refund System
```bash
# File: supabase/refunds-system-schema.sql
# This creates the refund management tables
```

**Verification Query:**
```sql
SELECT tablename FROM pg_tables 
WHERE tablename IN (
  'user_purchases',
  'user_session_credits',
  'package_definitions',
  'pending_payments',
  'payments',
  'refunds',
  'refund_history'
) 
ORDER BY tablename;
```

You should see all 7 tables listed.

---

## Step 2: Environment Variables

Add these to your `.env.local`:

```env
# Paystack Keys (Get from https://dashboard.paystack.com/#/settings/developer)
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx

# Supabase (Already configured if you're using Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxxxxxxxxxxx
```

### Getting Paystack Keys:

1. Go to [https://dashboard.paystack.com/#/signup](https://dashboard.paystack.com/#/signup)
2. Sign up for a free account
3. Navigate to Settings → API Keys & Webhooks
4. Copy your test keys (start with `sk_test_` and `pk_test_`)

---

## Step 3: Install Dependencies

The required packages are already in your `package.json`:

```json
{
  "paystack": "^2.0.1",
  "jspdf": "^3.0.1",
  "jspdf-autotable": "^5.0.2"
}
```

If not installed yet:
```bash
npm install paystack jspdf jspdf-autotable
```

---

## Step 4: Configure Paystack Webhook

### 4.1 Development (Local Testing)

Use ngrok or similar:
```bash
ngrok http 3000
# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
```

### 4.2 Production Setup

1. Go to Paystack Dashboard → Settings → API Keys & Webhooks
2. Click "Add Webhook URL"
3. Enter: `https://your-domain.com/api/payments/webhook`
4. Select these events:
   - ✅ charge.success
   - ✅ charge.failed
   - ✅ transfer.success
5. Save webhook

---

## Step 5: Update User Dashboard Navigation

### 5.1 Add to Dashboard Sidebar

File: `components/dashboard-sidebar.tsx` or `components/users-dashboard-sidebar.tsx`

```typescript
const navigation = [
  // ... existing items
  {
    name: 'Payments',
    href: '/dashboard/payments',
    icon: CreditCard
  },
  {
    name: 'Purchase Credits',
    href: '/dashboard/credits',
    icon: Package
  }
]
```

### 5.2 Add to Admin Sidebar

File: `components/admin/admin-sidebar.tsx` (if exists)

```typescript
const adminNavigation = [
  // ... existing items
  {
    name: 'Refund Management',
    href: '/admin/dashboard/refunds',
    icon: RefreshCw
  }
]
```

---

## Step 6: Update Credits Page

Replace the existing credits page with the new purchase flow:

File: `app/dashboard/credits/page.tsx`

```typescript
import CreditPurchaseFlow from '@/components/credit-purchase-flow'
import { getServerSession } from '@/lib/auth'

export default async function CreditsPage() {
  const session = await getServerSession()
  
  return (
    <div className="container mx-auto py-6">
      <CreditPurchaseFlow 
        userId={session.user.id}
        onPurchaseComplete={() => {
          // Redirect to success page or refresh
          window.location.href = '/dashboard/book'
        }}
      />
    </div>
  )
}
```

---

## Step 7: Test the System

### 7.1 Test Credit Purchase

1. Navigate to `/dashboard/credits`
2. Select a package
3. Click "Purchase Package"
4. You'll be redirected to Paystack
5. Use test card:
   ```
   Card Number: 4084 0840 8408 4081
   CVV: 408
   Expiry: Any future date (e.g., 12/25)
   PIN: 0000
   OTP: 123456
   ```
6. Complete payment
7. You should be redirected back
8. Check credits in your account

### 7.2 Test Payment History

1. Navigate to `/dashboard/payments`
2. You should see your completed payment
3. Click "Receipt" to download PDF
4. Try requesting a refund

### 7.3 Test Refund System

1. In payment history, click "Refund" on a payment
2. Select a reason
3. Submit request
4. Go to admin panel `/admin/dashboard/refunds`
5. Approve or reject the refund

---

## Step 8: Verify Credit Balance

Add a credit balance display to your booking flow:

```typescript
import { getUserCreditBalance } from '@/lib/credit-tracking-service'

// In your component
const balance = await getUserCreditBalance(userId)

<div className="mb-4">
  <Alert>
    <Info className="h-4 w-4" />
    <AlertDescription>
      You have <strong>{balance?.credits_available || 0}</strong> credits available
    </AlertDescription>
  </Alert>
</div>
```

---

## 📊 Monitoring & Maintenance

### Daily Checks

```sql
-- Check pending payments older than 24 hours
SELECT * FROM pending_payments 
WHERE status = 'pending' 
AND created_at < NOW() - INTERVAL '24 hours';

-- Check pending refunds
SELECT COUNT(*) FROM refunds WHERE status = 'pending';

-- Check failed payments
SELECT COUNT(*) FROM pending_payments WHERE status = 'failed';
```

### Weekly Cleanup

```sql
-- Clean up old pending payments
SELECT cleanup_old_pending_payments();

-- View refund statistics
SELECT * FROM refund_statistics;
```

---

## 🐛 Troubleshooting

### Issue: Payment successful but credits not added

**Solution:**
```typescript
// Manually verify payment
curl -X POST https://your-domain.com/api/payments/verify \
  -H "Content-Type: application/json" \
  -d '{"reference": "payment_reference_here"}'
```

### Issue: Webhook not working

**Checklist:**
- [ ] Webhook URL is publicly accessible
- [ ] HTTPS is enabled
- [ ] Webhook signature verification is working
- [ ] Check Paystack dashboard for delivery status

**Test webhook locally:**
```bash
# Terminal 1: Start your app
npm run dev

# Terminal 2: Start ngrok
ngrok http 3000

# Update webhook URL in Paystack dashboard with ngrok URL
```

### Issue: Refund not processing

**Check:**
1. Refund is approved by admin
2. Paystack has sufficient balance
3. Check server logs for errors
4. Verify Paystack API key has refund permission

---

## 🔐 Security Checklist

Before going to production:

- [ ] Replace test API keys with live keys
- [ ] Enable HTTPS on your domain
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable webhook signature verification
- [ ] Set up monitoring alerts
- [ ] Document admin procedures
- [ ] Train support staff

---

## 📞 Support

**Technical Issues:**
- Check the main documentation: `PAYMENT_CREDITS_SYSTEM_DOCUMENTATION.md`
- Review API logs in Supabase
- Check Paystack dashboard for transaction details

**Paystack Support:**
- Email: hello@paystack.com
- Documentation: https://paystack.com/docs

---

## ✅ System Status Verification

Run this checklist to verify everything is working:

```bash
✅ Database schema deployed
✅ Environment variables configured
✅ Paystack webhook configured
✅ Test payment successful
✅ Credits added to account
✅ Payment history displaying
✅ Refund request created
✅ Receipt download working
✅ Admin panel accessible
✅ Credit balance showing correctly
```

---

## 🎉 You're All Set!

Your payment and credits system is now fully operational!

**Next Steps:**
1. Test the complete user journey
2. Train your support team
3. Monitor the first real transactions
4. Collect user feedback
5. Iterate and improve

**Need Help?**
Refer to the complete documentation in `PAYMENT_CREDITS_SYSTEM_DOCUMENTATION.md`

---

**Setup Time:** ~15 minutes
**Last Updated:** October 1, 2025
**Status:** Production Ready ✅

