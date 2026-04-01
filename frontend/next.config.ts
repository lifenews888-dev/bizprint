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
};

export default nextConfig;
