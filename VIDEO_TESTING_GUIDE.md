# 🎥 Video Features Testing Guide

## 🚀 Pre-Production Testing Checklist

Before pushing to production, ensure all video features are working correctly by following this comprehensive testing guide.

## 📋 Prerequisites

### 1. Environment Variables
Ensure these environment variables are set in your `.env.local`:

```bash
# Daily.co Configuration
DAILY_API_KEY=your_daily_api_key
DAILY_DOMAIN=your_daily_domain

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI Configuration (for transcription)
OPENAI_API_KEY=your_openai_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Database Setup
Run the database setup script in your Supabase SQL editor:

```sql
-- Execute the contents of create-session-processing-queue.sql
```

## 🧪 Testing Steps

### Step 1: Database Verification

```bash
# Test database setup
npm run test:db
```

**Expected Output:**
```
🧪 Testing database setup...

Testing: Check sessions table
✅ Check sessions table - PASSED
Testing: Check session_notes table
✅ Check session_notes table - PASSED
Testing: Check session_processing_queue table
✅ Check session_processing_queue table - PASSED
Testing: Check session_processing_errors table
✅ Check session_processing_errors table - PASSED
Testing: Check notifications table
✅ Check notifications table - PASSED
Testing: Check users table
✅ Check users table - PASSED

==================================================
🎉 All database tests passed!
✅ Your database is ready for video features
```

### Step 2: Start Development Server

```bash
npm run dev
```

### Step 3: Access Video Testing Page

Visit: `http://localhost:3000/test-video-complete-flow`

### Step 4: Run Complete Flow Test

1. **Click "🚀 Run Complete Flow Test"** to test all components
2. **Monitor the test results** in real-time
3. **Check browser console** for detailed logs

## 🔍 Individual Component Tests

### Test 1: Create Room ✅
- **Purpose**: Verify Daily.co room creation
- **Expected**: Room created successfully
- **Error Handling**: Check Daily.co API key and permissions

### Test 2: Get Token ✅
- **Purpose**: Verify meeting token generation
- **Expected**: Valid token returned
- **Error Handling**: Check Daily.co API configuration

### Test 3: Start Recording ✅
- **Purpose**: Verify recording initiation
- **Expected**: Recording started with ID
- **Error Handling**: Check recording permissions

### Test 4: Stop Recording ✅
- **Purpose**: Verify recording completion
- **Expected**: Recording stopped with download URL
- **Error Handling**: Check recording ID validity

### Test 5: Webhook Processing ✅
- **Purpose**: Verify webhook endpoint functionality
- **Expected**: Webhook processed successfully
- **Error Handling**: Check database connectivity

### Test 6: AI Processing ✅
- **Purpose**: Verify AI transcription and analysis
- **Expected**: AI processing initiated
- **Error Handling**: Check OpenAI API key and quotas

### Test 7: Queue Processing ✅
- **Purpose**: Verify background processing queue
- **Expected**: Queue processed successfully
- **Error Handling**: Check queue table permissions

### Test 8: Session Notes ✅
- **Purpose**: Verify session notes retrieval
- **Expected**: Notes retrieved or created
- **Error Handling**: Check session ID validity

## 🚨 Common Issues & Solutions

### Issue 1: Daily.co API Errors
```
Error: Failed to create room
```
**Solutions:**
- Verify `DAILY_API_KEY` is correct
- Check Daily.co account permissions
- Ensure domain is configured correctly

### Issue 2: Database Connection Errors
```
Error: Failed to connect to database
```
**Solutions:**
- Verify Supabase credentials
- Check RLS policies
- Ensure tables exist

### Issue 3: OpenAI API Errors
```
Error: AI processing failed
```
**Solutions:**
- Verify `OPENAI_API_KEY` is valid
- Check OpenAI account quotas
- Ensure API key has proper permissions

### Issue 4: Webhook Processing Errors
```
Error: Webhook failed
```
**Solutions:**
- Check database table permissions
- Verify session ID format
- Ensure queue table exists

## 📊 Test Results Interpretation

### ✅ All Tests Pass
**Status**: Ready for production
**Action**: Proceed with deployment

### ⚠️ Some Tests Fail
**Status**: Needs investigation
**Action**: 
1. Check error messages in console
2. Verify environment variables
3. Test individual components
4. Fix issues before deployment

### ❌ Multiple Tests Fail
**Status**: Not ready for production
**Action**:
1. Review all error messages
2. Check environment setup
3. Verify database configuration
4. Test in isolation

## 🔧 Manual Testing

### Test Real Video Call Flow

1. **Create a test session**:
   ```
   /video-call?room=test-session-123&participant=Therapist&sessionId=test-123&isTherapist=true
   ```

2. **Join the call** in another browser tab

3. **Start recording** via the UI

4. **End the call** to trigger webhook

5. **Check database** for processing queue entries

6. **Process queue** manually:
   ```bash
   curl -X POST http://localhost:3000/api/sessions/process-queue
   ```

7. **Verify session notes** are generated

## 🌐 Production Testing

### Before Deploying

1. **Test with real Daily.co webhooks**:
   ```bash
   curl -X POST https://your-domain.com/api/daily/webhook \
     -H "Content-Type: application/json" \
     -d '{
       "event": "recording.finished",
       "data": {
         "id": "real-recording-id",
         "room_name": "trpi-session-test-123",
         "download_url": "https://daily.co/recordings/real-recording.mp4",
         "duration": 1800
       }
     }'
   ```

2. **Verify webhook processing** in production logs

3. **Test AI processing** with real recordings

4. **Check session notes** generation

### Post-Deployment Verification

1. **Monitor webhook logs** for errors
2. **Check processing queue** status
3. **Verify AI transcription** quality
4. **Test session notes** functionality
5. **Monitor error rates** and performance

## 📝 Testing Checklist

- [ ] Environment variables configured
- [ ] Database tables created
- [ ] Daily.co API working
- [ ] Supabase connection working
- [ ] OpenAI API working
- [ ] Webhook endpoint responding
- [ ] AI processing functional
- [ ] Queue processing working
- [ ] Session notes generation working
- [ ] Real video call tested
- [ ] Production webhook tested
- [ ] Error handling verified
- [ ] Performance acceptable

## 🎯 Success Criteria

Your video features are ready for production when:

1. ✅ All automated tests pass
2. ✅ Manual video call flow works
3. ✅ Webhook processing is reliable
4. ✅ AI transcription quality is acceptable
5. ✅ Session notes are generated correctly
6. ✅ Error handling is robust
7. ✅ Performance meets requirements

## 🚀 Ready to Deploy?

If all tests pass and you've completed the manual testing:

1. **Commit your changes**
2. **Push to your repository**
3. **Deploy to Netlify**
4. **Monitor the deployment**
5. **Test in production environment**

---

**Need Help?**
- Check the console logs for detailed error messages
- Verify all environment variables are set correctly
- Ensure database tables are created and accessible
- Test individual components in isolation
