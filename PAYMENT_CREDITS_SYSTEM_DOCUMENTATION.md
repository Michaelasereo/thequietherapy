# Payment & Credits System - Complete Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [Payment Flow](#payment-flow)
5. [Credit System](#credit-system)
6. [Refund System](#refund-system)
7. [API Documentation](#api-documentation)
8. [Frontend Components](#frontend-components)
9. [Testing Guide](#testing-guide)
10. [Deployment Checklist](#deployment-checklist)

---

## 🎯 Overview

The Payment & Credits System is a comprehensive solution for managing therapy session payments, credits, and refunds in the TRPI platform. It integrates with Paystack for secure payment processing and includes robust credit tracking and refund management.

### Key Features
- ✅ **Complete Paystack Integration** - Secure payment gateway
- ✅ **Credit Purchase Flow** - Beautiful, user-friendly UI
- ✅ **Credit Usage Tracking** - Real-time analytics and monitoring
- ✅ **Refund System** - Full refund request and processing workflow
- ✅ **Payment History** - Comprehensive transaction records
- ✅ **Admin Panel** - Full management interface for payments and refunds

---

## 🏗 System Architecture

### Components

```
┌─────────────────────────────────────────────┐
│           User Interface Layer              │
├─────────────────────────────────────────────┤
│  • Credit Purchase Flow                     │
│  • Payment History                          │
│  • Refund Requests                          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│           API Layer (Next.js)               │
├─────────────────────────────────────────────┤
│  • /api/payments/initiate                   │
│  • /api/payments/verify                     │
│  • /api/payments/webhook                    │
│  • /api/payments/history                    │
│  • /api/refunds/request                     │
│  • /api/refunds/admin                       │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         Payment Gateway (Paystack)          │
├─────────────────────────────────────────────┤
│  • Transaction Initialize                   │
│  • Transaction Verify                       │
│  • Refund Processing                        │
│  • Webhook Events                           │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         Database (Supabase/PostgreSQL)      │
├─────────────────────────────────────────────┤
│  • pending_payments                         │
│  • payments                                 │
│  • user_purchases                           │
│  • user_session_credits                     │
│  • refunds                                  │
│  • refund_history                           │
└─────────────────────────────────────────────┘
```

---

## 🗄 Database Schema

### Main Tables

#### 1. **pending_payments**
Tracks payment attempts before completion.

```sql
CREATE TABLE pending_payments (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    package_type TEXT NOT NULL,
    amount_kobo INTEGER NOT NULL,
    payment_reference TEXT UNIQUE NOT NULL,
    paystack_reference TEXT,
    status TEXT CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. **payments**
Completed payment records.

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    package_type TEXT NOT NULL,
    amount_kobo INTEGER NOT NULL,
    payment_reference TEXT UNIQUE NOT NULL,
    paystack_reference TEXT,
    status TEXT DEFAULT 'success',
    payment_method TEXT,
    gateway_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. **user_session_credits**
Individual session credits (wallet system).

```sql
CREATE TABLE user_session_credits (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    purchase_id UUID REFERENCES user_purchases(id),
    session_id UUID REFERENCES sessions(id),
    session_duration_minutes INTEGER NOT NULL,
    is_free_credit BOOLEAN DEFAULT false,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. **refunds**
Refund requests and processing.

```sql
CREATE TABLE refunds (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    payment_id UUID,
    payment_reference TEXT NOT NULL,
    refund_type TEXT CHECK (refund_type IN ('full_refund', 'partial_refund', 'credit_reversal', 'cancellation_refund')),
    original_amount_kobo INTEGER NOT NULL,
    refund_amount_kobo INTEGER NOT NULL,
    refund_fee_kobo INTEGER DEFAULT 0,
    net_refund_kobo INTEGER NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled', 'failed')),
    reason TEXT NOT NULL,
    reason_details TEXT,
    rejection_reason TEXT,
    requested_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    paystack_refund_id TEXT,
    requested_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 💳 Payment Flow

### 1. **Initiate Payment**

**Endpoint:** `POST /api/payments/initiate`

```typescript
// Request
{
  package_type: 'gold' | 'silver' | 'bronze' | 'single'
}

// Response
{
  payment_url: string,      // Redirect to Paystack
  payment_reference: string,
  amount_naira: number,
  package_name: string,
  sessions_included: number
}
```

**Flow:**
1. User selects a credit package
2. API creates pending payment record
3. Paystack initializes transaction
4. User redirected to Paystack payment page
5. User completes payment
6. User redirected back to app

### 2. **Verify Payment**

**Endpoint:** `POST /api/payments/verify`

```typescript
// Request
{
  reference: string  // Payment reference
}

// Response
{
  verified: boolean,
  status: 'success' | 'failed',
  credits_added: number,
  package: {
    name: string,
    sessions_included: number,
    amount_naira: number
  }
}
```

**Flow:**
1. App verifies payment with Paystack
2. Updates pending_payment status
3. Creates payment record
4. Adds credits to user account
5. Sends confirmation notification

### 3. **Webhook Handler**

**Endpoint:** `POST /api/payments/webhook`

Handles Paystack webhook events:
- `charge.success` - Payment successful
- `charge.failed` - Payment failed
- `transfer.success` - Refund completed

---

## 🎫 Credit System

### Credit Types

1. **Free Credits** (25 minutes)
   - Automatically granted on signup
   - One-time use
   - Used first (FIFO)

2. **Paid Credits** (35 minutes)
   - Purchased through packages
   - Never expire
   - Used after free credits

### Credit Packages

```typescript
const packages = [
  {
    package_type: 'single',
    name: 'Pay-As-You-Go',
    sessions: 1,
    price: ₦5,000,
    duration: 35
  },
  {
    package_type: 'bronze',
    name: 'Bronze Pack',
    sessions: 3,
    price: ₦13,500,
    savings: ₦1,500,
    duration: 35
  },
  {
    package_type: 'silver',
    name: 'Silver Pack',
    sessions: 5,
    price: ₦20,000,
    savings: ₦5,000,
    duration: 35
  },
  {
    package_type: 'gold',
    name: 'Gold Pack',
    sessions: 8,
    price: ₦28,000,
    savings: ₦12,000,
    duration: 35
  }
]
```

### Credit Usage Tracking

**Service:** `lib/credit-tracking-service.ts`

Key Functions:
- `getUserCreditBalance(userId)` - Get current balance
- `getUserCreditUsage(userId)` - Get usage history
- `getUserCreditAnalytics(userId)` - Get analytics
- `useCreditForSession(creditId, sessionId)` - Use a credit
- `releaseCreditFromSession(sessionId)` - Release on cancellation

---

## 🔄 Refund System

### Refund Types

1. **full_refund** - Complete refund of payment
2. **partial_refund** - Partial amount refunded
3. **credit_reversal** - Credits returned to account
4. **cancellation_refund** - Session cancellation refund

### Refund Flow

```
┌──────────────────┐
│ User Requests    │
│ Refund           │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Status: Pending  │
│ (24-48h review)  │
└────────┬─────────┘
         ↓
   ┌─────┴─────┐
   ↓           ↓
┌────────┐ ┌────────┐
│Approved│ │Rejected│
└───┬────┘ └───┬────┘
    ↓          ↓
┌──────────┐   │
│Processing│   │
└────┬─────┘   │
     ↓         ↓
┌──────────┐ ┌────────┐
│Completed │ │  End   │
└──────────┘ └────────┘
```

### Refund Request

**Endpoint:** `POST /api/refunds/request`

```typescript
// Request
{
  payment_reference: string,
  refund_type: 'full_refund' | 'partial_refund' | 'credit_reversal' | 'cancellation_refund',
  reason: 'session_cancelled' | 'service_issue' | 'technical_problem' | 'duplicate_payment' | 'customer_request' | 'other',
  reason_details?: string,
  refund_amount_kobo?: number,
  session_id?: string
}

// Response
{
  refund_id: string,
  status: 'pending',
  refund_amount_naira: number,
  refund_fee_naira: number,
  net_refund_naira: number,
  message: string
}
```

### Admin Refund Management

**Endpoint:** `POST /api/refunds/admin`

```typescript
// Approve
{
  refund_id: string,
  action: 'approve'
}

// Reject
{
  refund_id: string,
  action: 'reject',
  rejection_reason: string
}
```

**Refund Fee:** 2% processing fee (minimum ₦1)

---

## 🔌 API Documentation

### Payment APIs

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/payments/initiate` | POST | User | Initiate payment |
| `/api/payments/verify` | POST | User | Verify payment |
| `/api/payments/webhook` | POST | Paystack | Handle webhooks |
| `/api/payments/history` | GET | User | Get payment history |
| `/api/payments/receipt` | GET | User | Download receipt |

### Refund APIs

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/refunds/request` | POST | User | Request refund |
| `/api/refunds/request` | GET | User | Get user refunds |
| `/api/refunds/admin` | GET | Admin | Get all refunds |
| `/api/refunds/admin` | POST | Admin | Approve/Reject |

### Credit APIs

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/credit-packages` | GET | User | Get packages |
| `/api/credits/user` | GET | User | Get user credits |
| `/api/credits/user-credits` | GET | User | Get credit balance |

---

## 🎨 Frontend Components

### 1. Credit Purchase Flow
**File:** `components/credit-purchase-flow.tsx`

Features:
- Package selection with best value highlighting
- Real-time price calculations
- Secure payment modal
- Error handling
- Loading states

Usage:
```tsx
import CreditPurchaseFlow from '@/components/credit-purchase-flow'

<CreditPurchaseFlow 
  userId={userId}
  onPurchaseComplete={() => console.log('Purchase complete')}
/>
```

### 2. Payment History
**File:** `components/payment-history-content.tsx`

Features:
- Transaction table with filters
- Receipt download
- Refund request interface
- Real-time status updates

### 3. Refund Management (Admin)
**File:** `components/admin/refund-management-content.tsx`

Features:
- Refund request queue
- Approve/Reject workflow
- Detailed refund information
- Status tracking

---

## 🧪 Testing Guide

### 1. Database Setup

```bash
# Run the schema files in order:
1. create-pricing-system-schema.sql
2. add-payment-tables-clean.sql
3. refunds-system-schema.sql
```

### 2. Environment Variables

```env
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

### 3. Test Payment Flow

```typescript
// Test script
const testPayment = async () => {
  // 1. Initiate payment
  const response = await fetch('/api/payments/initiate', {
    method: 'POST',
    body: JSON.stringify({ package_type: 'bronze' })
  })
  const { payment_url, payment_reference } = await response.json()
  
  // 2. Complete payment on Paystack
  window.location.href = payment_url
  
  // 3. Verify after redirect
  await fetch('/api/payments/verify', {
    method: 'POST',
    body: JSON.stringify({ reference: payment_reference })
  })
}
```

### 4. Test Refund Flow

```typescript
// Request refund
const requestRefund = async () => {
  const response = await fetch('/api/refunds/request', {
    method: 'POST',
    body: JSON.stringify({
      payment_reference: 'trpi_bronze_12345_1234567890',
      refund_type: 'full_refund',
      reason: 'customer_request',
      reason_details: 'Test refund'
    })
  })
  return await response.json()
}
```

### 5. Paystack Test Cards

```
Successful Transaction:
Card Number: 4084 0840 8408 4081
CVV: 408
Expiry: Any future date
PIN: 0000
OTP: 123456

Failed Transaction:
Card Number: 5060 6666 6666 6666 6666
CVV: Any
```

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] Database schema deployed to production
- [ ] Environment variables configured
- [ ] Paystack webhook URL configured
- [ ] SSL certificate active
- [ ] Payment packages defined
- [ ] Test transactions verified

### Paystack Configuration

1. **Setup Webhook URL**
   ```
   https://your-domain.com/api/payments/webhook
   ```

2. **Enable Events**
   - charge.success
   - charge.failed
   - transfer.success

3. **Get Production Keys**
   - Replace test keys with live keys
   - Update environment variables

### Post-Deployment

- [ ] Test payment flow end-to-end
- [ ] Verify webhook deliveries
- [ ] Test refund processing
- [ ] Monitor error logs
- [ ] Setup payment alerts
- [ ] Document support procedures

### Monitoring

```typescript
// Key metrics to monitor
- Payment success rate
- Average transaction time
- Refund request volume
- Credit usage patterns
- Failed payment reasons
```

---

## 📊 Analytics & Reporting

### Available Metrics

1. **Payment Analytics**
   - Total revenue
   - Package popularity
   - Success/failure rates
   - Average transaction value

2. **Credit Analytics**
   - Credits purchased vs used
   - Expiring credits
   - Most popular therapists
   - Session completion rates

3. **Refund Analytics**
   - Refund rate
   - Average processing time
   - Common refund reasons
   - Approval/rejection ratio

### Export Functions

```typescript
// Export payment history
GET /api/payments/export?format=csv&start_date=2024-01-01

// Export credit usage
GET /api/credits/export?format=csv&user_id=xxx
```

---

## 🔒 Security Considerations

### Payment Security

1. **Never store card details** - All handled by Paystack
2. **Verify webhook signatures** - Prevent fake webhooks
3. **Use HTTPS only** - Secure transmission
4. **Validate amounts server-side** - Prevent tampering
5. **Rate limit API calls** - Prevent abuse

### Data Protection

1. **Encrypt sensitive data** - At rest and in transit
2. **Audit logs** - Track all payment actions
3. **Role-based access** - Limit admin permissions
4. **PCI DSS compliance** - Through Paystack

---

## 🛟 Support & Troubleshooting

### Common Issues

#### Payment Not Completing

**Symptoms:** Payment successful on Paystack but credits not added

**Solution:**
```typescript
// Manually verify payment
POST /api/payments/verify
{
  "reference": "payment_reference_here"
}
```

#### Webhook Not Received

**Symptoms:** Payment completed but not processed

**Solution:**
1. Check Paystack dashboard for webhook delivery status
2. Verify webhook URL is accessible
3. Check server logs for errors
4. Manually trigger webhook replay

#### Credits Not Showing

**Symptoms:** Payment successful but credits not visible

**Solution:**
```sql
-- Check user credits
SELECT * FROM user_session_credits 
WHERE user_id = 'xxx' AND used_at IS NULL;

-- Check purchases
SELECT * FROM user_purchases 
WHERE user_id = 'xxx' 
ORDER BY created_at DESC;
```

### Support Contacts

- **Technical Issues:** dev@thequietherapy.live
- **Payment Issues:** payments@thequietherapy.live
- **Paystack Support:** hello@paystack.com

---

## 📝 Changelog

### Version 1.0.0 (Initial Release)
- ✅ Complete Paystack integration
- ✅ Credit purchase flow
- ✅ Payment history
- ✅ Refund system
- ✅ Admin management panel
- ✅ Analytics and reporting

### Upcoming Features
- [ ] Subscription payments
- [ ] Multiple payment methods
- [ ] Gift cards
- [ ] Promotional codes
- [ ] Affiliate system

---

## 👥 Contributors

- Payment System: AI Assistant
- Paystack Integration: AI Assistant
- Refund System: AI Assistant
- Documentation: AI Assistant

---

## 📄 License

Proprietary - The Quiet Therapy Platform (TRPI)

---

**Last Updated:** October 1, 2025
**Version:** 1.0.0
**Status:** Production Ready ✅

