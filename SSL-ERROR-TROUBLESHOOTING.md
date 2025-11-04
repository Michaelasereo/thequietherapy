# 🔒 SSL Protocol Error Troubleshooting Guide

## **Error: `ERR_SSL_PROTOCOL_ERROR`**

This error occurs when the browser cannot establish a secure SSL/TLS connection with the server.

## **Common Causes:**

1. **Netlify SSL Certificate Issues**
   - Certificate not properly configured
   - Certificate expired
   - Certificate not yet issued for the domain

2. **Mixed Content (HTTP/HTTPS)**
   - HTTP resources loaded on HTTPS page
   - Hardcoded HTTP URLs in code

3. **CDN/Edge Network Issues**
   - Netlify CDN configuration problems
   - Edge function SSL issues

4. **DNS Issues**
   - DNS not fully propagated
   - DNS pointing to wrong server

## **Solutions:**

### **1. Check Netlify SSL Certificate Status**

**In Netlify Dashboard:**
1. Go to **Site Settings** → **Domain Management**
2. Check if SSL certificate is **Active** and **Valid**
3. If certificate shows "Provisioning" or "Pending", wait for it to complete
4. If expired, click **Renew Certificate**

### **2. Force HTTPS Redirect in Netlify**

**Add to `netlify.toml`:**

```toml
[[redirects]]
  from = "http://thequietherapy.live/*"
  to = "https://thequietherapy.live/:splat"
  status = 301
  force = true

[[redirects]]
  from = "http://www.thequietherapy.live/*"
  to = "https://thequietherapy.live/:splat"
  status = 301
  force = true
```

### **3. Verify Environment Variables**

Ensure these are set in **Netlify Dashboard** → **Site Settings** → **Environment Variables**:

```bash
NEXT_PUBLIC_APP_URL=https://thequietherapy.live
NODE_ENV=production
```

### **4. Check for Mixed Content**

Search for any hardcoded HTTP URLs in your code:

```bash
# Search for hardcoded HTTP URLs
grep -r "http://" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"
```

**Fix:** Use relative URLs or `process.env.NEXT_PUBLIC_APP_URL` for API calls.

### **5. Clear Browser Cache & Cookies**

**Try in Incognito/Private Mode:**
- Clear browser cache
- Clear cookies for `thequietherapy.live`
- Try different browser

### **6. Check DNS Propagation**

Verify DNS is pointing to Netlify:

```bash
# Check DNS records
dig thequietherapy.live
nslookup thequietherapy.live

# Should point to Netlify's IPs
```

### **7. Verify Netlify Site Settings**

**In Netlify Dashboard:**
1. **Site Settings** → **Build & Deploy** → **Build Settings**
   - Ensure **Build command** is correct: `npm run build`
   - Ensure **Publish directory** is: `.next`

2. **Site Settings** → **Domain Management**
   - Ensure **Primary domain** is set to `thequietherapy.live`
   - Ensure **HTTPS** is enabled

### **8. Check Netlify SSL Certificate Type**

**In Netlify Dashboard:**
1. **Site Settings** → **Domain Management** → **HTTPS**
2. Ensure **Certificate** type is **Let's Encrypt** (free) or **Custom**
3. If using custom domain, ensure DNS is properly configured

### **9. Temporary Workaround: Use Netlify's Default Domain**

If the issue persists, try accessing via Netlify's default domain:

```
https://[site-name].netlify.app
```

If this works, the issue is with the custom domain configuration.

### **10. Contact Netlify Support**

If none of the above works:

1. **Netlify Support**: https://www.netlify.com/support/
2. **Community Forum**: https://answers.netlify.com/
3. **Status Page**: https://www.netlifystatus.com/

## **Quick Fixes:**

### **Fix 1: Add HTTPS Redirect to netlify.toml**

```toml
[[redirects]]
  from = "http://*"
  to = "https://thequietherapy.live/:splat"
  status = 301
  force = true
```

### **Fix 2: Update Next.js Config for Production**

Ensure `next.config.js` has proper security headers (already configured).

### **Fix 3: Verify All API Calls Use Relative URLs**

**Bad:**
```typescript
fetch('http://thequietherapy.live/api/...')
```

**Good:**
```typescript
fetch('/api/...')  // Relative URL
// OR
fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/...`)
```

## **Prevention:**

1. **Always use relative URLs** for API calls in production
2. **Set environment variables** in Netlify dashboard
3. **Enable HTTPS** in Netlify domain settings
4. **Test SSL** using: https://www.ssllabs.com/ssltest/

## **Monitoring:**

- **Netlify Function Logs**: Check for SSL-related errors
- **Browser Console**: Check for mixed content warnings
- **Network Tab**: Check for failed requests with SSL errors

