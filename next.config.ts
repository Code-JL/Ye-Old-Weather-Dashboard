import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Disable static optimization for pages that use client-side features
  staticPageGenerationTimeout: 300,
}; 

export default nextConfig;
