import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Only run ESLint on these directories during production builds
    dirs: ['src'],
    // Don't fail the build on ESLint warnings/errors during production
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Don't fail build on TypeScript errors (we still want to see them)
    ignoreBuildErrors: false,
  },
  // Use standalone output to properly handle dynamic pages with Clerk
  output: 'standalone',
};

export default nextConfig;
