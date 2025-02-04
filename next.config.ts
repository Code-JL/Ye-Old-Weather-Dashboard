import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  assetPrefix: isProd ? '/Ye-Old-Weather-Dashboard' : '',
  basePath: isProd ? '/Ye-Old-Weather-Dashboard' : '',
  trailingSlash: true,
  // Disable static optimization for pages that use client-side features
  staticPageGenerationTimeout: 120,
}; 

export default nextConfig;
