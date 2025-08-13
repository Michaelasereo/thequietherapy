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
    }
  },
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  webpack: (config, { isServer }) => {
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
}

module.exports = nextConfig
