/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false, // Keep this false to catch actual errors
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    },
  },
  // Output configuration for Netlify
  output: 'standalone',
  // Security Headers Configuration
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // HTTPS Enforcement
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com https://*.daily.co https://thequietherapy.daily.co https://challenges.cloudflare.com https://*.cloudflare.com",
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.supabase.co https://api.stripe.com https://checkout.stripe.com wss://*.supabase.co https://*.daily.co wss://*.daily.co https://thequietherapy.daily.co wss://thequietherapy.daily.co https://challenges.cloudflare.com https://*.cloudflare.com",
              "frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://*.daily.co https://thequietherapy.daily.co https://challenges.cloudflare.com https://*.cloudflare.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'"
            ].join('; ')
          },
          // XSS Protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Content Type Sniffing Protection
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Permissions Policy
          {
            key: 'Permissions-Policy',
            value: 'camera=*, microphone=*, geolocation=(), payment=()'
          },
          // X-Frame-Options (for older browsers)
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          }
        ]
      },
      // Additional headers for API routes
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          }
        ]
      }
    ]
  },
  webpack: (config, { isServer }) => {
    // Ensure path resolution works correctly for Netlify
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, './'),
    }
    
    if (!isServer) {
      // Don't resolve 'fs' module on the client to prevent this error on build --> Error: Can't resolve 'fs'
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    
    // Ignore critical dependency warnings for Supabase
    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
    ]
    
    return config;
  },
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
}

module.exports = nextConfig
