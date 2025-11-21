/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
      'firebasestorage.googleapis.com', // Firebase Storage domain
      '127.0.0.1',
      'i.postimg.cc',
      'via.placeholder.com'
    ],
    remotePatterns: [
      { protocol: 'https', hostname: 'source.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'storage.googleapis.com', pathname: '/**' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.firebasestorage.app', pathname: '/**' }, // New Firebase Storage domain pattern
      { protocol: 'https', hostname: 'i.postimg.cc', pathname: '/**' },
      { protocol: 'https', hostname: 'via.placeholder.com', pathname: '/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '9188', pathname: '/**' },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { fs: false };
    }
    return config;
  },
};

module.exports = nextConfig;