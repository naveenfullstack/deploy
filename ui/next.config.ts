import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: '',
  assetPrefix: '',
  distDir: 'out',
  // Fix for multiple lockfiles warning
  outputFileTracingRoot: process.cwd()
};

export default nextConfig;
