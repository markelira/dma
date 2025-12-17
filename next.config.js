/** @type {import('next').NextConfig} */
const path = require('path');

// Bundle analyzer for performance debugging
// Run with: ANALYZE=true npm run build
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  reactStrictMode: false, // Disabled for Framer Motion animations compatibility
  generateBuildId: async () => {
    // Use git commit hash as build ID
    return process.env.VERCEL_GIT_COMMIT_SHA || 'development';
  },
  images: {
    // Modern formats for better compression (AVIF is 50% smaller than WebP)
    formats: ['image/avif', 'image/webp'],
    // Optimized device sizes for common breakpoints
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    // Image sizes for srcset generation
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Cache optimized images for 30 days
    minimumCacheTTL: 2592000,
    domains: [
      'images.unsplash.com',
      'source.unsplash.com',
      'localhost',
      'storage.googleapis.com',
      'firebasestorage.googleapis.com',
      '127.0.0.1',
      'i.postimg.cc',
      'via.placeholder.com',
      'framerusercontent.com',
      'fonts.gstatic.com',
    ],
    remotePatterns: [
      { protocol: 'https', hostname: 'source.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'storage.googleapis.com', pathname: '/**' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.firebasestorage.app', pathname: '/**' },
      { protocol: 'https', hostname: 'i.postimg.cc', pathname: '/**' },
      { protocol: 'https', hostname: 'via.placeholder.com', pathname: '/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '9188', pathname: '/**' },
      { protocol: 'https', hostname: 'framerusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.framerusercontent.com', pathname: '/**' },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Transpile unframer to handle next/document imports
  transpilePackages: ['unframer'],
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = { fs: false };
    }

    // Only replace next/document when imported by unframer
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^next\/document$/,
        (resource) => {
          // Only replace if the import is coming from unframer
          if (resource.context && resource.context.includes('unframer')) {
            resource.request = path.resolve(__dirname, 'src/lib/next-document-mock.js');
          }
        }
      )
    );

    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
