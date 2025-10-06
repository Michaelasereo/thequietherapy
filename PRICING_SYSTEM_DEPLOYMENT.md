# 🚀 Pricing System Deployment Guide

## Overview
This guide will help you deploy the "First Hit Free" + Pay-as-you-go pricing system with bulk discounts for your therapy platform.

## 📋 Pre-Deployment Checklist

### Environment Variables Required
Add these to your `.env.local` file:

```env
# Paystack Configuration (Get from https://dashboard.paystack.com/)
PAYSTACK_SECRET_KEY=sk_test_xxxxx  # Use sk_live_xxxxx for production
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx  # Use pk_live_xxxxx for production

# Your app URL (for payment callbacks)
NEXT_PUBLIC_APP_URL=http://localhost:3001  # Update for production
```

### 1. Database Schema Deployment

**Step 1: Deploy Main Pricing Schema**
```bash
# Run the main pricing system schema
psql -h your-db-host -U your-username -d your-database -f create-pricing-system-schema.sql
```

**Step 2: Deploy Payment Tables**
```bash
# Add payment tracking tables
psql -h your-db-host -U your-username -d your-database -f add-payment-tables.sql
```

**Step 3: Verify Deployment**
```sql
-- Check that all tables were created
SELECT tablename FROM pg_tables 
WHERE tablename IN (
    'user_purchases',
    'user_session_credits', 
    'package_definitions',
    'partner_credits',
    'pending_payments'
);

-- Verify package definitions
SELECT * FROM package_definitions ORDER BY sort_order;
```

### 2. API Endpoints Deployment

**Update your existing booking API:**
- Replace `/app/api/sessions/book/route.ts` with `/app/api/sessions/book/route-with-credits.ts`
- Or manually integrate the credit checking logic

**New API endpoints to deploy:**
- ✅ `/app/api/packages/route.ts` - Package listings
- ✅ `/app/api/user/credits/route.ts` - User credit balance
- ✅ `/app/api/payments/initiate/route.ts` - Payment initiation
- ✅ `/app/api/payments/webhook/route.ts` - Payment webhooks

### 3. UI Components Deployment

**New components:**
- ✅ `components/ui/pricing-card.tsx` - Pricing display cards
- ✅ `components/user-credits-display.tsx` - Credit balance display
- ✅ `app/dashboard/continue-journey/page.tsx` - Post-session upsell page

**Update existing dashboard:**
```tsx
// Add to your main dashboard
import { UserCreditsDisplay } from "@/components/user-credits-display"

// In your dashboard component:
<UserCreditsDisplay className="mb-6" />
```

## 🎯 Pricing Strategy Implementation

### The Funnel Structure

| Package | Sessions | Price | Duration | Savings | Target |
|---------|----------|-------|----------|---------|--------|
| **Free Signup** | 1 | ₦0 | 25 min | - | New user acquisition |
| **Pay-as-you-go** | 1 | ₦5,000 | 35 min | - | Occasional users |
| **Bronze Pack** | 3 | ₦13,500 | 35 min | ₦1,500 | Getting started |
| **Silver Pack** | 5 | ₦20,000 | 35 min | ₦5,000 | Regular therapy |
| **Gold Pack** | 8 | ₦28,000 | 35 min | ₦12,000 | Committed healing |

### User Journey Flow

1. **Signup** → Auto-granted 1 free 25-minute session
2. **First Session** → Complete free session
3. **Post-Session** → Redirect to `/dashboard/continue-journey`
4. **Purchase** → Choose package → Paystack payment
5. **Credits Added** → Can book longer 35-minute sessions
6. **Repeat** → Continue therapy journey

## 🔧 Configuration & Testing

### 1. Test the Complete Flow

```bash
# Start your development server
npm run dev

# Test user journey:
# 1. Sign up new user → Should get 1 free credit
# 2. Book session → Should use free credit (25 min)
# 3. Complete session → Should redirect to continue-journey
# 4. Purchase package → Should add credits
# 5. Book next session → Should use paid credit (35 min)
```

### 2. Paystack Webhook Setup

**In Paystack Dashboard:**
1. Go to Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/payments/webhook`
3. Select events: `charge.success`, `charge.failed`
4. Save webhook

**Test webhook locally:**
```bash
# Use ngrok to expose local server
npx ngrok http 3001

# Update webhook URL to: https://xxxxx.ngrok.io/api/payments/webhook
```

### 3. Database Maintenance

**Set up automatic cleanup (optional):**
```sql
-- Clean up old pending payments daily
SELECT cron.schedule('cleanup-payments', '0 2 * * *', 'SELECT cleanup_old_pending_payments();');
```

## 🎨 UI Customization

### Pricing Page Customization

Edit `/app/dashboard/continue-journey/page.tsx`:

```tsx
// Customize colors, text, or add Nigerian-specific elements
const nigerianPaymentMethods = ['card', 'bank', 'ussd', 'mobile_money']

// Add testimonials or success stories
const testimonials = [
  { name: "Adaora", text: "Therapy changed my life!" },
  // ... more testimonials
]
```

### Dashboard Integration

Add credits display anywhere in your app:
```tsx
import { CompactCreditsDisplay } from "@/components/user-credits-display"

// Compact version for header/navbar
<CompactCreditsDisplay />

// Full version for dashboard
<UserCreditsDisplay />
```

## 🔒 Security Considerations

### 1. Paystack Webhook Security
- ✅ Webhook signature verification implemented
- ✅ Payment amount verification
- ✅ Duplicate payment prevention

### 2. Credit System Security
- ✅ Server-side credit validation
- ✅ Database constraints prevent negative credits
- ✅ Atomic transactions for credit usage

### 3. API Security
- ✅ All endpoints use `requireApiAuth()`
- ✅ User isolation (can't access other's credits)
- ✅ Input validation on all endpoints

## 📊 Monitoring & Analytics

### Key Metrics to Track

```sql
-- Daily signups with free credits
SELECT DATE(created_at), COUNT(*) 
FROM user_purchases 
WHERE package_type = 'signup_free' 
GROUP BY DATE(created_at);

-- Conversion from free to paid
SELECT 
    COUNT(DISTINCT CASE WHEN package_type = 'signup_free' THEN user_id END) as free_users,
    COUNT(DISTINCT CASE WHEN package_type != 'signup_free' THEN user_id END) as paying_users
FROM user_purchases;

-- Popular packages
SELECT package_type, COUNT(*), SUM(amount_paid)/100 as total_revenue_naira
FROM user_purchases 
WHERE package_type != 'signup_free'
GROUP BY package_type;

-- Session completion rates
SELECT 
    is_free_session,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as completion_rate
FROM sessions 
GROUP BY is_free_session;
```

### Revenue Tracking Dashboard

Create a simple admin dashboard to track:
- Daily/Monthly revenue
- Package popularity
- Free to paid conversion rates
- Session completion rates
- Credit usage patterns

## 🚨 Troubleshooting

### Common Issues

**1. Credits not granted on signup**
```sql
-- Check if trigger is working
SELECT * FROM user_purchases WHERE package_type = 'signup_free' LIMIT 5;

-- Manually grant credit if needed
SELECT grant_signup_credit('user-uuid-here');
```

**2. Payment webhook not working**
- Check webhook URL is accessible
- Verify Paystack secret key
- Check server logs for webhook errors
- Test with Paystack webhook tester

**3. Session booking fails**
```sql
-- Check user's available credits
SELECT * FROM get_available_credits('user-uuid-here');

-- Check if credits exist but are expired
SELECT * FROM user_session_credits WHERE user_id = 'user-uuid-here';
```

**4. Wrong session duration**
- Free sessions should be 25 minutes
- Paid sessions should be 35 minutes
- Check `planned_duration_minutes` in sessions table

## 🎉 Go-Live Checklist

- [ ] Database schema deployed
- [ ] Environment variables set (production Paystack keys)
- [ ] Webhook URL configured in Paystack
- [ ] All API endpoints deployed
- [ ] UI components integrated
- [ ] Payment flow tested end-to-end
- [ ] Free signup credit working
- [ ] Session duration logic correct
- [ ] Monitoring/analytics set up
- [ ] Customer support prepared for payment questions

## 📈 Optimization Tips

### Conversion Optimization
1. **A/B test the continue-journey page** - Try different messaging
2. **Add urgency** - "Limited time offer" for packages
3. **Social proof** - Add testimonials from successful users
4. **Progress indicators** - Show healing journey progress

### Nigerian Market Specific
1. **Payment methods** - Ensure bank transfer, USSD options
2. **Pricing psychology** - Test ₦4,999 vs ₦5,000
3. **Local testimonials** - Use Nigerian names and contexts
4. **Mobile optimization** - Most users will be on mobile

### Technical Optimization
1. **Cache package definitions** - Reduce DB queries
2. **Batch credit operations** - For bulk purchases
3. **Optimize webhook processing** - Handle high payment volumes
4. **Monitor database performance** - Index optimization

---

## 🎯 Success Metrics

**Target KPIs:**
- **Free to Paid Conversion:** 15-25%
- **Average Revenue Per User:** ₦15,000-25,000
- **Session Completion Rate:** >85%
- **Customer Lifetime Value:** 5-8 sessions average

Your pricing system is now ready to drive sustainable revenue while providing value to users! 🚀
