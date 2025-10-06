# Payment System - Quick Reference Card 🚀

## 🔗 Important URLs

### User Pages
- **Purchase Credits:** `/dashboard/credits`
- **Payment History:** `/dashboard/payments`
- **Book Session:** `/dashboard/book`

### Admin Pages
- **Refund Management:** `/admin/dashboard/refunds`
- **Payment Overview:** `/admin/dashboard/payments`

---

## 🔑 API Endpoints

### Payment APIs
```typescript
// Initiate Payment
POST /api/payments/initiate
Body: { package_type: string }

// Verify Payment
POST /api/payments/verify
Body: { reference: string }

// Webhook (Paystack Only)
POST /api/payments/webhook

// Payment History
GET /api/payments/history

// Download Receipt
GET /api/payments/receipt?payment_id=xxx
```

### Refund APIs
```typescript
// Request Refund (User)
POST /api/refunds/request
Body: {
  payment_reference: string,
  refund_type: string,
  reason: string,
  reason_details?: string
}

// Get User Refunds
GET /api/refunds/request

// Admin: Get All Refunds
GET /api/refunds/admin?status=pending

// Admin: Approve/Reject
POST /api/refunds/admin
Body: {
  refund_id: string,
  action: 'approve' | 'reject',
  rejection_reason?: string
}
```

### Credit APIs
```typescript
// Get Packages
GET /api/credit-packages

// Get User Credits
GET /api/credits/user
```

---

## 💳 Test Cards (Paystack)

### Successful Payment
```
Card: 4084 0840 8408 4081
CVV: 408
Expiry: 12/25
PIN: 0000
OTP: 123456
```

### Failed Payment
```
Card: 5060 6666 6666 6666 6666
CVV: Any
Expiry: Any future date
```

---

## 📊 Credit Packages

| Package | Sessions | Price | Per Session | Savings |
|---------|----------|-------|-------------|---------|
| Single | 1 | ₦5,000 | ₦5,000 | - |
| Bronze | 3 | ₦13,500 | ₦4,500 | ₦1,500 |
| Silver | 5 | ₦20,000 | ₦4,000 | ₦5,000 |
| Gold | 8 | ₦28,000 | ₦3,500 | ₦12,000 |

---

## 🗄️ Key Database Tables

```sql
-- Check user credits
SELECT * FROM user_session_credits 
WHERE user_id = 'xxx' AND used_at IS NULL;

-- Check payments
SELECT * FROM payments 
WHERE user_id = 'xxx' 
ORDER BY created_at DESC;

-- Check pending refunds
SELECT * FROM refunds 
WHERE status = 'pending';

-- Cleanup old payments
SELECT cleanup_old_pending_payments();
```

---

## 🔧 Common Functions

### Frontend (TypeScript)
```typescript
// Purchase credits
import CreditPurchaseFlow from '@/components/credit-purchase-flow'

// Check credit balance
import { getUserCreditBalance } from '@/lib/credit-tracking-service'
const balance = await getUserCreditBalance(userId)

// Request refund
import { createRefundRequest } from '@/lib/refund-service'
await createRefundRequest(
  paymentReference,
  'full_refund',
  'customer_request',
  'Reason details'
)
```

### Backend (SQL)
```sql
-- Grant free credit
SELECT grant_signup_credit('user_id');

-- Get available credits
SELECT * FROM get_available_credits('user_id');

-- Use a credit
SELECT use_credit('credit_id', 'session_id');
```

---

## 🐛 Troubleshooting

### Payment Not Completing
```typescript
// Manually verify
POST /api/payments/verify
{ "reference": "payment_ref" }
```

### Webhook Not Working
1. Check Paystack dashboard
2. Verify webhook URL
3. Check signature verification
4. Review server logs

### Credits Not Showing
```sql
-- Verify credits
SELECT * FROM user_session_credits WHERE user_id = 'xxx';

-- Check purchase
SELECT * FROM user_purchases WHERE user_id = 'xxx';
```

---

## 📧 Environment Variables

```env
# Required
PAYSTACK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Optional (for webhooks)
PAYSTACK_WEBHOOK_SECRET=whsec_xxxxx
```

---

## 🚨 Emergency Procedures

### Payment Failed But User Paid
```sql
-- Find payment
SELECT * FROM pending_payments WHERE payment_reference = 'xxx';

-- Manually add credits
SELECT grant_signup_credit('user_id'); -- or appropriate package
```

### Refund Stuck in Processing
```sql
-- Check refund status
SELECT * FROM refunds WHERE id = 'refund_id';

-- View Paystack response
SELECT gateway_response FROM refunds WHERE id = 'refund_id';
```

### User Lost Credits
```sql
-- Check credit history
SELECT * FROM user_session_credits WHERE user_id = 'xxx';

-- Check if credit was used
SELECT * FROM sessions WHERE credit_used_id = 'credit_id';

-- Release credit if session cancelled
UPDATE user_session_credits 
SET session_id = NULL, used_at = NULL 
WHERE id = 'credit_id';
```

---

## 📞 Support Contacts

**Technical Issues:** dev@thequietherapy.live  
**Payment Issues:** payments@thequietherapy.live  
**Paystack Support:** hello@paystack.com  

---

## ✅ Pre-Launch Checklist

- [ ] Database schema deployed
- [ ] Environment variables set
- [ ] Paystack webhook configured
- [ ] Test payment successful
- [ ] Credits added correctly
- [ ] Refund flow tested
- [ ] Admin panel accessible
- [ ] Monitoring set up
- [ ] Support team trained

---

## 🎯 Key Metrics to Monitor

**Daily:**
- Payment success rate
- Pending refunds count
- Failed transactions

**Weekly:**
- Revenue by package
- Credit usage rate
- Refund approval rate

**Monthly:**
- Total revenue
- Customer lifetime value
- Popular packages

---

## 📚 Documentation Files

1. **Setup Guide** - `PAYMENT_SYSTEM_SETUP_GUIDE.md`
2. **Full Documentation** - `PAYMENT_CREDITS_SYSTEM_DOCUMENTATION.md`
3. **Implementation Summary** - `PAYMENT_SYSTEM_IMPLEMENTATION_SUMMARY.md`
4. **Quick Reference** - This file

---

**Version:** 1.0.0  
**Last Updated:** October 1, 2025  
**Status:** Production Ready ✅

