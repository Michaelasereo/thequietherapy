# Support Page Flow Diagram & Architecture

## Current Implementation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        SUPPORT PAGE                            │
│                     (app/support/page.tsx)                     │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MOCK DATA DISPLAY                          │
│  • fundraisingData.raised = 125,000 (STATIC)                  │
│  • Progress Bar = 0.1% (STATIC - 120M target)                 │
│  • Donor Count = 47 (STATIC)                                  │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    USER DONATION FLOW                          │
│  1. User selects amount (₦5,000 - ₦100,000 or custom)         │
│  2. User enters name & email                                   │
│  3. Clicks "Donate" button                                     │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                PAYMENT INITIATION                              │
│         (/api/donations/initiate/route.ts)                     │
│  • Validates input                                             │
│  • Converts NGN to kobo                                        │
│  • Creates Paystack reference                                  │
│  • Stores in donations table (status: 'pending')              │
│  • Returns Paystack payment URL                               │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PAYSTACK PAYMENT                             │
│  • User redirected to Paystack                                │
│  • User completes payment                                      │
│  • Paystack processes payment                                  │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                  WEBHOOK PROCESSING                            │
│            (/api/payments/webhook/route.ts)                    │
│  • Paystack sends webhook on payment success                  │
│  • Verifies webhook signature                                 │
│  • Updates donation status to 'success'                       │
│  • Processes payment in database                              │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE UPDATE                             │
│  • donations.status = 'success'                               │
│  • payment records created                                     │
│  • Transaction completed                                       │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                 ❌ MISSING REAL-TIME UPDATE                    │
│  • Progress bar still shows 125,000 (STATIC)                  │
│  • No API to fetch live donation totals                       │
│  • No polling mechanism                                        │
│  • User can't see their donation reflected                    │
└─────────────────────────────────────────────────────────────────┘
```

## Proposed Real-Time Update Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        SUPPORT PAGE                            │
│                     (app/support/page.tsx)                     │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                  LIVE DATA FETCHING                            │
│  • useEffect hook with polling                                │
│  • Fetches from /api/donations/stats every 30s                │
│  • Updates fundraisingData state                              │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              LIVE DONATION STATS API                           │
│            (/api/donations/stats/route.ts)                     │
│  • Queries donations table                                     │
│  • Sums successful donations                                   │
│  • Counts donors                                               │
│  • Returns live totals                                         │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REAL-TIME DISPLAY                           │
│  • Progress bar updates with live data                        │
│  • Donor count increases                                       │
│  • Amount raised reflects new donations                       │
│  • Users see immediate impact                                  │
└─────────────────────────────────────────────────────────────────┘
```

## State Management Flow

### Current State (STATIC):
```javascript
const fundraisingData = {
  target: 5000000,    // Static
  raised: 125000,     // Static - NEVER UPDATES
  donors: 47,         // Static - NEVER UPDATES
  daysLeft: 45        // Static
}
```

### Proposed State (DYNAMIC):
```javascript
const [fundraisingData, setFundraisingData] = useState({
  target: 120000000,  // Static - Updated to 120M
  raised: 0,          // Dynamic - UPDATES FROM API
  donors: 0,          // Dynamic - UPDATES FROM API
  daysLeft: 45        // Static
})

// Real-time updates
useEffect(() => {
  const fetchLiveData = async () => {
    const response = await fetch('/api/donations/stats')
    const liveData = await response.json()
    setFundraisingData(prev => ({
      ...prev,
      raised: liveData.totalRaised,
      donors: liveData.donorCount
    }))
  }
  
  fetchLiveData()
  const interval = setInterval(fetchLiveData, 30000)
  return () => clearInterval(interval)
}, [])
```

## Database Schema Impact

### Current Donations Table:
```sql
CREATE TABLE donations (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    donor_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    amount_kobo INTEGER NOT NULL,
    paystack_reference VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',  -- KEY: Updates to 'success'
    donation_type VARCHAR(50) DEFAULT 'seed_funding',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE
);
```

### Live Stats Query:
```sql
-- For /api/donations/stats endpoint
SELECT 
    SUM(amount) as total_raised,
    COUNT(*) as donor_count,
    AVG(amount) as average_donation
FROM donations 
WHERE status = 'success' 
AND donation_type = 'seed_funding';
```

## Payment Processing Timeline

```
Time: 0s    User clicks "Donate ₦10,000"
Time: 1s    API call to /api/donations/initiate
Time: 2s    Database: INSERT donation (status: 'pending')
Time: 3s    Redirect to Paystack payment page
Time: 30s   User completes payment on Paystack
Time: 31s   Paystack sends webhook to /api/payments/webhook
Time: 32s   Database: UPDATE donation (status: 'success')
Time: 33s   ✅ Payment processed successfully

❌ PROBLEM: Support page still shows old data
❌ SOLUTION: Real-time polling updates progress bar
```

## Implementation Checklist

### ✅ Already Implemented:
- [x] Donation form UI
- [x] Payment initiation API
- [x] Paystack integration
- [x] Webhook processing
- [x] Database storage
- [x] Payment verification

### ❌ Missing Implementation:
- [ ] Live donation stats API endpoint
- [ ] Real-time polling mechanism
- [ ] Progress bar dynamic updates
- [ ] State management for live data
- [ ] Error handling for API failures
- [ ] Loading states for data fetching

### 🔧 Required Files:
1. `/api/donations/stats/route.ts` - Live stats API
2. Update `app/support/page.tsx` - Add real-time polling
3. Update progress bar to use live data
4. Add error handling and loading states

## Performance Considerations

### Current Issues:
- Static data means no database queries (good for performance)
- But no real-time updates (bad for user experience)

### Proposed Solution:
- Polling every 30 seconds (reasonable load)
- Cache API responses for 10 seconds
- Use React.memo for performance optimization
- Implement loading states

### Database Optimization:
```sql
-- Add index for faster queries
CREATE INDEX idx_donations_status_type 
ON donations(status, donation_type);

-- Optimized stats query
SELECT 
    SUM(amount) as total_raised,
    COUNT(*) as donor_count
FROM donations 
WHERE status = 'success' 
AND donation_type = 'seed_funding'
AND created_at >= NOW() - INTERVAL '90 days'; -- Recent donations only

-- Note: Target updated to ₦120,000,000 (120 million Naira)
```

## Security & Validation

### Current Security:
- ✅ Paystack signature verification
- ✅ Input validation
- ✅ Database transaction handling

### Additional Security for Live API:
- Rate limiting (max 60 requests/minute per IP)
- API authentication (optional)
- Input sanitization
- SQL injection prevention
- CORS configuration

---

This analysis shows that while the payment processing is solid, the real-time updates are completely missing, which significantly impacts user experience and campaign effectiveness.
