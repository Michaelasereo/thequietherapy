# Booking Methods Comparison

## 🔍 **Two Different Booking Methods**

### **Method 1: Old Method (route-with-credits.ts)** 
**Status:** Uses different credit system (`user_session_credits`)

**How it works:**
1. Uses `get_available_credits()` RPC function
2. Checks `user_session_credits` table (wallet-based credits)
3. Creates session directly in API route
4. Uses `use_credit()` RPC function to mark credit as used
5. No AvailabilityManager check
6. Simple conflict check

**Pros:**
- ✅ Simpler logic
- ✅ No AvailabilityManager dependency
- ✅ Direct session creation

**Cons:**
- ❌ Not atomic (session created, then credit used - can fail between steps)
- ❌ Uses different credit table (`user_session_credits` vs `user_credits`)
- ❌ Less robust for concurrent bookings

---

### **Method 2: Current Method (route.ts)**
**Status:** Currently deployed, uses `user_credits` table

**How it works:**
1. Checks `user_credits` table directly (balance-based)
2. Uses AvailabilityManager for comprehensive checks
3. Uses `create_session_with_credit_deduction()` atomic database function
4. Everything happens in one atomic transaction

**Pros:**
- ✅ Atomic operation (session + credit deduction in one transaction)
- ✅ More robust for concurrent bookings
- ✅ Comprehensive availability checks
- ✅ Uses current `user_credits` table

**Cons:**
- ❌ More complex
- ❌ Requires AvailabilityManager (which checks `therapist_states` - now fixed)
- ❌ Requires database function to be updated

---

## 🎯 **Which Method Was Working?**

Based on the codebase:
- **Current system** uses `user_credits` table (balance-based)
- **Old method** uses `user_session_credits` table (wallet-based)

**If booking was working before:**
- It was likely using the **current method** (`route.ts`) with `user_credits` table
- The issue is that the **database function** (`create_session_with_credit_deduction`) hasn't been updated yet
- The AvailabilityManager was also checking non-existent `therapist_states` table (now fixed)

---

## ✅ **Solution**

**The current method SHOULD work** after:
1. ✅ Run `fix-booking-function-credit-sum.sql` in Supabase (update database function)
2. ✅ Run `fix-therapist-status-booking.sql` in Supabase (fix therapist status)
3. ✅ Deploy updated code (AvailabilityManager fix already done)

**The current method is better** because:
- Atomic transactions
- Better concurrency handling
- Uses the correct `user_credits` table

---

## 🔄 **If You Want to Use Old Method**

If you want to switch back to the old method (`route-with-credits.ts`):
1. You'd need to use `user_session_credits` table instead of `user_credits`
2. You'd need to ensure `get_available_credits` and `use_credit` RPC functions exist
3. Less robust for concurrent bookings

**Recommendation:** Stick with current method and fix the database function.

