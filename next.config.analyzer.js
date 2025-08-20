const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  experimental: {
    // Remove if not using Server Components
    serverComponentsExternalPackages: ['mongodb'],
    // Enable SWC minification for better performance
    swcMinify: true,
    // Modern bundling
    esmExternals: true,
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  webpack(config, { dev, isServer }) {
    // Production optimizations
    if (!dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 20,
          },
          games: {
            test: /[\\/]components[\\/]games[\\/]/,
            name: 'games',
            chunks: 'async',
            priority: 10,
          },
          charts: {
            test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2|recharts)[\\/]/,
            name: 'charts',
            chunks: 'async',
            priority: 15,
          },
          motion: {
            test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            name: 'motion',
            chunks: 'async',
            priority: 15,
          },
        },
      }
    }

    if (dev) {
      // Reduce CPU/memory from file watching
      config.watchOptions = {
        poll: 2000, // check every 2 seconds
        aggregateTimeout: 300, // wait before rebuilding
        ignored: ['**/node_modules'],
      };
    }
    
    return config;
  },
  onDemandEntries: {
    maxInactiveAge: 25000, // Increased from 10000
    pagesBufferLength: 2,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *;" },
          { key: "Access-Control-Allow-Origin", value: process.env.CORS_ORIGINS || "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "*" },
          // Performance headers
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Static assets caching
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
