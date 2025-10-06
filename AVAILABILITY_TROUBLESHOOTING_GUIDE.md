# Availability System Troubleshooting Guide

## 🚨 Common Issues & Solutions

### Issue 1: Availability Clears After Reload

**Symptoms:**
- Set availability, save successfully
- Reload page, availability is gone
- Shows default Monday-Friday schedule

**Root Causes:**
1. Database tables not created
2. Migration not run
3. Therapist ID mismatch
4. API authentication issues

**Solutions:**

#### Step 1: Check Database Schema
```sql
-- Check if new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('availability_templates', 'availability_overrides');

-- Check if tables have data
SELECT COUNT(*) FROM availability_templates;
SELECT COUNT(*) FROM availability_overrides;
```

#### Step 2: Run Database Migration
```bash
# Run the schema creation
psql -d your_database -f create-scalable-availability-schema.sql

# Run the data migration
psql -d your_database -f migrate-availability-to-templates.sql
```

#### Step 3: Check Therapist ID
```javascript
// In browser console, check therapist info
console.log('Therapist ID:', therapistInfo?.id)
console.log('Therapist Email:', therapistInfo?.email)
```

#### Step 4: Test API Endpoints
```bash
# Test template API
curl "http://localhost:3000/api/therapist/availability/template?therapist_id=YOUR_THERAPIST_ID"

# Test generation API
curl "http://localhost:3000/api/therapist/availability/generate?therapist_id=YOUR_THERAPIST_ID&start_date=2024-01-15&end_date=2024-01-21"
```

### Issue 2: Booking System Shows No Available Slots

**Symptoms:**
- Therapist sets availability successfully
- Booking system shows "No Available Slots"
- Error in browser console

**Root Causes:**
1. Booking system using old API
2. Generation API not working
3. Date format issues
4. Therapist ID mismatch

**Solutions:**

#### Step 1: Check Booking System API
The booking system should use:
```javascript
// NEW (correct)
const response = await fetch(
  `/api/therapist/availability/generate?therapist_id=${therapistId}&start_date=${startDate}&end_date=${endDate}`
)

// OLD (incorrect)
const response = await fetch(`/api/availability?therapistId=${therapistId}&daysAhead=7`)
```

#### Step 2: Verify Generation API
```javascript
// Test in browser console
const testGeneration = async () => {
  const today = new Date().toISOString().split('T')[0]
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const endDate = nextWeek.toISOString().split('T')[0]
  
  const response = await fetch(
    `/api/therapist/availability/generate?therapist_id=YOUR_THERAPIST_ID&start_date=${today}&end_date=${endDate}`
  )
  const data = await response.json()
  console.log('Generation API response:', data)
}
```

### Issue 3: Save Button Not Working

**Symptoms:**
- Click save, nothing happens
- No success/error message
- Console shows errors

**Root Causes:**
1. Missing therapist ID
2. API authentication failure
3. Network errors
4. Invalid data format

**Solutions:**

#### Step 1: Check Console Logs
Look for these debug messages:
```
💾 Starting save process...
💾 Therapist ID: [should show ID]
💾 Template data to save: [should show data]
💾 Save response status: [should show 200]
✅ Save successful: [should show response]
```

#### Step 2: Check Network Tab
1. Open browser DevTools
2. Go to Network tab
3. Click save button
4. Look for POST request to `/api/therapist/availability/template`
5. Check request payload and response

#### Step 3: Verify Authentication
```javascript
// Check if user is authenticated
console.log('User session:', session)
console.log('User type:', session?.user?.user_type)
```

### Issue 4: Templates Not Loading

**Symptoms:**
- Page loads with default schedule
- No templates loaded from database
- Console shows API errors

**Root Causes:**
1. Database connection issues
2. RLS policies blocking access
3. Invalid therapist ID
4. API endpoint errors

**Solutions:**

#### Step 1: Check Database Connection
```sql
-- Test database connection
SELECT NOW();

-- Check if therapist exists
SELECT id, email, user_type FROM users WHERE user_type = 'therapist' LIMIT 5;
```

#### Step 2: Check RLS Policies
```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('availability_templates', 'availability_overrides');
```

#### Step 3: Test API Directly
```bash
# Test with curl
curl -H "Content-Type: application/json" \
  "http://localhost:3000/api/therapist/availability/template?therapist_id=YOUR_THERAPIST_ID"
```

### Issue 5: Overrides Not Saving

**Symptoms:**
- Set date override, save successfully
- Override doesn't appear in calendar
- Override not applied to booking

**Root Causes:**
1. Invalid date format
2. Override API errors
3. Generation API not using overrides
4. Database constraint violations

**Solutions:**

#### Step 1: Check Date Format
```javascript
// Ensure date is in YYYY-MM-DD format
const date = new Date().toISOString().split('T')[0]
console.log('Date format:', date) // Should be "2024-01-15"
```

#### Step 2: Check Override API
```javascript
// Test override creation
const testOverride = async () => {
  const response = await fetch('/api/therapist/availability/override', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      therapist_id: 'YOUR_THERAPIST_ID',
      override_date: '2024-01-20',
      is_available: false,
      reason: 'vacation'
    })
  })
  const data = await response.json()
  console.log('Override response:', data)
}
```

## 🔧 Debug Commands

### Database Debug
```sql
-- Check all availability data
SELECT 
  'templates' as type,
  therapist_id,
  day_of_week,
  start_time,
  end_time,
  is_active
FROM availability_templates
UNION ALL
SELECT 
  'overrides' as type,
  therapist_id,
  NULL as day_of_week,
  start_time,
  end_time,
  is_available as is_active
FROM availability_overrides
ORDER BY therapist_id, type;

-- Test generation function
SELECT * FROM generate_availability_slots(
  'YOUR_THERAPIST_ID'::uuid,
  '2024-01-15'::date,
  '2024-01-21'::date
);
```

### API Debug
```javascript
// Test all endpoints
const testAllEndpoints = async (therapistId) => {
  const today = new Date().toISOString().split('T')[0]
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const endDate = nextWeek.toISOString().split('T')[0]
  
  console.log('Testing endpoints for therapist:', therapistId)
  
  // Test template API
  try {
    const templateResponse = await fetch(`/api/therapist/availability/template?therapist_id=${therapistId}`)
    const templateData = await templateResponse.json()
    console.log('✅ Template API:', templateData)
  } catch (error) {
    console.log('❌ Template API error:', error)
  }
  
  // Test generation API
  try {
    const genResponse = await fetch(`/api/therapist/availability/generate?therapist_id=${therapistId}&start_date=${today}&end_date=${endDate}`)
    const genData = await genResponse.json()
    console.log('✅ Generation API:', genData)
  } catch (error) {
    console.log('❌ Generation API error:', error)
  }
  
  // Test override API
  try {
    const overrideResponse = await fetch(`/api/therapist/availability/override?therapist_id=${therapistId}`)
    const overrideData = await overrideResponse.json()
    console.log('✅ Override API:', overrideData)
  } catch (error) {
    console.log('❌ Override API error:', error)
  }
}
```

## 📋 Checklist for New Installation

### Database Setup
- [ ] Run `create-scalable-availability-schema.sql`
- [ ] Run `migrate-availability-to-templates.sql`
- [ ] Verify tables exist: `availability_templates`, `availability_overrides`
- [ ] Check indexes are created
- [ ] Verify RLS policies are active

### API Testing
- [ ] Template API responds correctly
- [ ] Generation API returns slots
- [ ] Override API allows CRUD operations
- [ ] Authentication works for all endpoints

### Frontend Testing
- [ ] Weekly schedule loads existing templates
- [ ] Save button works and persists data
- [ ] Override calendar displays correctly
- [ ] Booking system shows available slots
- [ ] Page reload preserves saved data

### Integration Testing
- [ ] Set availability, verify it appears in booking
- [ ] Create override, verify it affects booking
- [ ] Book session, verify slot becomes unavailable
- [ ] Test with multiple therapists

## 🆘 Emergency Rollback

If the new system causes issues, you can temporarily rollback:

### 1. Revert Frontend Components
```bash
# Restore old availability-schedule.tsx
git checkout HEAD~1 -- components/availability-schedule.tsx

# Restore old booking-step-3.tsx
git checkout HEAD~1 -- components/booking-step-3.tsx
```

### 2. Keep Old API Running
The old `/api/therapist/availability` endpoint should still work alongside the new system.

### 3. Database Rollback
```sql
-- Drop new tables (only if needed)
DROP TABLE IF EXISTS availability_overrides;
DROP TABLE IF EXISTS availability_templates;

-- The old therapist_availability table should still exist
```

## 📞 Getting Help

If you're still having issues:

1. **Check the console logs** - Look for the debug messages we added
2. **Test the APIs directly** - Use the debug commands above
3. **Verify database setup** - Run the SQL queries to check data
4. **Check network requests** - Use browser DevTools Network tab

The system is designed to be robust and provide clear error messages. Most issues are related to:
- Database not being set up correctly
- Therapist ID mismatches
- API authentication problems
- Date format issues

Follow the solutions above step by step, and the system should work perfectly! 🚀
