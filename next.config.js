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
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // XSS protection for older browsers
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // HSTS - enforce HTTPS (1 year)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // Control referrer information
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Restrict browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          // Content Security Policy - balanced for functionality
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseio.com https://*.googleapis.com https://js.stripe.com https://*.mux.com https://www.gstatic.com https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https: http://127.0.0.1:*",
              "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://firestore.googleapis.com https://*.cloudfunctions.net https://api.stripe.com https://*.mux.com https://*.litix.io wss://*.firebaseio.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
              "frame-src 'self' https://js.stripe.com https://*.firebaseapp.com",
              "media-src 'self' https://*.mux.com blob:",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
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
  // Hungarian URL rewrites: new Hungarian URLs → existing route files
  async rewrites() {
    return [
      // Phase 2: Auth routes
      { source: '/bejelentkezes', destination: '/login' },
      { source: '/regisztracio', destination: '/register' },
      // Phase 3: Company dashboard routes
      { source: '/vallalkozas/kezdolap', destination: '/company/dashboard' },
      { source: '/vallalkozas/kezdolap/:path*', destination: '/company/dashboard/:path*' },
      { source: '/vallalkozas/meghivo/:token', destination: '/company/invite/:token' },
      // Phase 4: Course type prefixed routes
      { source: '/webinar/:slug', destination: '/courses/:slug' },
      { source: '/webinar/:slug/player/:lessonId', destination: '/courses/:slug/player/:lessonId' },
      { source: '/webinar/:slug/enroll', destination: '/courses/:slug/enroll' },
      { source: '/webinar/:slug/purchase', destination: '/courses/:slug/purchase' },
      { source: '/webinar/:slug/learn', destination: '/courses/:slug/learn' },
      { source: '/webinar/:slug/preview', destination: '/courses/:slug/preview' },
      { source: '/webinar/:slug/preview/lesson/:lessonId', destination: '/courses/:slug/preview/lesson/:lessonId' },
      { source: '/masterclass/:slug', destination: '/courses/:slug' },
      { source: '/masterclass/:slug/player/:lessonId', destination: '/courses/:slug/player/:lessonId' },
      { source: '/masterclass/:slug/enroll', destination: '/courses/:slug/enroll' },
      { source: '/masterclass/:slug/purchase', destination: '/courses/:slug/purchase' },
      { source: '/masterclass/:slug/learn', destination: '/courses/:slug/learn' },
      { source: '/masterclass/:slug/preview', destination: '/courses/:slug/preview' },
      { source: '/masterclass/:slug/preview/lesson/:lessonId', destination: '/courses/:slug/preview/lesson/:lessonId' },
      { source: '/akademia/:slug', destination: '/courses/:slug' },
      { source: '/akademia/:slug/player/:lessonId', destination: '/courses/:slug/player/:lessonId' },
      { source: '/akademia/:slug/enroll', destination: '/courses/:slug/enroll' },
      { source: '/akademia/:slug/purchase', destination: '/courses/:slug/purchase' },
      { source: '/akademia/:slug/learn', destination: '/courses/:slug/learn' },
      { source: '/akademia/:slug/preview', destination: '/courses/:slug/preview' },
      { source: '/akademia/:slug/preview/lesson/:lessonId', destination: '/courses/:slug/preview/lesson/:lessonId' },
      { source: '/podcast/:slug', destination: '/courses/:slug' },
      { source: '/podcast/:slug/player/:lessonId', destination: '/courses/:slug/player/:lessonId' },
      { source: '/podcast/:slug/enroll', destination: '/courses/:slug/enroll' },
      { source: '/podcast/:slug/purchase', destination: '/courses/:slug/purchase' },
      { source: '/podcast/:slug/learn', destination: '/courses/:slug/learn' },
      { source: '/podcast/:slug/preview', destination: '/courses/:slug/preview' },
      { source: '/podcast/:slug/preview/lesson/:lessonId', destination: '/courses/:slug/preview/lesson/:lessonId' },
    ];
  },
  // Hungarian URL redirects: old English URLs → new Hungarian URLs (301)
  async redirects() {
    return [
      // Phase 2: Auth redirects
      { source: '/login', destination: '/bejelentkezes', permanent: true },
      { source: '/register', destination: '/regisztracio', permanent: true },
      // Phase 3: Company dashboard redirects
      { source: '/company/dashboard', destination: '/vallalkozas/kezdolap', permanent: true },
      { source: '/company/dashboard/:path*', destination: '/vallalkozas/kezdolap/:path*', permanent: true },
      { source: '/company/invite/:token', destination: '/vallalkozas/meghivo/:token', permanent: true },
    ];
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
