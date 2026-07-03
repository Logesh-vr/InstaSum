import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from common social media CDNs for thumbnails
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.cdninstagram.com' },
      { protocol: 'https', hostname: '**.instagram.com' },
      { protocol: 'https', hostname: '**.ytimg.com' },
      { protocol: 'https', hostname: '**.yt.be' },
      { protocol: 'https', hostname: '**.tiktokcdn.com' },
      { protocol: 'https', hostname: '**.tiktokcdn-us.com' },
      { protocol: 'https', hostname: 'p16-sign.tiktokcdn-us.com' },
      { protocol: 'https', hostname: 'p77-sign.tiktokcdn-us.com' },
    ],
  },

  // Increase serverless function timeout for Apify + OpenAI pipeline (max 60s on hobby Vercel)
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
