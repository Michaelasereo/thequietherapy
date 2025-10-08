# 🐛 Donations Debug Console Guide

## 📊 Overview

A real-time debug console to monitor donation payments, track Paystack webhooks, and see database updates as they happen.

---

## 🚀 Quick Access

### Development (Local)
**Debug Console:** http://localhost:3000/admin/donations-debug

**API Endpoints:**
- Stats (public): http://localhost:3000/api/donations/stats
- Debug (full data): http://localhost:3000/api/donations/debug

### Production (Live Site)
**Debug Console:** https://your-domain.com/admin/donations-debug

**API Endpoints:**
- Stats: https://your-domain.com/api/donations/stats
- Debug: https://your-domain.com/api/donations/debug

---

## ✨ Features

### 1. **Real-Time Monitoring** 🔴 LIVE
- Auto-refreshes every **5 seconds**
- Shows live donation count and amounts
- Tracks webhook status

### 2. **Status Breakdown**
- ✅ **Success** - Payment completed and verified
- ⏳ **Pending** - Waiting for Paystack confirmation
- ❌ **Failed** - Payment declined
- 🚫 **Cancelled** - User abandoned payment

### 3. **What You See**
```
┌─────────────────────────────────────────┐
│  Successful Donations: ₦100             │
│  1 payment • 1 donor                    │
├─────────────────────────────────────────┤
│  Pending Payments: ₦5,100               │
│  2 waiting for confirmation             │
├─────────────────────────────────────────┤
│  Failed Payments: 0                     │
├─────────────────────────────────────────┤
│  Total Donations: 3                     │
└─────────────────────────────────────────┘
```

### 4. **Detailed Transaction Table**
- Donor information
- Payment status
- Creation time
- Verification time
- Webhook status (received/pending)
- Time since creation

---

## 🔢 How Counting Works NOW

### ✅ Public Stats (What Users See)
**Endpoint:** `/api/donations/stats`

**Only counts:**
- Status = `'success'`
- Verified by Paystack webhook

**Example:**
```json
{
  "raised": 100,        // Only successful donations
  "donors": 1,          // Only unique successful donors
  "totalRecords": 1     // Only success records
}
```

### 🐛 Debug Console (What You See)
**Endpoint:** `/api/donations/debug`

**Shows everything:**
- All statuses (success, pending, failed, cancelled)
- Separate totals for each status
- All donation records

**Example:**
```json
{
  "successfulAmount": 100,    // Only success
  "pendingAmount": 5100,      // Only pending
  "statusBreakdown": {
    "success": 1,
    "pending": 2,
    "failed": 0,
    "cancelled": 0
  }
}
```

---

## 📋 Testing Payment Flow

### Step 1: Initiate Test Payment
```bash
node test-donation-payment.js
```

### Step 2: Open Debug Console
Visit: http://localhost:3000/admin/donations-debug

You'll see the donation as **"Pending"** immediately.

### Step 3: Complete Payment on Paystack
Use test card:
```
Card: 4084 0840 8408 4081
CVV: 408
PIN: 0000
Expiry: 12/25
```

### Step 4: Watch Real-Time Update
Within **5 seconds**, you'll see:
- ✅ Status changes from "Pending" → "Success"
- ✅ "Verified" timestamp appears
- ✅ "Webhook" badge shows "Received"
- ✅ Public stats update (if you refresh)

---

## 🔍 Debugging Payment Issues

### Issue 1: Donation Stuck in "Pending"
**Symptoms:**
- Payment completed on Paystack
- Status still shows "pending" after 1+ minute

**Causes:**
1. Webhook not configured in Paystack
2. Webhook URL incorrect
3. Webhook secret key mismatch

**Fix:**
1. Check Paystack dashboard: https://dashboard.paystack.com/#/settings/webhooks
2. Verify webhook URL: `https://your-domain.com/api/donations/webhook`
3. Check server logs for webhook errors

### Issue 2: Webhook Not Firing
**Check server logs for:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔔 DONATION WEBHOOK RECEIVED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Event Type: charge.success
Event ID: xxx
```

**If you don't see this:**
- Webhook is not reaching your server
- Check Paystack webhook settings

### Issue 3: Donations Not Counting
**Check debug console:**
- Is status "success"? ✅ Will count
- Is status "pending"? ❌ Won't count until verified

**Public stats only show successful donations!**

---

## 🛠️ API Reference

### GET `/api/donations/stats`
**Public endpoint** - Shows only successful donations

**Response:**
```json
{
  "success": true,
  "data": {
    "raised": 100,
    "donors": 1,
    "target": 120000000,
    "daysLeft": 45,
    "averageDonation": 100,
    "totalRecords": 1,
    "recentDonations": [...]
  },
  "diagnostics": {
    "source": "live_database",
    "responseTime": 1637,
    "recordCount": 1
  }
}
```

### GET `/api/donations/debug`
**Debug endpoint** - Shows ALL donations

**Response:**
```json
{
  "success": true,
  "timestamp": "2025-10-08T07:23:52.332Z",
  "summary": {
    "totalDonations": 3,
    "statusBreakdown": {
      "success": 1,
      "pending": 2,
      "failed": 0,
      "cancelled": 0
    },
    "successfulAmount": 100,
    "pendingAmount": 5100,
    "uniqueSuccessfulDonors": 1
  },
  "donations": [
    {
      "id": "...",
      "amount": 5000,
      "donor_name": "Test Donor",
      "status": "pending",
      "reference": "DONATION_...",
      "created_at": "...",
      "verified_at": null,
      "timeSinceCreated": 790403,
      "hasWebhookResponse": false
    }
  ]
}
```

---

## 🎯 Production Setup

### 1. Configure Paystack Webhook

**Dashboard:** https://dashboard.paystack.com/#/settings/webhooks

**Webhook URL:**
```
https://your-production-domain.com/api/donations/webhook
```

**Events to send:**
- ✅ `charge.success`

### 2. Test Webhook

Paystack lets you test webhooks:
1. Go to webhook settings
2. Click "Test Webhook"
3. Check your debug console

### 3. Monitor Production

**Access debug console on live site:**
```
https://your-domain.com/admin/donations-debug
```

**Note:** You may want to add authentication to `/admin/*` routes in production!

---

## 🔐 Security Recommendations

### Protect Debug Console in Production

Add authentication to `app/admin/donations-debug/page.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { ServerSessionManager } from '@/lib/server-session-manager'

export default async function DonationsDebugPage() {
  // Check if user is admin
  const session = await ServerSessionManager.getSession()
  
  if (!session || session.user_type !== 'admin') {
    redirect('/login')
  }
  
  // ... rest of component
}
```

### Rate Limiting

Consider adding rate limiting to debug endpoints in production.

---

## 📊 Key Differences: Stats vs Debug

| Feature | Public Stats | Debug Console |
|---------|-------------|---------------|
| Endpoint | `/api/donations/stats` | `/api/donations/debug` |
| Counts | Success only | All statuses |
| Pending | ❌ Not counted | ✅ Shown separately |
| Failed | ❌ Not shown | ✅ Shown |
| Updates | 30s polling | 5s auto-refresh |
| Purpose | Public display | Admin monitoring |
| Shows webhooks | No | Yes |
| Real-time | Yes (30s) | Yes (5s) |

---

## 🎓 Understanding Payment Flow

```
1. User clicks "Donate ₦5,000"
   ↓
2. POST /api/donations/initiate
   ↓
3. Database: Insert with status='pending'
   ↓ [Debug console shows: ⏳ Pending ₦5,000]
4. User redirected to Paystack
   ↓
5. User enters card details
   ↓
6. Paystack processes payment
   ↓
7. Paystack sends webhook to /api/donations/webhook
   ↓
8. Database: Update status='success', add verified_at
   ↓ [Debug console shows: ✅ Success ₦5,000]
9. Public stats update (next refresh)
   ↓
10. User sees thank you page
```

---

## 🚨 Common Issues & Solutions

### "Pending" donations not updating

**Check:**
1. Is dev server running? `lsof -ti:3000`
2. Are webhooks configured? Check Paystack dashboard
3. Is webhook URL accessible? Test with ngrok/tunnel for local dev

**Local Development Webhooks:**
Use ngrok or similar:
```bash
ngrok http 3000
```
Then use ngrok URL in Paystack webhook settings:
```
https://your-ngrok-url.ngrok.io/api/donations/webhook
```

### Stats showing ₦0 but debug shows donations

**Reason:** All donations are "pending" (not verified)

**Solution:** Complete payment on Paystack to trigger webhook

### Webhook not firing in development

**Reason:** Paystack can't reach `localhost`

**Solution:** Use ngrok tunnel for local testing

---

## ✅ Summary

### What Changed:
1. ✅ **Stats API** - Now only counts successful donations
2. ✅ **Debug Console** - New real-time monitoring page
3. ✅ **Debug API** - New endpoint showing all donation data
4. ✅ **Enhanced Logging** - Better webhook logs in console

### Access Points:
- **Debug Console:** http://localhost:3000/admin/donations-debug
- **Public Stats:** http://localhost:3000/api/donations/stats
- **Debug API:** http://localhost:3000/api/donations/debug
- **Support Page:** http://localhost:3000/support

### Test It:
```bash
# Generate test payment
node test-donation-payment.js

# Check all donations
node check-all-donations.js

# Open debug console
open http://localhost:3000/admin/donations-debug
```

---

🎉 **Your donation system now has professional debugging capabilities!**

