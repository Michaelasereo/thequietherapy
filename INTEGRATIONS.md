# Trpi Platform Integrations

## Payment Processing
- **Paystack**: Primary payment gateway for Nigeria
  - Individual user credit purchases
  - Partner bulk member payments
  - Session payments
  - Webhook handling for payment confirmations

## Email Services
- **Brevo (formerly Sendinblue)**: Email delivery and templates
  - User registration verification emails
  - Partner CSV upload verification emails
  - Session reminders
  - Payment confirmations
  - Password reset emails

## Video Conferencing
- **Daily.co**: Video call infrastructure
  - In-app therapy sessions
  - Screen sharing capabilities
  - Recording (optional, with consent)
  - Waiting room functionality

## Calendar Integration
- **Google Calendar API**: Calendar sync
  - Session reminders
  - Therapist availability sync
  - Client calendar integration
  - Automated scheduling

## Additional Integrations (Future)

### SMS Notifications
- **Twilio**: SMS reminders and notifications
  - Session reminders
  - Payment confirmations
  - Emergency notifications

### File Storage
- **AWS S3** or **Cloudinary**: Document storage
  - Therapist verification documents
  - Session notes attachments
  - User profile pictures

### Analytics
- **Google Analytics**: User behavior tracking
- **Mixpanel**: Product analytics
- **Hotjar**: User experience insights

### Customer Support
- **Intercom** or **Zendesk**: Customer support chat
- **Crisp**: Live chat for immediate assistance

### Database
- **PostgreSQL**: Primary database
- **Redis**: Caching and sessions
- **MongoDB**: Document storage (optional)

### Monitoring
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **Uptime Robot**: Service monitoring

## API Keys Required

### Environment Variables
```env
# Paystack
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...

# Brevo
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=noreply@trpi.com

# Daily.co
DAILY_API_KEY=your_daily_api_key
DAILY_ROOM_URL=https://your-domain.daily.co

# Google Calendar
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://trpi.com/auth/google/callback

# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# File Storage
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=trpi-uploads
```

## Implementation Priority

### Phase 1 (MVP)
1. Paystack integration for payments
2. Brevo for email verification
3. Basic Daily.co video calls

### Phase 2 (Enhanced)
1. Google Calendar integration
2. Advanced Daily.co features
3. SMS notifications

### Phase 3 (Scale)
1. Advanced analytics
2. Customer support tools
3. Performance monitoring
