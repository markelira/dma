/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: false, // Disabled for Framer Motion animations compatibility
  generateBuildId: async () => {
    // Use git commit hash as build ID
    return process.env.VERCEL_GIT_COMMIT_SHA || 'development';
  },
  images: {
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
  // Experimental: serverComponentsExternalPackages
  serverExternalPackages: ['unframer'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { fs: false };
    }

    // On server side, externalize unframer to prevent Html import issues
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'unframer': 'unframer',
      });
    }

    return config;
  },
};

module.exports = nextConfig;
