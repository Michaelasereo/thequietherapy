# Support Page Donation Issue Analysis

## 🚨 **Problem**: Donations not updating after successful payment

### **Root Causes Identified:**

1. **Paystack Webhook Not Configured**
   - Webhook URL not set in Paystack dashboard
   - Webhook endpoint not publicly accessible
   - Webhook signature verification failing

2. **Database Issues**
   - Donations table exists but may have permission issues
   - Webhook not updating donation status from 'pending' to 'success'

3. **Real-time Updates Not Working**
   - Support page not fetching live data from database
   - Cache not being invalidated after successful payments

## 🔧 **Solutions Required:**

### **1. Configure Paystack Webhook**

**Webhook URL needed:**
```
https://your-domain.com/api/donations/webhook
```

**For local development:**
```
https://your-ngrok-url.ngrok.io/api/donations/webhook
```

**Steps:**
1. Go to Paystack Dashboard → Settings → Webhooks
2. Add webhook URL
3. Select events: `charge.success`, `charge.failed`
4. Test webhook with Paystack test tool

### **2. Test Webhook Endpoint**

**Test the webhook locally:**
```bash
# Test webhook endpoint
curl -X POST http://localhost:3000/api/donations/webhook \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: test-signature" \
  -d '{
    "event": "charge.success",
    "data": {
      "reference": "test-reference",
      "amount": 500000,
      "status": "success"
    }
  }'
```

### **3. Verify Database Updates**

**Check if donations are being updated:**
```sql
-- Check pending donations
SELECT * FROM donations WHERE status = 'pending';

-- Check successful donations  
SELECT * FROM donations WHERE status = 'success';

-- Check total raised
SELECT SUM(amount) as total_raised FROM donations WHERE status = 'success';
```

### **4. Fix Real-time Updates**

**The support page should:**
1. Fetch live donation stats from `/api/donations/stats`
2. Update progress bar with real data
3. Show recent donations
4. Refresh automatically when new donations come in

## 🎯 **Immediate Actions Needed:**

### **Step 1: Set up Paystack Webhook**
1. Get your webhook URL (production or ngrok for local)
2. Configure in Paystack dashboard
3. Test webhook with Paystack test tool

### **Step 2: Test Donation Flow**
1. Make a test donation
2. Check if webhook receives the event
3. Verify database update
4. Check if support page updates

### **Step 3: Debug Webhook Issues**
1. Check server logs for webhook events
2. Verify signature validation
3. Test database updates
4. Check cache invalidation

## 🔍 **Debugging Commands:**

### **Check Webhook Logs:**
```bash
# Check if webhook is receiving events
tail -f logs/webhook.log

# Test webhook endpoint
curl -X POST http://localhost:3000/api/donations/webhook \
  -H "Content-Type: application/json" \
  -d '{"event": "charge.success", "data": {"reference": "test"}}'
```

### **Check Database:**
```sql
-- Check all donations
SELECT * FROM donations ORDER BY created_at DESC;

-- Check webhook processing
SELECT * FROM payment_events ORDER BY created_at DESC;
```

### **Check Support Page:**
```bash
# Test stats API
curl http://localhost:3000/api/donations/stats

# Check if cache is working
curl -H "Cache-Control: no-cache" http://localhost:3000/api/donations/stats
```

## 📋 **Quick Fix Checklist:**

- [ ] Configure Paystack webhook URL
- [ ] Test webhook endpoint accessibility
- [ ] Verify webhook signature validation
- [ ] Test donation flow end-to-end
- [ ] Check database updates
- [ ] Verify support page real-time updates
- [ ] Test cache invalidation
- [ ] Monitor webhook logs

## 🚀 **Expected Result:**

After fixing these issues:
1. ✅ Donations are created with 'pending' status
2. ✅ Paystack webhook receives 'charge.success' event
3. ✅ Webhook updates donation status to 'success'
4. ✅ Support page shows updated donation totals
5. ✅ Progress bar reflects real donation amounts
6. ✅ Recent donations appear in real-time

## 🔧 **Files to Check:**

- `/api/donations/webhook/route.ts` - Webhook handler
- `/api/donations/stats/route.ts` - Stats API
- `/components/RealTimeProgress.tsx` - Progress component
- `/app/support/page.tsx` - Support page
- Paystack dashboard webhook settings
- Database donations table
