# Payment System - Quick Code Reference

## 🔍 Problem
"Purchase Credits" button on `/dashboard/credits` doesn't open Paystack.

## 📋 Quick Checklist

### 1. Frontend Purchase Handler
**File**: `app/dashboard/credits/page.tsx` (Lines 100-190)

```typescript
const handlePurchase = async () => {
  // 1. Calculate amount and credits
  // 2. Get user auth
  // 3. Call API
  const response = await fetch('/api/paystack/initialize', {
    method: 'POST',
    body: JSON.stringify({
      amount: amount * 100, // kobo
      email: user.email,
      reference: `credits_${selectedPackage}_...`,
      callback_url: `${window.location.origin}/dashboard/credits?payment=success`,
      metadata: { type: 'credits', credits }
    })
  })
  
  const result = await response.json()
  
  // 4. Redirect to Paystack
  if (result.data?.authorization_url) {
    window.location.href = result.data.authorization_url  // ← THIS SHOULD WORK
  }
}
```

**What to check:**
- ✅ Is `result.data?.authorization_url` present?
- ✅ Any console errors?
- ✅ Network request successful (200 OK)?

---

### 2. Backend API Endpoint
**File**: `app/api/paystack/initialize/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const { amount, email, reference, callback_url, metadata } = await request.json()
  
  // Call Paystack library
  const result = await initializePayment({
    amount,
    email,
    reference,
    callback_url,
    metadata
  })
  
  // Return authorization URL
  return NextResponse.json({
    success: true,
    data: {
      ...result.data,  // ← authorization_url should be here
      authorization_url: result.data.authorization_url
    }
  })
}
```

**What to check:**
- ✅ `PAYSTACK_SECRET_KEY` environment variable exists
- ✅ Paystack API response structure
- ✅ Error handling for failed requests

---

### 3. Paystack Library
**File**: `lib/paystack-enhanced.ts` (Lines 85-157)

```typescript
export async function initializePayment(data: PaymentData) {
  // Convert to kobo
  const amountInKobo = Math.round(data.amount * 100)
  
  // Call Paystack
  const response = await paystack.transaction.initialize({
    amount: amountInKobo,
    email: data.email,
    reference: data.reference,
    callback_url: data.callback_url,
    metadata: data.metadata
  })
  
  // Return response
  return {
    success: true,
    data: response.data  // ← authorization_url in response.data
  }
}
```

**What to check:**
- ✅ Paystack npm package installed
- ✅ Paystack secret key valid
- ✅ Paystack API returns correct structure

---

## 🔧 Debugging Commands

### Check Environment Variables
```bash
# In Netlify Dashboard:
# Site Settings → Environment Variables
# Look for: PAYSTACK_SECRET_KEY
```

### Test API Directly (Local)
```bash
curl -X POST http://localhost:3000/api/paystack/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500000,
    "email": "test@example.com",
    "reference": "test_123"
  }'
```

### Browser Console Check
```javascript
// Open DevTools Console, then click "Purchase Credits"
// Look for:
console.log('Response:', result)
console.log('Auth URL:', result.data?.authorization_url)
```

---

## 🐛 Common Issues

### Issue 1: `authorization_url` is undefined
**Cause**: Paystack API not returning URL
**Fix**: Check Paystack secret key and API response

### Issue 2: Redirect not working
**Cause**: Browser blocking or CORS issue
**Fix**: Use `window.location.href` (already implemented)

### Issue 3: API returns 401/403
**Cause**: Missing or invalid Paystack secret key
**Fix**: Verify `PAYSTACK_SECRET_KEY` in environment variables

### Issue 4: Network error
**Cause**: CORS or network connectivity
**Fix**: Check Netlify function logs and network tab

---

## 📊 Expected Response Structure

### Successful Response
```json
{
  "success": true,
  "data": {
    "authorization_url": "https://paystack.com/pay/abc123...",
    "access_code": "abc123...",
    "reference": "credits_basic_..."
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message here",
  "shouldRetry": false
}
```

---

## 🔗 Related Files

1. **Frontend**: `app/dashboard/credits/page.tsx`
2. **API**: `app/api/paystack/initialize/route.ts`
3. **Library**: `lib/paystack-enhanced.ts`
4. **Verification**: `app/api/paystack/verify/route.ts`
5. **Webhook**: `app/api/payments/webhook/route.ts`

---

## ✅ Quick Fixes to Try

1. **Add Console Logs**
   ```typescript
   console.log('Full response:', result)
   console.log('Authorization URL:', result.data?.authorization_url)
   ```

2. **Add Error Handling**
   ```typescript
   if (!result.success) {
     console.error('Payment failed:', result.error)
     toast({ title: 'Error', description: result.error })
     return
   }
   ```

3. **Verify Environment Variable**
   ```typescript
   // In route.ts, add:
   if (!process.env.PAYSTACK_SECRET_KEY) {
     return NextResponse.json({ error: 'Paystack not configured' }, { status: 500 })
   }
   ```

---

**Last Updated**: Payment button fix implementation

