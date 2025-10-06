# Environment Setup Guide

## 🚨 Supabase Configuration Required

The error you're seeing (`supabaseKey is required`) indicates that your Supabase environment variables are not configured. Here's how to fix it:

## Step 1: Create Environment File

Create a `.env.local` file in your project root with the following content:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Daily.co Configuration (for video sessions)
DAILY_API_KEY=your-daily-api-key
DAILY_DOMAIN=your-daily-domain.daily.co

# Email Configuration (for magic links)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# App Configuration
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

## Step 2: Get Supabase Credentials

### From Supabase Dashboard:
1. Go to your Supabase project dashboard
2. Click on "Settings" → "API"
3. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### Example:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://frzciymslvpohhyefmtr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 3: Restart Development Server

After creating the `.env.local` file:

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

## Step 4: Verify Configuration

Check if the environment variables are loaded:

```javascript
// Add this to any component temporarily to test
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set')
```

## Common Issues & Solutions

### Issue 1: Environment variables not loading
**Solution:** Make sure the file is named `.env.local` (not `.env`) and is in the project root.

### Issue 2: Still getting "supabaseKey is required"
**Solution:** 
1. Check that the environment variables are correctly named
2. Restart the development server
3. Clear browser cache

### Issue 3: Database connection errors
**Solution:** Verify your Supabase project is active and the credentials are correct.

## Quick Test

After setting up the environment variables, test the connection:

```javascript
// Add this to a component to test
import { supabase } from '@/lib/supabase'

useEffect(() => {
  const testConnection = async () => {
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1)
      if (error) {
        console.error('Supabase connection error:', error)
      } else {
        console.log('✅ Supabase connection successful')
      }
    } catch (err) {
      console.error('❌ Supabase connection failed:', err)
    }
  }
  
  testConnection()
}, [])
```

## Security Notes

- Never commit `.env.local` to version control
- The `SUPABASE_SERVICE_ROLE_KEY` has admin privileges - keep it secure
- Use different keys for development and production

## Production Deployment

For production deployment, set these environment variables in your hosting platform:
- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Environment Variables
- Railway: Project Settings → Variables

The error should be resolved once you have the proper Supabase configuration in place! 🚀
