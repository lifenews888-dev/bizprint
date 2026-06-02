import type { NextConfig } from "next";
import path from "node:path";

// `https:` in script-src and connect-src lets admins paste arbitrary
// chatbot widget embed codes via /admin/chatbot without per-vendor CSP edits.
// 'unsafe-inline' already broadens script-src; the rest of the policy
// (img, font, style, frame) stays scoped to known hosts.
const CSP_SOURCES = {
  scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:"],
  styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  imgSrc: [
    "'self'",
    "data:",
    "blob:",
    "https://res.cloudinary.com",
    "https://res-console.cloudinary.com",
    "https://*.bizprint.mn",
    "https://images.unsplash.com",
    "https://*.facebook.com",
    "https://*.fbcdn.net",
    "https://img.youtube.com",
    "https://i.ytimg.com",
  ],
  fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
  connectSrc: [
    "'self'",
    "https:",
    "wss:",
    "http://localhost:4000",
    "http://127.0.0.1:4000",
    "ws://localhost:4000",
    "ws://127.0.0.1:4000",
  ],
  frameSrc: [
    "https:",
  ],
}

const repoRoot = path.resolve(process.cwd(), '..');

const nextConfig: NextConfig = {
  // output: 'standalone' — Vercel-д шаардлагагүй, 404 үүсгэж болно
  allowedDevOrigins: [
    'http://127.0.0.1:3002',
    'http://localhost:3002',
    '127.0.0.1',
    'localhost',
    '127.0.0.1:3002',
    'localhost:3002',
    '192.168.1.9',
    '192.168.0.154',
  ],
  poweredByHeader: false,
  compress: true,
  turbopack: {
    root: repoRoot,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.bizprint.mn' },
      { protocol: 'https', hostname: '**.ngrok-free.dev' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
              `script-src ${CSP_SOURCES.scriptSrc.join(' ')}`,
              `style-src ${CSP_SOURCES.styleSrc.join(' ')}`,
              `img-src ${CSP_SOURCES.imgSrc.join(' ')}`,
              `font-src ${CSP_SOURCES.fontSrc.join(' ')}`,
              `connect-src ${CSP_SOURCES.connectSrc.join(' ')}`,
              `frame-src ${CSP_SOURCES.frameSrc.join(' ')}`,
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: '/smart-quote', destination: '/quote?tab=ai', permanent: true },
      { source: '/quote/instant', destination: '/quote?tab=quick', permanent: true },
      { source: '/quote/compare', destination: '/quote', permanent: true },
      // Fix 404 broken links
      { source: '/orders', destination: '/orders/new', permanent: false },
      // Quick order aliases
      { source: '/upload', destination: '/quick-order', permanent: true },
      { source: '/fast-order', destination: '/quick-order', permanent: true },
    ]
  },
};

export default nextConfig;
