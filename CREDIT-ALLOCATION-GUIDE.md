# Credit Allocation Guide

## Ideal Credit Allocation Strategy

### ✅ **RECOMMENDED: ONE Record Per User**

**Best Practice:**
- **ONE record per user** with `user_type = 'user'`
- All credits consolidated into a single record
- This is what your consolidation script does

**Benefits:**
- ✅ Simple queries (no SUM needed)
- ✅ Consistent balance (no duplicates)
- ✅ Faster performance (one record lookup)
- ✅ Works seamlessly with booking function
- ✅ Easier to maintain and debug

**Schema:**
```sql
-- Each user should have ONE record like this:
user_id: <uuid>
user_type: 'user'  -- Always 'user' (not 'individual')
credits_balance: 20  -- Total credits
credits_purchased: 20
credits_used: 0
```

### ❌ **NOT RECOMMENDED: Multiple Records**

**Problems with multiple records:**
- ❌ Requires SUM operations everywhere
- ❌ Can create duplicate records
- ❌ Balance can fluctuate
- ❌ More complex queries
- ❌ Harder to debug

## Current Implementation

### Booking Function Logic:
1. **Credit Check**: Prefers `user_type = 'user'`, falls back to `'individual'`
2. **Credit Deduction**: Deducts from the SAME record that was checked
3. **Consistency**: Uses same selection logic for both check and deduction

### API Routes:
- `/api/sessions/book` - Sums all credits from both types
- `/api/credits/user` - Sums all credits for display
- Both handle consolidated records properly

## Migration Strategy

### For Existing Users:
1. ✅ Run consolidation script (already done)
2. ✅ Ensures ONE record with `user_type = 'user'`
3. ✅ All credits summed into single record

### For New Users:
- Always create credits with `user_type = 'user'`
- Never create `user_type = 'individual'` records

## Summary

**Ideal State:**
```
One user = One credit record with user_type = 'user'
```

**Current Fix:**
- Booking function now prefers 'user' type
- Falls back to 'individual' for backward compatibility
- Works with both consolidated and legacy records

**Next Steps:**
1. Run `fix-booking-function-credit-sum.sql` in Supabase
2. This updates the booking function to prefer 'user' type
3. Booking should work correctly now

