/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Output configuration for Docker deployment
  output: 'standalone',
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api',
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'AirTrack',
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  },

  // Image optimization
  images: {
    domains: ['openweathermap.org'],
    formats: ['image/webp', 'image/avif'],
  },

  // Trailing slash
  trailingSlash: false,

  // Compression
  compress: true,

  // Remove powered by header
  poweredByHeader: false,

  // Generate build ID
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Optimize bundle
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        commons: {
          name: 'commons',
          chunks: 'all',
          minChunks: 2,
        },
      },
    };

    return config;
  },

  // Experimental features
  experimental: {
    optimizeCss: true,
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 