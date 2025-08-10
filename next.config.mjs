/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Handle Supabase realtime dependency issue
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    
    // Ignore critical dependency warnings for Supabase
    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
    ]
    
    return config
  },
}

export default nextConfig
