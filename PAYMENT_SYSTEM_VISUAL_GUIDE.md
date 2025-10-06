# Payment System - Visual Guide 🎨

## 📍 User Journey Maps

### 1. Credit Purchase Journey

```
┌─────────────────────────────────────────────────────────────┐
│                    USER WANTS TO BOOK SESSION               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
              ┌────────────────┐
              │ Check Credits  │
              └────────┬───────┘
                       │
                 ┌─────┴─────┐
                 │           │
           No Credits    Has Credits
                 │           │
                 ↓           ↓
         ┌───────────┐  ┌──────────┐
         │  Go to    │  │   Book   │
         │  Credits  │  │ Session  │
         │   Page    │  └──────────┘
         └─────┬─────┘
               │
               ↓
      ┌────────────────┐
      │ View Packages  │
      │ • Single       │
      │ • Bronze       │
      │ • Silver       │
      │ • Gold ⭐      │
      └───────┬────────┘
              │
              ↓
      ┌────────────────┐
      │ Select Package │
      └───────┬────────┘
              │
              ↓
      ┌────────────────┐
      │ Confirm Order  │
      │ • Package Info │
      │ • Price        │
      │ • Sessions     │
      └───────┬────────┘
              │
              ↓
      ┌────────────────┐
      │ Redirect to    │
      │   Paystack     │
      └───────┬────────┘
              │
              ↓
      ┌────────────────┐
      │ Enter Payment  │
      │    Details     │
      │ • Card Number  │
      │ • CVV          │
      │ • Expiry       │
      └───────┬────────┘
              │
              ↓
      ┌────────────────┐
      │  Authenticate  │
      │  • PIN         │
      │  • OTP         │
      └───────┬────────┘
              │
              ↓
      ┌────────────────┐
      │ Payment Status │
      └───────┬────────┘
              │
        ┌─────┴─────┐
        │           │
    Success      Failed
        │           │
        ↓           ↓
┌───────────┐  ┌──────────┐
│ Credits   │  │  Retry   │
│  Added    │  │ Payment  │
│ ✅        │  │    ❌    │
└─────┬─────┘  └──────────┘
      │
      ↓
┌───────────┐
│   Book    │
│  Session  │
└───────────┘
```

---

### 2. Refund Request Journey

```
┌─────────────────────────────────────────────────────────────┐
│              USER WANTS REFUND                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
              ┌────────────────┐
              │ Go to Payment  │
              │    History     │
              └────────┬───────┘
                       │
                       ↓
              ┌────────────────┐
              │ Select Payment │
              │ Click "Refund" │
              └────────┬───────┘
                       │
                       ↓
              ┌────────────────┐
              │ Choose Reason  │
              │ • Cancelled    │
              │ • Service Issue│
              │ • Technical    │
              │ • Other        │
              └────────┬───────┘
                       │
                       ↓
              ┌────────────────┐
              │ Add Details    │
              │  (Optional)    │
              └────────┬───────┘
                       │
                       ↓
              ┌────────────────┐
              │ Submit Request │
              └────────┬───────┘
                       │
                       ↓
              ┌────────────────┐
              │ Status:        │
              │ ⏳ PENDING    │
              │ (24-48h)       │
              └────────┬───────┘
                       │
              ┌────────┴────────┐
              │                 │
              ↓                 ↓
      ┌──────────────┐  ┌──────────────┐
      │   APPROVED   │  │   REJECTED   │
      │      ✅      │  │      ❌      │
      └──────┬───────┘  └──────┬───────┘
             │                 │
             ↓                 │
      ┌──────────────┐        │
      │  Processing  │        │
      │      ⚙️      │        │
      └──────┬───────┘        │
             │                 │
             ↓                 │
      ┌──────────────┐        │
      │  COMPLETED   │        │
      │   💰 Refund  │        │
      │   to Bank    │        │
      └──────┬───────┘        │
             │                 │
             └────────┬────────┘
                      │
                      ↓
              ┌────────────────┐
              │ Notification   │
              │    Sent 📧     │
              └────────────────┘
```

---

## 🔄 System Flow Diagrams

### Payment Processing Flow

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│          │  POST   │          │ Create  │          │
│   User   ├────────→│  Next.js │────────→│ Pending  │
│          │ Initiate│   API    │ Record  │ Payment  │
└──────────┘         └─────┬────┘         └──────────┘
                           │
                           │ Call Paystack API
                           ↓
                     ┌──────────┐
                     │          │
                     │ Paystack │
                     │   API    │
                     │          │
                     └─────┬────┘
                           │
                           │ Return Payment URL
                           ↓
┌──────────┐         ┌──────────┐
│          │ Redirect│          │
│   User   │←────────┤  Next.js │
│          │         │   API    │
└─────┬────┘         └──────────┘
      │
      │ Complete Payment
      ↓
┌──────────┐
│          │
│ Paystack │
│  Portal  │
│          │
└─────┬────┘
      │
      │ Payment Success
      ↓
┌──────────┐         ┌──────────┐         ┌──────────┐
│          │ Webhook │          │ Verify  │          │
│ Paystack ├────────→│  Next.js │────────→│ Payment  │
│          │         │   API    │         │  Table   │
└──────────┘         └─────┬────┘         └──────────┘
                           │
                           │ Add Credits
                           ↓
                     ┌──────────┐
                     │          │
                     │  Credit  │
                     │  Table   │
                     │          │
                     └─────┬────┘
                           │
                           │ Send Notification
                           ↓
┌──────────┐         ┌──────────┐
│          │  Email  │          │
│   User   │←────────┤  Courier │
│          │         │          │
└──────────┘         └──────────┘
```

---

### Credit Usage Flow

```
┌──────────┐
│   USER   │
│  Books   │
│ Session  │
└─────┬────┘
      │
      ↓
┌──────────────────┐
│ Check Available  │
│    Credits       │
└────┬─────────────┘
     │
     ↓
┌─────────────┐
│ Has Credits?│
└─────┬───────┘
      │
  ┌───┴───┐
  │       │
 Yes     No
  │       │
  │       ↓
  │  ┌──────────┐
  │  │  Prompt  │
  │  │ Purchase │
  │  └──────────┘
  │
  ↓
┌──────────────┐
│ Select Best  │
│  Credit      │
│ (Free First) │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ Mark Credit  │
│  as USED     │
│ + Session ID │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ Create       │
│ Session      │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ Session      │
│ Confirmed ✅ │
└──────────────┘
```

---

### Refund Processing Flow (Admin)

```
┌─────────────────┐
│  Refund Request │
│   📝 Pending    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Admin Reviews  │
│  Request        │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
Approve    Reject
    │         │
    │         ↓
    │    ┌──────────┐
    │    │  Update  │
    │    │  Status  │
    │    │ ❌ REJECT│
    │    └─────┬────┘
    │          │
    │          ↓
    │    ┌──────────┐
    │    │  Notify  │
    │    │   User   │
    │    └──────────┘
    │
    ↓
┌──────────────┐
│ Call Paystack│
│ Refund API   │
└──────┬───────┘
       │
   ┌───┴───┐
   │       │
Success   Fail
   │       │
   │       ↓
   │  ┌────────┐
   │  │ Status │
   │  │ FAILED │
   │  └────────┘
   │
   ↓
┌──────────────┐
│ Update Status│
│ ✅ COMPLETED │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ Process      │
│ Refund Type  │
└──────┬───────┘
       │
   ┌───┴────┐
   │        │
Money    Credit
Refund   Reversal
   │        │
   │        ↓
   │   ┌────────┐
   │   │  Add   │
   │   │Credits │
   │   │  Back  │
   │   └────────┘
   │
   ↓
┌──────────────┐
│ Send Money   │
│ to Bank      │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ Notify User  │
│    📧        │
└──────────────┘
```

---

## 🗄️ Database Relationships

```
┌──────────────┐
│    USERS     │
│              │
│ • id (PK)    │
│ • email      │
│ • full_name  │
└──────┬───────┘
       │
       │ 1:N
       │
   ┌───┴────────────────────┬──────────────────┐
   │                        │                  │
   ↓                        ↓                  ↓
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   PURCHASES  │   │   PAYMENTS   │   │   REFUNDS    │
│              │   │              │   │              │
│ • id (PK)    │   │ • id (PK)    │   │ • id (PK)    │
│ • user_id FK │   │ • user_id FK │   │ • user_id FK │
│ • package    │   │ • reference  │   │ • amount     │
│ • amount     │   │ • status     │   │ • status     │
└──────┬───────┘   └──────────────┘   └──────┬───────┘
       │                                      │
       │ 1:N                                  │ 1:N
       │                                      │
       ↓                                      ↓
┌──────────────┐                     ┌──────────────┐
│   CREDITS    │                     │REFUND_HISTORY│
│              │                     │              │
│ • id (PK)    │                     │ • id (PK)    │
│ • user_id FK │                     │ • refund FK  │
│ • purchase FK│                     │ • old_status │
│ • session FK │                     │ • new_status │
│ • used_at    │                     │ • changed_by │
└──────┬───────┘                     └──────────────┘
       │
       │ N:1
       │
       ↓
┌──────────────┐
│   SESSIONS   │
│              │
│ • id (PK)    │
│ • user_id FK │
│ • credit FK  │
│ • therapist  │
└──────────────┘
```

---

## 💰 Pricing & Savings Visualization

```
Package Comparison:

Single Session (₦5,000)
├─ 1 session × ₦5,000 = ₦5,000
└─ Savings: ₦0

Bronze Pack (₦13,500) 💼
├─ 3 sessions × ₦4,500 = ₦13,500
└─ Savings: ₦1,500 (10%)

Silver Pack (₦20,000) ⭐
├─ 5 sessions × ₦4,000 = ₦20,000
└─ Savings: ₦5,000 (20%)

Gold Pack (₦28,000) 👑 BEST VALUE
├─ 8 sessions × ₦3,500 = ₦28,000
└─ Savings: ₦12,000 (30%)


Savings Chart:
₦12,000 ████████████████████████████████ Gold
₦5,000  █████████████ Silver
₦1,500  ████ Bronze
₦0      ─ Single
```

---

## 📊 Status Flow Diagrams

### Payment Status States

```
    INITIATED
        │
        ↓
    PENDING ────→ CANCELLED
        │
        ↓
  ┌─ PROCESSING
  │     │
  │     ↓
  │  SUCCESS ←──┐
  │             │
  └──→ FAILED  │
               │
            RETRY
```

### Credit Status States

```
    AVAILABLE
        │
        ↓
    RESERVED (Session Booked)
        │
        ├──→ USED (Session Completed)
        │
        └──→ RELEASED (Session Cancelled)
               │
               ↓
           AVAILABLE
```

### Refund Status States

```
    PENDING
        │
        ├──→ REJECTED
        │
        ↓
    APPROVED
        │
        ↓
    PROCESSING
        │
        ├──→ FAILED
        │      │
        │      ↓
        │   RETRY
        │
        ↓
    COMPLETED
```

---

## 🎨 UI Component Hierarchy

```
CreditPurchaseFlow
├── Package Selection
│   ├── Package Card
│   │   ├── Package Header
│   │   ├── Price Display
│   │   ├── Features List
│   │   └── Purchase Button
│   └── Best Value Badge
├── Confirmation Dialog
│   ├── Package Summary
│   ├── Price Breakdown
│   └── Action Buttons
└── Payment Processing
    ├── Loading State
    └── Error Display

PaymentHistory
├── Tabs (Payments/Refunds)
│   ├── Payments Tab
│   │   ├── Transaction Table
│   │   ├── Receipt Button
│   │   └── Refund Button
│   └── Refunds Tab
│       └── Refund Table
└── Refund Dialog
    ├── Reason Selector
    ├── Details Input
    └── Submit Button

RefundManagement (Admin)
├── Statistics Cards
│   ├── Pending Count
│   ├── Processing Count
│   ├── Completed Count
│   └── Rejected Count
├── Refund Table
│   ├── Filter Tabs
│   ├── Refund Rows
│   └── Action Buttons
├── Details Dialog
│   ├── User Info
│   ├── Payment Info
│   └── Refund Details
└── Reject Dialog
    └── Reason Input
```

---

## 🔔 Notification Flow

```
Payment Successful:
User → Payment Complete → Paystack Webhook
                             ↓
                        Next.js API
                             ↓
                      ┌──────┴──────┐
                      │             │
                  Database      Courier
                      │             │
                Credits Added    Email Sent
                             ↓
                           USER
                    ✉️ "Payment Successful"

Refund Approved:
Admin → Approve Refund → API Route
                             ↓
                        Paystack
                             ↓
                        Processing
                             ↓
                      ┌──────┴──────┐
                      │             │
                  Database      Courier
                      │             │
                Status Updated   Email Sent
                             ↓
                           USER
                    ✉️ "Refund Processed"
```

---

## 🚀 Deployment Pipeline

```
Development
    │
    ├─ Run Tests
    ├─ Check Lints
    └─ Build
        │
        ↓
Staging
    │
    ├─ Deploy DB Schema
    ├─ Set Environment
    ├─ Test Payments
    └─ Verify Webhooks
        │
        ↓
Production
    │
    ├─ Database Backup
    ├─ Deploy Code
    ├─ Smoke Tests
    └─ Monitor
        │
        ↓
    Live! 🎉
```

---

**Pro Tip:** Keep this visual guide handy when explaining the system to new team members or debugging issues!

**Version:** 1.0.0  
**Last Updated:** October 1, 2025

