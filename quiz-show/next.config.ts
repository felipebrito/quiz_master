import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    PORT: '3001'
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
