# Daily.co Webhook Setup Guide

## 🔧 **Step-by-Step Webhook Configuration**

### **Step 1: Determine Your Webhook URL**

Your webhook URL will be:
```
https://thequietherapy.live/api/daily/webhook
```

**For Development (localhost):**
- Use ngrok to expose your local server: `https://your-ngrok-url.ngrok.io/api/daily/webhook`

**For Production:**
- Use your actual domain: `https://thequietherapy.live/api/daily/webhook`

### **Step 2: Configure Daily.co Webhook**

**Note:** Daily.co webhooks are configured via API, not through the dashboard UI.

#### **Option A: Using the Setup Script (Recommended)**

1. **For Local Development (with ngrok):**
   ```bash
   # Start ngrok in a separate terminal
   ngrok http 3000
   
   # Use the ngrok URL to set up webhook
   node scripts/setup-daily-webhook-ngrok.js https://your-ngrok-url.ngrok.io
   ```

2. **For Production:**
   ```bash
   # Make sure your domain is accessible first
   node scripts/setup-daily-webhook.js
   ```

#### **Option B: Manual API Configuration**

1. **Get your API key** from Daily.co dashboard (Developers section)
2. **Use curl to create webhook:**
   ```bash
   curl -X POST https://api.daily.co/v1/webhooks \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://thequietherapy.live/api/daily/webhook"
     }'
   ```

3. **Test the webhook:**
   ```bash
   curl -X POST https://api.daily.co/v1/webhooks/WEBHOOK_ID/test \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "event": "recording.finished",
       "data": {
         "id": "test-recording-id",
         "room_name": "trpi-session-test-123",
         "download_url": "https://example.com/recording.mp4",
         "duration": 1800
       }
     }'
   ```

### **Step 3: Database Setup**

Before using the webhook, ensure the required database tables exist:

```sql
-- Run this SQL in your Supabase SQL editor
-- (The create-session-processing-queue.sql file contains the complete setup)
```

### **Step 4: Test the Webhook**

1. **Test with curl:**
   ```bash
   curl -X POST https://thequietherapy.live/api/daily/webhook \
     -H "Content-Type: application/json" \
     -d '{
       "event": "recording.finished",
       "data": {
         "id": "test-recording-id",
         "room_name": "trpi-session-test-123",
         "download_url": "https://example.com/recording.mp4",
         "duration": 1800
       }
     }'
   ```

2. **Check your server logs** to see if the webhook is received
3. **Check the database** for entries in `session_processing_queue` table

### **Step 5: AI Processing Architecture**

The new webhook architecture uses a queue-based system:

1. **Webhook receives recording events** and queues them for processing
2. **Separate AI processing endpoint** handles the heavy computation
3. **Queue processing endpoint** can be called by cron jobs or manually

#### **Manual AI Processing:**
```bash
# Process a specific session
curl -X POST https://thequietherapy.live/api/sessions/process-ai \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "your-session-id",
    "recordingId": "your-recording-id"
  }'

# Process queued sessions
curl -X POST https://thequietherapy.live/api/sessions/process-queue
```

### **Step 6: For Local Development (ngrok)**

If you're testing locally:

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   # or download from https://ngrok.com/
   ```

2. **Start ngrok:**
   ```bash
   ngrok http 3000
   ```

3. **Use the ngrok URL:**
   - Copy the HTTPS URL from ngrok (e.g., `https://abc123.ngrok.io`)
   - Use this as your webhook URL: `https://abc123.ngrok.io/api/daily/webhook`

### **Step 7: Verify Webhook Configuration**

1. **Check webhook status in Daily.co dashboard**
2. **Test with a real recording:**
   - Start a video call
   - End the call to trigger recording
   - Check if webhook events are received
   - Verify entries appear in `session_processing_queue`

### **Step 8: Monitor Webhook Events**

Your webhook will receive these events:

#### **recording.started**
```json
{
  "event": "recording.started",
  "data": {
    "id": "recording-id",
    "room_name": "trpi-session-123",
    "started_at": "2024-01-15T10:00:00Z"
  }
}
```

#### **recording.finished**
```json
{
  "event": "recording.finished",
  "data": {
    "id": "recording-id",
    "room_name": "trpi-session-123",
    "download_url": "https://daily.co/recordings/recording-id.mp4",
    "duration": 1800,
    "finished_at": "2024-01-15T10:30:00Z"
  }
}
```

#### **recording.failed**
```json
{
  "event": "recording.failed",
  "data": {
    "id": "recording-id",
    "room_name": "trpi-session-123",
    "error": "Recording failed due to insufficient storage"
  }
}
```

### **Step 9: Troubleshooting**

#### **Common Issues:**

1. **Webhook not receiving events:**
   - Check if your server is accessible from the internet
   - Verify the webhook URL is correct
   - Check server logs for errors

2. **Build errors:**
   - The webhook route has been simplified to avoid build-time import issues
   - AI processing is now handled separately via `/api/sessions/process-ai`

3. **CORS issues:**
   - Ensure your API endpoint handles CORS properly
   - Add appropriate headers in your webhook handler

4. **Database errors:**
   - Ensure the `session_processing_queue` and `session_processing_errors` tables exist
   - Check RLS policies are configured correctly

#### **Security Considerations:**

1. **Webhook Signing (Optional):**
   - Enable webhook signing in Daily.co dashboard
   - Verify webhook signatures in your code

2. **Rate Limiting:**
   - Implement rate limiting for webhook endpoints
   - Handle duplicate events gracefully

### **Step 10: Production Deployment**

When deploying to production:

1. **Update webhook URL** to your production domain
2. **Enable webhook signing** for security
3. **Set up monitoring** for webhook failures
4. **Implement retry logic** for failed webhook processing
5. **Set up cron jobs** to process the queue regularly

### **Step 11: Testing the Complete Flow**

1. **Start a video call** with session parameters:
   ```
   /video-call?room=test-session&participant=Therapist&sessionId=test-123&isTherapist=true
   ```

2. **End the call** to trigger recording completion

3. **Check webhook processing:**
   - Monitor server logs
   - Check database for session updates
   - Verify queue entries are created

4. **Process AI analysis:**
   - Call `/api/sessions/process-queue` to process pending sessions
   - Check database for session notes generation

5. **View results** in the session notes panel

### **Step 12: Monitoring and Logs**

Monitor these endpoints for debugging:

- `/api/daily/webhook` - Webhook events
- `/api/sessions/process-ai` - AI processing status
- `/api/sessions/process-queue` - Queue processing
- `/api/sessions/[id]/notes` - Session notes

Check server logs for:
- Webhook receipt
- Queue processing status
- AI processing status
- Database updates
- Error messages

---

## 🎯 **Quick Setup Checklist**

- [ ] Determine your webhook URL
- [ ] Configure webhook in Daily.co dashboard
- [ ] Set up database tables (`session_processing_queue`, `session_processing_errors`)
- [ ] Test webhook with curl
- [ ] Verify webhook events are received
- [ ] Test queue processing
- [ ] Test complete video call flow
- [ ] Monitor AI processing
- [ ] Check session notes generation

---

**Need Help?**
- Check Daily.co documentation: https://docs.daily.co/reference/rest-api/webhooks
- Monitor your server logs for webhook events
- Test with the provided curl commands
- Check the database for queue entries and processing status
