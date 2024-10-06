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
      // Configure fallback for unsupported Node.js modules in client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };

      // Add the html-loader to process .html files correctly
      config.module.rules.push({
        test: /\.html$/,
        use: ['html-loader'],
      });

    }

    return config;
  },
  typescript: {
    ignoreBuildErrors: true,  // Optional: Disable TypeScript build errors during development
  },
  eslint: {
    ignoreDuringBuilds: true,  // Optional: Disable ESLint during build if not required
  },
};

module.exports = nextConfig;
