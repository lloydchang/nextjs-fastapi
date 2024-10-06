// File: next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/py/:path*",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://localhost:8000/api/py/:path*"
            : "/api/",
      },
      {
        source: "/docs",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://localhost:8000/api/py/docs"
            : "/api/py/docs",
      },
      {
        source: "/openapi.json",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://localhost:8000/api/py/openapi.json"
            : "/api/py/openapi.json",
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
      
      // Ignore problematic packages
      config.externals = [...(config.externals || []), 
        '@mapbox/node-pre-gyp', 
        '@tensorflow/tfjs-node'
      ];
    }
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,  // Disable TypeScript build errors during development
  },
  eslint: {
    ignoreDuringBuilds: true,  // Optional: Disable ESLint during build (if needed)
  },
};

module.exports = nextConfig;
