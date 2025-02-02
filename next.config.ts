import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  assetPrefix: isProd ? '/Ye-Old-Weather-Dashboard/' : '',
  basePath: isProd ? '/Ye-Old-Weather-Dashboard' : '',
  trailingSlash: true,
} 

export default nextConfig
