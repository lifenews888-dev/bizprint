import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['192.168.1.9', '192.168.0.154'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.bizprint.mn' },
      { protocol: 'https', hostname: '**.ngrok-free.dev' },
    ],
  },
};

export default nextConfig;
