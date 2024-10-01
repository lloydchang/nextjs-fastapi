/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => {
    return [
      {
        source: "/fastapi/py/:path*",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8000/fastapi/py/:path*"
            : "/fastapi/",
      },
      {
        source: "/docs",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8000/fastapi/py/docs"
            : "/fastapi/py/docs",
      },
      {
        source: "/openapi.json",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8000/api/py/openapi.json"
            : "/api/py/openapi.json",
      },
    ];
  },
};

// module.exports = nextConfig;

module.exports = {
  typescript: {
    ignoreBuildErrors: true,  // Disable TypeScript build errors
  },
  eslint: {
    ignoreDuringBuilds: true,  // Optional: Disable ESLint during build (if needed)
  },
};

