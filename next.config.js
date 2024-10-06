const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Ignore .cs files using null-loader
    config.module.rules.push({
      test: /\.cs$/,
      use: 'null-loader',
    });

    // Client-side specific configurations
    if (!isServer) {
      // Exclude @mapbox/node-pre-gyp from the client-side build
      config.externals = [
        ...(config.externals || []),
        { '@mapbox/node-pre-gyp': 'commonjs @mapbox/node-pre-gyp' }
      ];

      // Configure fallback for unsupported Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        http: false,
        https: false,
        stream: false,
        zlib: false,
        net: false,
        tls: false,
      };

      // Use shim for TensorFlow Node.js modules
      // config.resolve.alias = {
      //   ...config.resolve.alias,
      //   '@tensorflow/tfjs-node': path.resolve(__dirname, 'tensorflow-shim.js'),
      // };
    }

    // Ignore .html files using null-loader
    config.module.rules.push({
      test: /\.html$/,
      use: 'null-loader',
    });

    // Ignore TensorFlow.js Node-specific warnings
    config.module.rules.push({
      test: /@tensorflow[\\/]tfjs-node[\\/]/,
      use: 'null-loader',
    });

    return config;
  },
};

module.exports = nextConfig;
