# Payment System Code Review - User Dashboard

## Problem Statement
The "Purchase Credits" button on the user dashboard (`/dashboard/credits`) doesn't open Paystack payment gateway.

## Current Implementation

### 1. Frontend: Credits Purchase Page
**File**: `app/dashboard/credits/page.tsx`

**Key Features**:
- Displays 4 credit packages (Basic, Standard, Premium, Family)
- Custom amount input (minimum ₦5,000)
- Purchase button that should redirect to Paystack

**Current Purchase Handler** (Lines 100-190):
```typescript
const handlePurchase = async () => {
  // Calculate amount and credits
  // Get user authentication
  // Call /api/paystack/initialize
  // Redirect to authorization_url
}
```

**Issue**: The button calls `/api/paystack/initialize` which should return an `authorization_url` to redirect to Paystack.

---

### 2. Payment Initialization API
**File**: `app/api/paystack/initialize/route.ts`

**Purpose**: Initialize payment with Paystack and return authorization URL

**Flow**:
1. Validates amount and email
2. Generates payment reference
3. Calls `initializePayment()` from `lib/paystack-enhanced.ts`
4. Returns `authorization_url` in response

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "authorization_url": "https://paystack.com/pay/...",
    "reference": "credits_basic_...",
    "amount": 500000,
    "currency": "NGN"
  }
}
```

---

### 3. Paystack Enhanced Library
**File**: `lib/paystack-enhanced.ts`

**Key Functions**:
- `initializePayment(data: PaymentData)`: Initializes payment with Paystack
- `verifyPayment(reference: string)`: Verifies payment status
- `processWebhook(webhookData)`: Handles Paystack webhooks

**Payment Initialization** (Lines 85-157):
- Converts amount to kobo (amount * 100)
- Calls Paystack transaction.initialize API
- Stores payment transaction in database
- Returns authorization URL

---

### 4. Payment Verification
**File**: `app/api/paystack/verify/route.ts`

**Purpose**: Verify payment after user returns from Paystack

**Flow**:
1. Receives payment reference from Paystack callback
2. Verifies payment with Paystack
3. Redirects based on payment type:
   - `type: 'credits'` → `/dashboard?payment=success&type=credits`
   - `type: 'session_booking'` → `/book-session?payment=success`
   - Other types → Generic success page

---

### 5. Webhook Handler
**File**: `app/api/payments/webhook/route.ts`

**Purpose**: Handle Paystack webhook events for payment confirmation

**Events Handled**:
- `charge.success`: Updates credits, creates payment record
- `charge.failed`: Updates payment status

**Security**:
- Verifies webhook signature using HMAC SHA512
- Implements idempotency check to prevent duplicate processing

---

### 6. User Credits API
**File**: `app/api/credits/user/route.ts`

**Purpose**: Get user's current credit balance

**Endpoints**:
- `GET /api/credits/user`: Returns total credits, credit history, payment history
- `POST /api/credits/user`: Actions like `add_test_credits`, `use_credit`

---

## Payment Flow Diagram

```
User clicks "Purchase Credits"
    ↓
Frontend: handlePurchase() in credits/page.tsx
    ↓
POST /api/paystack/initialize
    ↓
Backend: Calls initializePayment() from paystack-enhanced.ts
    ↓
Paystack API: transaction.initialize
    ↓
Returns authorization_url
    ↓
Frontend: window.location.href = authorization_url
    ↓
User redirected to Paystack payment page
    ↓
User completes payment
    ↓
Paystack redirects to: callback_url
    ↓
GET /api/paystack/verify
    ↓
Backend verifies payment with Paystack
    ↓
Redirects to: /dashboard/credits?payment=success
    ↓
Webhook: POST /api/payments/webhook
    ↓
Backend processes webhook and updates credits
```

---

## Potential Issues to Check

### 1. Missing Paystack Secret Key
**Check**: `process.env.PAYSTACK_SECRET_KEY` is set in Netlify environment variables

### 2. Incorrect API Response Structure
**Check**: Paystack response contains `authorization_url` in `data.authorization_url`

### 3. CORS/Redirect Issues
**Check**: Callback URL is properly configured in Paystack dashboard

### 4. Frontend Error Handling
**Check**: Console logs show if `authorization_url` is missing from response

### 5. Network Errors
**Check**: Browser console shows any network errors when calling `/api/paystack/initialize`

---

## Testing Checklist

1. **Test Payment Initialization**
   - Open browser console
   - Click "Purchase Credits" button
   - Check if `/api/paystack/initialize` is called
   - Verify response contains `authorization_url`

2. **Test Paystack Integration**
   - Verify `PAYSTACK_SECRET_KEY` is set in environment
   - Check Paystack dashboard for transaction initialization logs

3. **Test Redirect**
   - After clicking button, should redirect to Paystack
   - Paystack URL should contain payment details

4. **Test Callback**
   - After payment, should redirect back to app
   - Credits should be updated in database

---

## Environment Variables Required

```bash
PAYSTACK_SECRET_KEY=sk_live_... # or sk_test_... for testing
NEXT_PUBLIC_APP_URL=https://thequietherapy.live
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Related Files

### Frontend Components
- `app/dashboard/credits/page.tsx` - Main credits purchase page
- `components/credit-purchase-flow.tsx` - Alternative purchase flow component
- `components/credit-purchase.tsx` - Reusable credit purchase component

### Backend APIs
- `app/api/paystack/initialize/route.ts` - Initialize payment
- `app/api/paystack/verify/route.ts` - Verify payment
- `app/api/payments/webhook/route.ts` - Webhook handler
- `app/api/payments/initiate/route.ts` - Alternative payment initiation
- `app/api/credits/user/route.ts` - User credits API

### Libraries
- `lib/paystack-enhanced.ts` - Enhanced Paystack integration
- `lib/paystack.ts` - Basic Paystack utilities
- `lib/paystack-client.ts` - Paystack client wrapper

---

## Debugging Steps

1. **Check Browser Console**
   - Open DevTools → Console
   - Click "Purchase Credits" button
   - Look for errors or logs

2. **Check Network Tab**
   - Open DevTools → Network
   - Filter by "paystack" or "initialize"
   - Check request/response for `/api/paystack/initialize`

3. **Check Server Logs**
   - Check Netlify function logs
   - Look for payment initialization errors

4. **Verify Environment Variables**
   - Check Netlify dashboard → Site settings → Environment variables
   - Ensure `PAYSTACK_SECRET_KEY` is set

5. **Test Paystack API Directly**
   - Use Postman/curl to test Paystack API
   - Verify secret key is valid

---

## Code Snippets for Reference

### Frontend Purchase Handler
```typescript
// app/dashboard/credits/page.tsx, lines 100-190
const handlePurchase = async () => {
  // Calculate amount and credits
  const { data: { user } } = await supabase.auth.getUser()
  
  // Call Paystack API
  const response = await fetch('/api/paystack/initialize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: amount * 100, // Convert to kobo
      email: user.email,
      reference: `credits_${selectedPackage}_...`,
      callback_url: `${window.location.origin}/dashboard/credits?payment=success`,
      metadata: { type: 'credits', credits, ... }
    })
  })
  
  const result = await response.json()
  
  // Redirect to Paystack
  if (result.data?.authorization_url) {
    window.location.href = result.data.authorization_url
  }
}
```

### Backend Initialize Payment
```typescript
// app/api/paystack/initialize/route.ts
export async function POST(request: NextRequest) {
  const { amount, email, reference, callback_url, metadata } = await request.json()
  
  const result = await initializePayment({
    amount,
    email,
    reference,
    callback_url,
    metadata
  })
  
  return NextResponse.json({
    success: true,
    data: {
      ...result.data,
      authorization_url: result.data.authorization_url
    }
  })
}
```

---

## Next Steps

1. **Add Error Logging**
   - Add more console.log statements
   - Log the full Paystack response
   - Log any errors during initialization

2. **Add Error Handling**
   - Show user-friendly error messages
   - Handle network failures gracefully
   - Retry logic for failed requests

3. **Add Loading States**
   - Show loading spinner while initializing payment
   - Disable button during payment process

4. **Test in Production**
   - Test with real Paystack secret key
   - Verify webhook callbacks work
   - Test payment verification flow

---

## Questions for Senior Developer

1. Is `PAYSTACK_SECRET_KEY` properly configured in production?
2. Are there any CORS or security restrictions blocking redirects?
3. Should we use a different Paystack API endpoint?
4. Is the callback URL correctly configured in Paystack dashboard?
5. Are there any middleware or routing issues blocking the redirect?

---

**Created**: $(date +"%Y-%m-%d %H:%M:%S")
**Last Updated**: Payment flow implementation

