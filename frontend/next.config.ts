import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'standalone' — Vercel-д шаардлагагүй, 404 үүсгэж болно
  allowedDevOrigins: ['192.168.1.9', '192.168.0.154'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.bizprint.mn' },
      { protocol: 'https', hostname: '**.ngrok-free.dev' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://res.cloudinary.com https://*.bizprint.mn",
              "font-src 'self' data:",
              "connect-src 'self' https://api.bizprint.mn https://*.bizprint.mn wss://*.bizprint.mn http://localhost:4000 ws://localhost:4000",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
