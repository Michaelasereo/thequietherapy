# Therapist Scheduling Feature - Setup Guide

## 🎯 Overview
This guide will help you set up the database for the therapist scheduling feature where therapists can schedule follow-up sessions directly for their clients.

---

## ✅ STEP 1: Run the Database Migration

### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `/Users/macbook/Desktop/trpi-app/add-therapist-scheduling-columns.sql`
4. Copy ALL the SQL code
5. Paste it into the Supabase SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Wait for "Success. No rows returned" message

### Option B: Using Supabase CLI
```bash
supabase db push --file add-therapist-scheduling-columns.sql
```

---

## 📋 What This Migration Does

### Adds Missing Columns to `sessions` Table:
1. ✅ `scheduled_date` (DATE) - For easy date filtering
2. ✅ `scheduled_time` (TIME) - For time-based queries
3. ✅ `title` (VARCHAR) - Session title/name
4. ✅ `description` (TEXT) - Session description
5. ✅ `duration_minutes` (INTEGER) - Alternate duration field
6. ✅ `credit_used_id` (UUID) - Tracks which credit was used
7. ✅ `scheduled_by_therapist` (BOOLEAN) - Marks therapist-scheduled sessions

### Creates Auto-sync Trigger:
- Automatically syncs `start_time` ↔ `scheduled_date`/`scheduled_time`
- Syncs `duration` ↔ `duration_minutes`
- Ensures data consistency

### Adds Performance Indexes:
- Faster queries for therapist's sessions by date
- Optimized credit tracking lookups

---

## 🧪 STEP 2: Verify the Migration

After running the migration, verify it worked:

```sql
-- Run this in Supabase SQL Editor
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sessions' 
AND column_name IN (
  'scheduled_date', 
  'scheduled_time', 
  'title', 
  'description',
  'duration_minutes',
  'credit_used_id',
  'scheduled_by_therapist'
)
ORDER BY column_name;
```

You should see all 7 columns listed. If you see them, **you're good to go!**

---

## 🚀 STEP 3: Test the Feature

### 1. **Complete a Session with a Patient**
   - Book a regular session as a patient
   - Complete the video call
   - Fill out the post-session review

### 2. **Schedule Next Session**
   - After completing the review, click **"Schedule Next Session"**
   - Select the patient, date, time, and duration
   - Add optional notes
   - Click "Schedule Session"

### 3. **Verify on Patient Dashboard**
   - Log in as the patient
   - Check the dashboard for upcoming sessions
   - The therapist-scheduled session should appear with a "💳 Credit Required" badge

### 4. **Patient Joins Session**
   - Patient clicks "Join Session"
   - System automatically deducts 1 credit
   - If no credits available, shows error

---

## 🔧 Fixes Applied

### API Updates:
1. ✅ `/api/therapist/schedule-next-session` - Now uses correct column names
2. ✅ `/api/therapist/clients` - Fixed user_type filter (supports 'individual')
3. ✅ Time formatting - Uses GMT+1 timezone like existing booking flow

### UI Updates:
1. ✅ Post-session modal shows "Schedule Next Session" button for therapists
2. ✅ Calendar UI for date selection (21-day limit for therapists)
3. ✅ Time slot grid for time selection
4. ✅ Patient dashboard shows credit requirement alert
5. ✅ Sessions page shows "Credit Required" badge

---

## 📊 How the Credit System Works

### For Therapist-Scheduled Sessions:
1. **Therapist schedules** → Session created with `credit_used_id = null`
2. **Patient sees session** → Dashboard shows "Credit Required" badge
3. **Patient joins session** → System checks for available credits
4. **Credit deduction** → Automatically deducts 1 credit and updates `credit_used_id`
5. **No credits?** → Error shown, patient must purchase credits first

### For Patient-Booked Sessions:
- Credits are deducted immediately during booking
- Uses the existing `create_session_with_credit_deduction` function

---

## 🐛 Troubleshooting

### Error: "Could not find column in schema cache"
**Solution:** You haven't run the migration yet. Go back to Step 1.

### Error: "Therapist ID is required"
**Solution:** Make sure you're logged in as a therapist when testing.

### Error: "Failed to fetch client data"
**Solution:** Make sure you have completed at least one session with a patient first.

### Sessions not showing on patient dashboard
**Solution:** Check that:
1. Session status is 'scheduled'
2. Session belongs to the correct patient (user_id)
3. The patient has the therapist's session in their account

---

## 📁 Modified Files

### API Routes:
- `/app/api/therapist/schedule-next-session/route.ts` - Session creation endpoint
- `/app/api/therapist/clients/route.ts` - Fixed user_type filter

### Components:
- `/components/post-session-modal.tsx` - Added "Schedule Next Session" button
- `/components/schedule-next-session-modal.tsx` - New modal component
- `/app/dashboard/sessions/page.tsx` - Added credit badge
- `/app/dashboard/page.tsx` - Added credit requirement alert
- `/app/therapist/dashboard/create-session/page.tsx` - Calendar UI

### Library:
- `/lib/session-management-server.ts` - Credit deduction logic

---

## ✨ Features Summary

### For Therapists:
- ✅ Schedule follow-up sessions after completing a session
- ✅ Select any date within 21 days
- ✅ Choose from standard time slots
- ✅ Add optional session notes
- ✅ View clients who have had sessions
- ✅ Track scheduled sessions in dashboard

### For Patients:
- ✅ See therapist-scheduled sessions on dashboard
- ✅ Clear "Credit Required" indicators
- ✅ Automatic credit deduction when joining
- ✅ Can still book regular sessions anytime
- ✅ 7-day booking window for self-booking

---

## 🎓 Next Steps

After running the migration:
1. Test the complete flow (book → complete → schedule next)
2. Verify credits are deducted correctly
3. Check that both therapist and patient see the sessions
4. Test with multiple patients to ensure isolation

---

## 📞 Need Help?

If you encounter any issues:
1. Check the browser console for error messages
2. Check the terminal where `npm run dev` is running
3. Verify the migration ran successfully
4. Check Supabase logs in the dashboard

**Ready to go!** Run the migration and test the feature! 🚀

