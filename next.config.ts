import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production'

const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // Required for GitHub Pages deployment
  },
  assetPrefix: isProd ? '/Ye-Old-Weather-Dashboard/' : '',
  basePath: isProd ? '/Ye-Old-Weather-Dashboard' : '',
  output: 'export'
} 

export default nextConfig
